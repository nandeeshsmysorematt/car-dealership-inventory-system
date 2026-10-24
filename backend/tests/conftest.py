import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def session_factory(tmp_path):
    """A fresh temporary SQLite file database for each test (not in-memory)."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine, autocommit=False, autoflush=False)
    engine.dispose()


@pytest.fixture()
def client(session_factory):
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _auth_headers(client, credentials):
    token = client.post("/api/auth/login", json=credentials).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_headers(client):
    credentials = {"email": "user@example.com", "password": "StrongPass123"}
    client.post("/api/auth/register", json=credentials)
    return _auth_headers(client, credentials)


@pytest.fixture()
def admin_headers(client, session_factory):
    credentials = {"email": "admin@example.com", "password": "StrongPass123"}
    client.post("/api/auth/register", json=credentials)
    # Registration never grants admin, so promote the user directly in the DB.
    with session_factory() as db:
        db.query(models.User).filter(models.User.email == credentials["email"]).update(
            {"role": "admin"}
        )
        db.commit()
    return _auth_headers(client, credentials)