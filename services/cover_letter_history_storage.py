import json
import uuid
from datetime import datetime
from pathlib import Path
from config.settings import COVER_LETTER_HISTORY_JSON_PATH


class CoverLetterHistoryStorage:
    def __init__(self, path: Path = COVER_LETTER_HISTORY_JSON_PATH):
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

    def load(self, username: str) -> list[dict]:
        data = self._load_all()
        records = data.get(username, [])
        return sorted(records, key=lambda r: r.get("created_at", ""), reverse=True)

    def save(self, username: str, record: dict) -> dict:
        data = self._load_all()
        if username not in data:
            data[username] = []

        # Dedup: skip if same company + same answer contents already exist
        new_answers = sorted([a.get("answer", "") for a in record.get("answers", [])])
        for existing in data[username]:
            if existing.get("company") == record.get("company"):
                existing_answers = sorted(
                    [a.get("answer", "") for a in existing.get("answers", [])]
                )
                if existing_answers == new_answers:
                    return existing  # Already saved, return existing record

        record["id"] = str(uuid.uuid4())
        record["created_at"] = datetime.now().isoformat()
        data[username].append(record)
        self._save_all(data)
        return record

    def update(self, username: str, record_id: str, updated_fields: dict) -> dict | None:
        data = self._load_all()
        records = data.get(username, [])
        for i, r in enumerate(records):
            if r.get("id") == record_id:
                for key in ("answers", "company", "job_description"):
                    if key in updated_fields:
                        records[i][key] = updated_fields[key]
                records[i]["updated_at"] = datetime.now().isoformat()
                data[username] = records
                self._save_all(data)
                return records[i]
        return None

    def delete(self, username: str, record_id: str) -> bool:
        data = self._load_all()
        records = data.get(username, [])
        filtered = [r for r in records if r.get("id") != record_id]
        if len(filtered) == len(records):
            return False
        data[username] = filtered
        self._save_all(data)
        return True
