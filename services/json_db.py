"""
SmartPath: Drop-in replacement for pathlib.Path that stores data in PostgreSQL
when DATABASE_URL is set. Falls back to file system when not set.

Usage in settings.py:
    USERS_JSON_PATH = SmartPath(DATA_DIR / "users.json", "{}")
    PORTFOLIOS_JSON_PATH = SmartPath(DATA_DIR / "portfolios.json", "[]")

Existing storage services need ZERO changes.
"""

import os
import json
from pathlib import Path

_db_url = os.getenv("DATABASE_URL")


def _get_conn():
    import psycopg2

    return psycopg2.connect(_db_url, sslmode="require")


def init_db():
    """Create json_store table if DATABASE_URL is set. Call on app startup."""
    if not _db_url:
        return
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS json_store (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
            """
        )
    conn.commit()
    conn.close()


def db_read(key: str) -> str | None:
    if not _db_url:
        return None
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT data FROM json_store WHERE key = %s", (key,))
        row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def db_write(key: str, data: str) -> bool:
    if not _db_url:
        return False
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO json_store (key, data) VALUES (%s, %s)
            ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
            """,
            (key, data),
        )
    conn.commit()
    conn.close()
    return True


class _NoOpParent:
    """Mock parent directory for DB mode (no filesystem needed)."""

    def mkdir(self, **kwargs):
        pass


class SmartPath:
    """
    Drop-in replacement for pathlib.Path.
    When DATABASE_URL is set → reads/writes to PostgreSQL.
    Otherwise → uses the regular filesystem.
    """

    def __init__(self, file_path, default_content="{}"):
        self._path = Path(file_path)
        self._key = self._path.stem  # e.g., "users", "portfolios"
        self._default = default_content
        self._use_db = bool(_db_url)

    @property
    def parent(self):
        if self._use_db:
            return _NoOpParent()
        return self._path.parent

    def exists(self):
        if self._use_db:
            return True
        return self._path.exists()

    def read_text(self, encoding="utf-8"):
        if self._use_db:
            data = db_read(self._key)
            return data if data is not None else self._default
        return self._path.read_text(encoding=encoding)

    def write_text(self, data, encoding="utf-8"):
        if self._use_db:
            db_write(self._key, data)
        else:
            self._path.write_text(data, encoding=encoding)
