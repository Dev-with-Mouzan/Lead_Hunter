import json
import os
import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parents[3] / "data" / "odify.db"


def db_file_path() -> Path:
    env = os.getenv("ODIFY_DB_PATH")
    if env:
        return Path(env)
    if os.getenv("VERCEL"):
        return Path("/tmp") / "odify.db"
    return DEFAULT_DB_PATH


def _connect():
    path = db_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _connect()
    try:
        conn.executescript(
            """
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                mode TEXT NOT NULL,
                query TEXT NOT NULL,
                location TEXT NOT NULL,
                max_results INTEGER NOT NULL,
                result_count INTEGER NOT NULL,
                phone_count INTEGER NOT NULL,
                timestamp INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                data TEXT NOT NULL,
                UNIQUE(session_id, position)
            );

            CREATE INDEX IF NOT EXISTS idx_results_session ON results(session_id);
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_session(
    session_id: str,
    mode: str,
    query: str,
    location: str,
    max_results: int,
    phone_count: int,
    data: list,
):
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO sessions (id, mode, query, location, max_results,
                                  result_count, phone_count, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                mode,
                query,
                location,
                max_results,
                len(data),
                phone_count,
                int(time_millis()),
            ),
        )
        conn.executemany(
            "INSERT INTO results (session_id, position, data) VALUES (?, ?, ?)",
            [(session_id, i, json.dumps(r)) for i, r in enumerate(data)],
        )
        conn.commit()
    finally:
        conn.close()


def get_session(session_id: str):
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
        if row is None:
            return None
        session = dict(row)
        rows = conn.execute(
            "SELECT data FROM results WHERE session_id = ? ORDER BY position ASC",
            (session_id,),
        ).fetchall()
        session["data"] = [json.loads(r["data"]) for r in rows]
        return session
    finally:
        conn.close()


def get_results(session_id: str):
    session = get_session(session_id)
    return session["data"] if session else []


def list_sessions(limit: int = 25, all_sessions: bool = False):
    conn = _connect()
    try:
        sql = """
            SELECT id, mode, query, location, max_results,
                   result_count, phone_count, timestamp
            FROM sessions
            ORDER BY timestamp DESC
        """
        if all_sessions:
            rows = conn.execute(sql).fetchall()
        else:
            rows = conn.execute(sql + " LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def all_sessions(limit: int = 10000):
    return list_sessions(limit)


def get_stats():
    conn = _connect()
    try:
        row = conn.execute(
            """
            SELECT
                COUNT(*)                                             AS sessions,
                COALESCE(SUM(result_count), 0)                       AS leads,
                COALESCE(SUM(phone_count), 0)                        AS phones,
                COALESCE(SUM(CASE WHEN mode = 'places' THEN 1 ELSE 0 END), 0) AS places_sessions,
                COALESCE(SUM(CASE WHEN mode = 'web' THEN 1 ELSE 0 END), 0)     AS web_sessions
            FROM sessions
            """
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


def delete_session(session_id: str):
    conn = _connect()
    try:
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
    finally:
        conn.close()


def clear_sessions():
    conn = _connect()
    try:
        conn.execute("DELETE FROM results")
        conn.execute("DELETE FROM sessions")
        conn.commit()
    finally:
        conn.close()


def checkpoint():
    conn = _connect()
    try:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        conn.commit()
    finally:
        conn.close()


def time_millis():
    import time
    return int(time.time() * 1000)


init_db()