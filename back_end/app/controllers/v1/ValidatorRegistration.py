from flask import request, jsonify, Blueprint
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid
from models.Account import Account
from database.database import db
from utils.logger import logger

# Create blueprint
validator_bp = Blueprint("validator", __name__, url_prefix="/api/v1")

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "../../uploads/agreements")
ALLOWED_EXTENSIONS = {"pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


class ValidatorRegistration(db.Model):
    """Model for validator registrations"""

    __tablename__ = "validator_registrations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_name = db.Column(db.String(255), nullable=False)
    tax_id = db.Column(db.String(50), nullable=False, unique=True)
    representative = db.Column(db.String(255))
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    address_organization = db.Column(db.Text)
    agreement_file_path = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    rejected_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "org_name": self.org_name,
            "tax_id": self.tax_id,
            "representative": self.representative or "",
            "email": self.email,
            "phone": self.phone or "",
            "address_organization": self.address_organization or "",
            "agreement_file_url": f"/uploads/agreements/{os.path.basename(self.agreement_file_path)}",
            "status": self.status,
            "admin_notes": self.admin_notes or "",
            "created_at": self.created_at.isoformat(),
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
        }


@validator_bp.route("/validator-registration", methods=["POST"])
def register_validator():
    """
    Register a new validator node
    Expects: multipart/form-data with file and form fields
    """
    try:
        # Check if file is present
        if "agreement_file" not in request.files:
            return jsonify({"success": False, "message": "File không được tìm thấy"}), 400

        file = request.files["agreement_file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Vui lòng chọn file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Chỉ chấp nhận file PDF"}), 400

        if file.content_length > MAX_FILE_SIZE:
            return jsonify({"success": False, "message": "File vượt quá kích thước cho phép"}), 400

        # Get form data
        org_name = request.form.get("org_name", "").strip()
        tax_id = request.form.get("tax_id", "").strip()
        representative = request.form.get("representative", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        address_organization = request.form.get("address_organization", "").strip()

        # Validate required fields
        if not org_name or not email or not tax_id:
            return jsonify({"success": False, "message": "Thiếu thông tin bắt buộc"}), 400

        # Check if tax_id already exists
        existing = ValidatorRegistration.query.filter_by(tax_id=tax_id).first()
        if existing:
            return jsonify({"success": False, "message": "MST này đã được đăng ký"}), 409

        # Save file
        filename = secure_filename(f"{tax_id}_{uuid.uuid4().hex[:8]}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Create registration record
        registration = ValidatorRegistration(
            org_name=org_name,
            tax_id=tax_id,
            representative=representative,
            email=email,
            phone=phone,
            address_organization=address_organization,
            agreement_file_path=filepath,
            status="pending",
        )

        db.session.add(registration)
        db.session.commit()

        logger.info(f"New validator registration: {tax_id} - {org_name}")

        return jsonify({
            "success": True,
            "message": "Đăng ký thành công",
            "data": {
                "id": registration.id,
                "org_name": registration.org_name,
                "status": registration.status,
            },
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error registering validator: {str(e)}")
        return jsonify({"success": False, "message": "Lỗi server"}), 500


@validator_bp.route("/validator-registrations", methods=["GET"])
def get_validator_registrations():
    """Get all validator registrations (admin only)"""
    try:
        # TODO: Add authentication check for admin

        registrations = ValidatorRegistration.query.order_by(
            ValidatorRegistration.status.asc(), ValidatorRegistration.created_at.desc()
        ).all()

        return jsonify([reg.to_dict() for reg in registrations]), 200

    except Exception as e:
        logger.error(f"Error fetching registrations: {str(e)}")
        return jsonify({"success": False, "message": "Lỗi server"}), 500


@validator_bp.route("/validator-registrations/<registration_id>/approve", methods=["POST"])
def approve_validator_registration(registration_id: str):
    """Approve a validator registration"""
    try:
        # TODO: Add authentication check for admin

        registration = ValidatorRegistration.query.get(registration_id)
        if not registration:
            return jsonify({"success": False, "message": "Đơn đăng ký không tìm thấy"}), 404

        if registration.status != "pending":
            return jsonify({"success": False, "message": "Chỉ có thể phê duyệt các đơn chờ xử lý"}), 409

        data = request.get_json() or {}
        admin_notes = data.get("admin_notes", "").strip()

        registration.status = "approved"
        registration.approved_at = datetime.utcnow()
        registration.admin_notes = admin_notes

        db.session.commit()

        logger.info(f"Approved validator registration: {registration.tax_id}")

        # TODO: Send email notification to the organization

        return jsonify({
            "success": True,
            "message": "Đã phê duyệt đơn đăng ký",
            "data": registration.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error approving registration: {str(e)}")
        return jsonify({"success": False, "message": "Lỗi server"}), 500


@validator_bp.route("/validator-registrations/<registration_id>/reject", methods=["POST"])
def reject_validator_registration(registration_id: str):
    """Reject a validator registration"""
    try:
        # TODO: Add authentication check for admin

        registration = ValidatorRegistration.query.get(registration_id)
        if not registration:
            return jsonify({"success": False, "message": "Đơn đăng ký không tìm thấy"}), 404

        if registration.status != "pending":
            return jsonify({"success": False, "message": "Chỉ có thể từ chối các đơn chờ xử lý"}), 409

        data = request.get_json() or {}
        reason = data.get("reason", "").strip()

        if not reason:
            return jsonify({"success": False, "message": "Vui lòng nhập lý do từ chối"}), 400

        registration.status = "rejected"
        registration.rejected_at = datetime.utcnow()
        registration.admin_notes = reason

        db.session.commit()

        logger.info(f"Rejected validator registration: {registration.tax_id}")

        # TODO: Send email notification to the organization

        return jsonify({
            "success": True,
            "message": "Đã từ chối đơn đăng ký",
            "data": registration.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error rejecting registration: {str(e)}")
        return jsonify({"success": False, "message": "Lỗi server"}), 500


@validator_bp.route("/validator-registrations/status/<tax_id>", methods=["GET"])
def get_registration_status(tax_id: str):
    """Get registration status by tax ID"""
    try:
        registration = ValidatorRegistration.query.filter_by(tax_id=tax_id).first()

        if not registration:
            return jsonify({"success": False, "message": "Không tìm thấy đơn đăng ký"}), 404

        return jsonify({
            "success": True,
            "data": registration.to_dict(),
        }), 200

    except Exception as e:
        logger.error(f"Error fetching registration status: {str(e)}")
        return jsonify({"success": False, "message": "Lỗi server"}), 500
