import json
from pathlib import Path
from config.settings import PROFILE_JSON_PATH
from models.user_profile import UserProfile


class ProfileStorage:
    def __init__(self, path: Path = PROFILE_JSON_PATH):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def _load_all(self) -> dict:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save_all(self, data: dict) -> None:
        self.path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def load(self, username: str) -> UserProfile:
        data = self._load_all()
        if username in data:
            return UserProfile(**data[username])
        return UserProfile()

    def save(self, username: str, profile: UserProfile) -> None:
        data = self._load_all()
        data[username] = profile.model_dump()
        self._save_all(data)
