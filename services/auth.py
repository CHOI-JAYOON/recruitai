import json
import bcrypt
from pathlib import Path
from config.settings import USERS_JSON_PATH


class AuthService:
    def __init__(self, path: Path = USERS_JSON_PATH):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def _load_users(self) -> dict:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save_users(self, users: dict) -> None:
        self.path.write_text(
            json.dumps(users, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def register(self, username: str, password: str, display_name: str, email: str = "") -> bool:
        users = self._load_users()
        if username in users:
            return False
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        users[username] = {
            "password_hash": hashed.decode("utf-8"),
            "display_name": display_name,
            "email": email,
            "provider": "local",
        }
        self._save_users(users)
        return True

    def login(self, username: str, password: str) -> dict | None:
        users = self._load_users()
        if username not in users:
            return None
        stored_hash = users[username]["password_hash"].encode("utf-8")
        if bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return {
                "username": username,
                "display_name": users[username]["display_name"],
                "email": users[username].get("email", ""),
                "provider": users[username].get("provider", "local"),
            }
        return None

    def user_exists(self, username: str) -> bool:
        users = self._load_users()
        return username in users

    def change_password(self, username: str, current_password: str, new_password: str) -> bool:
        users = self._load_users()
        if username not in users:
            return False
        stored_hash = users[username]["password_hash"].encode("utf-8")
        if not bcrypt.checkpw(current_password.encode("utf-8"), stored_hash):
            return False
        hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        users[username]["password_hash"] = hashed.decode("utf-8")
        self._save_users(users)
        return True

    def update_display_name(self, username: str, display_name: str) -> dict | None:
        users = self._load_users()
        if username not in users:
            return None
        users[username]["display_name"] = display_name
        self._save_users(users)
        return {"username": username, "display_name": display_name}

    def find_or_create_oauth_user(self, provider: str, provider_id: str, email: str, display_name: str) -> dict:
        users = self._load_users()
        for username, data in users.items():
            if data.get("provider") == provider and data.get("provider_id") == provider_id:
                return {
                    "username": username,
                    "display_name": data["display_name"],
                    "email": data.get("email", ""),
                    "provider": provider,
                }
        username = f"{provider}_{provider_id}"
        users[username] = {
            "password_hash": "",
            "display_name": display_name,
            "email": email,
            "provider": provider,
            "provider_id": provider_id,
        }
        self._save_users(users)
        return {
            "username": username,
            "display_name": display_name,
            "email": email,
            "provider": provider,
        }

    def find_by_display_name(self, display_name: str) -> str | None:
        users = self._load_users()
        for username, data in users.items():
            if data.get("display_name") == display_name:
                return username
        return None

    def find_by_name_and_email(self, display_name: str, email: str) -> str | None:
        users = self._load_users()
        for username, data in users.items():
            if data.get("display_name") == display_name and data.get("email") == email:
                return username
        return None

    def reset_password(self, username: str, display_name: str, new_password: str) -> bool:
        users = self._load_users()
        if username not in users:
            return False
        if users[username].get("display_name") != display_name:
            return False
        hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        users[username]["password_hash"] = hashed.decode("utf-8")
        self._save_users(users)
        return True

    def reset_password_with_email(self, username: str, display_name: str, email: str, new_password: str) -> bool:
        users = self._load_users()
        if username not in users:
            return False
        user = users[username]
        if user.get("display_name") != display_name or user.get("email") != email:
            return False
        hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        users[username]["password_hash"] = hashed.decode("utf-8")
        self._save_users(users)
        return True
