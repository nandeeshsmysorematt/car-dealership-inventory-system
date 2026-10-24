from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError

from app import database, schemas, security
from app.main import app
from app.services import auth_service


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_token_for_nonexistent_user_is_rejected(client):
    token = security.create_access_token(user_id=9999, role="user")
    assert client.get("/api/vehicles", headers=bearer(token)).status_code == 401


def test_expired_token_is_rejected(client):
    expired = jwt.encode(
        {"sub": "1", "role": "user", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        security.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    assert client.get("/api/vehicles", headers=bearer(expired)).status_code == 401


def test_token_signed_with_wrong_key_is_rejected(client):
    forged = jwt.encode(
        {"sub": "1", "role": "admin"},
        "a-completely-different-secret-key-0123456789",
        algorithm=security.ALGORITHM,
    )
    assert client.get("/api/vehicles", headers=bearer(forged)).status_code == 401


def test_get_db_yields_a_working_session(session_factory, monkeypatch):
    monkeypatch.setattr(database, "SessionLocal", session_factory)
    generator = database.get_db()
    db = next(generator)
    assert db.execute(text("SELECT 1")).scalar() == 1
    generator.close()  # runs the finally block that closes the session


def test_startup_creates_tables(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'startup.db'}")
    monkeypatch.setattr("app.main.engine", engine)
    with TestClient(app):  # entering the context runs the lifespan startup
        pass
    assert {"users", "vehicles"} <= set(inspect(engine).get_table_names())
    engine.dispose()


def test_register_handles_simultaneous_duplicate(session_factory, monkeypatch):
    """If the DB rejects a duplicate at commit time, we still report a clean error."""
    with session_factory() as db:

        def failing_commit():
            raise IntegrityError("INSERT", {}, Exception("UNIQUE constraint failed"))

        monkeypatch.setattr(db, "commit", failing_commit)
        payload = schemas.UserCreate(email="race@example.com", password="StrongPass123")
        with pytest.raises(auth_service.DuplicateEmailError):
            auth_service.register_user(db, payload)