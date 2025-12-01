import json
import os


class AuthorityManager:
    """
    AuthorityManager chịu trách nhiệm quản lý toàn bộ validator được phép
    ký block theo cơ chế Proof of Authority (PoA).

    - Lưu danh sách validator (public key dạng hex)
    - Kiểm tra validator có quyền hay không
    - Thêm / xoá validator
    - Tự động lưu & load từ file JSON (authority.json)
    - Đảm bảo dữ liệu luôn chặt chẽ, không cho phép pubkey sai format
    """

    def __init__(self, storage_path: str = "authority.json"):
        self.storage_path = storage_path
        self.authorized_validators = set()

        # Load dữ liệu từ file khi khởi tạo
        self._load_from_file()

    # =====================================================================
    # Internal file I/O
    # =====================================================================
    def _save_to_file(self):
        """Lưu danh sách validator ra file JSON."""
        data = {
            "validators": list(self.authorized_validators)
        }

        with open(self.storage_path, "w") as f:
            json.dump(data, f, indent=2)

    def _load_from_file(self):
        """Tải validator từ file nếu tồn tại."""
        if not os.path.exists(self.storage_path):
            return  # Chưa có file -> bỏ qua

        try:
            with open(self.storage_path, "r") as f:
                data = json.load(f)
                self.authorized_validators = set(data.get("validators", []))
        except Exception:
            print("AuthorityManager: error reading file, using empty list.")
            self.authorized_validators = set()

    # =====================================================================
    # Validator management (public API)
    # =====================================================================
    def add_validator(self, pubkey_hex: str) -> bool:
        """
        Add a validator to the PoA authority list.
        Returns True if added successfully, False if already exists.
        """

        # --- VALIDATION ---
        if not isinstance(pubkey_hex, str) or len(pubkey_hex) < 64:
            raise ValueError("pubkey_hex không hợp lệ!")

        if pubkey_hex in self.authorized_validators:
            return False  # đã tồn tại

        self.authorized_validators.add(pubkey_hex)
        self._save_to_file()
        return True

    def remove_validator(self, pubkey_hex: str) -> bool:
        """
        Remove validator from PoA list.
        Returns True if removed, False if not found.
        """
        if pubkey_hex not in self.authorized_validators:
            return False

        self.authorized_validators.remove(pubkey_hex)
        self._save_to_file()
        return True

    def is_authorized(self, pubkey_hex: str) -> bool:
        """
        Check if pubkey is in the authorized validators list.
        """
        return pubkey_hex in self.authorized_validators

    def list_validators(self):
        """Return list of validators."""
        return list(self.authorized_validators)
