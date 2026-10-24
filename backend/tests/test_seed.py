import pytest
from fastapi.testclient import TestClient

from app import models, seed
from app.main import app


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Make sure the developer's own environment never leaks into these tests."""
    for name in ("ADMIN_EMAIL", "ADMIN_PASSWORD", "SEED_ON_STARTUP"):
        monkeypatch.delenv(name, raising=False)


def run_seed(session_factory):
    with session_factory() as db:
        seed.seed(db)


def test_seed_creates_an_admin_user(session_factory):
    run_seed(session_factory)
    with session_factory() as db:
        admin = db.query(models.User).filter_by(email="admin@example.com").one()
        assert admin.role == "admin"


def test_seeded_admin_can_log_in(client, session_factory):
    run_seed(session_factory)
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "Admin@12345"},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_seed_creates_a_regular_demo_user(session_factory):
    run_seed(session_factory)
    with session_factory() as db:
        user = db.query(models.User).filter_by(email="user@example.com").one()
        assert user.role == "user"


def test_seed_creates_sample_vehicles_including_one_out_of_stock(session_factory):
    run_seed(session_factory)
    with session_factory() as db:
        vehicles = db.query(models.Vehicle).all()
        assert len(vehicles) == len(seed.SAMPLE_VEHICLES)
        assert len(vehicles) >= 8
        assert any(v.quantity == 0 for v in vehicles)  # shows the disabled Purchase button


def test_seed_is_idempotent(session_factory):
    run_seed(session_factory)
    run_seed(session_factory)
    with session_factory() as db:
        assert db.query(models.User).count() == 2
        assert db.query(models.Vehicle).count() == len(seed.SAMPLE_VEHICLES)


def test_seed_does_not_add_samples_when_vehicles_already_exist(session_factory):
    with session_factory() as db:
        db.add(models.Vehicle(make="Kia", model="Seltos", category="SUV", price=1600000, quantity=2))
        db.commit()
    run_seed(session_factory)
    with session_factory() as db:
        assert db.query(models.Vehicle).count() == 1


def test_seed_does_not_change_an_existing_user(session_factory):
    run_seed(session_factory)
    with session_factory() as db:
        db.query(models.User).filter_by(email="admin@example.com").update({"role": "user"})
        db.commit()
    run_seed(session_factory)
    with session_factory() as db:
        assert db.query(models.User).filter_by(email="admin@example.com").one().role == "user"


def test_admin_credentials_can_come_from_environment(client, session_factory, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "boss@dealer.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "BossPass#2026")
    run_seed(session_factory)
    response = client.post(
        "/api/auth/login",
        json={"email": "boss@dealer.com", "password": "BossPass#2026"},
    )
    assert response.status_code == 200


def test_startup_seeds_when_enabled(session_factory, monkeypatch):
    monkeypatch.setenv("SEED_ON_STARTUP", "true")
    monkeypatch.setattr("app.main.engine", session_factory.kw["bind"])
    monkeypatch.setattr("app.main.SessionLocal", session_factory)
    with TestClient(app):  # entering the context runs startup
        pass
    with session_factory() as db:
        assert db.query(models.User).filter_by(role="admin").count() == 1
        assert db.query(models.Vehicle).count() == len(seed.SAMPLE_VEHICLES)


def test_startup_does_not_seed_by_default(session_factory, monkeypatch):
    monkeypatch.setattr("app.main.engine", session_factory.kw["bind"])
    monkeypatch.setattr("app.main.SessionLocal", session_factory)
    with TestClient(app):
        pass
    with session_factory() as db:
        assert db.query(models.User).count() == 0