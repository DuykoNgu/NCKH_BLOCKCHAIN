"""
Main entry point for the Flask application
"""
from flask import Flask, request
from flask_cors import CORS
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.NetworkController import network_bp
from app.controllers.v1.NFTController import nft_bp
from app.controllers.v1.TransactionController import transaction_bp
from app.controllers.v1.AdminController import admin_bp
from app.controllers.v1.StorageController import storage_bp
from app.controllers.v1.AuthController import auth_bp
from app.controllers.v1.AccountController import user_bp
from app.controllers.v1.MonitorController import monitor_bp
from app.controllers.v1.ValidatorRegistration import validator_bp
from app.database.database import init_db


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(block_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(nft_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(storage_bp)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(monitor_bp)
    app.register_blueprint(validator_bp)
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Run the application
    app.run(host="127.0.0.1", port=5000, debug=True)