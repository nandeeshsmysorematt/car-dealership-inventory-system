"""Idempotent demo data: an admin, a regular user and sample vehicles.

Run manually with:  python -m app.seed
"""
import os

from sqlalchemy.orm import Session

from app import models, security
from app.database import Base, SessionLocal, engine

DEFAULT_ADMIN_EMAIL = "admin@example.com"
DEFAULT_ADMIN_PASSWORD = "Admin@12345"
DEMO_USER_EMAIL = "user@example.com"
DEMO_USER_PASSWORD = "User@12345"

SAMPLE_VEHICLES = [
    {"make": "Hyundai", "model": "Creta", "category": "SUV", "price": 1500000, "quantity": 5},
    {"make": "Tata", "model": "Nexon", "category": "SUV", "price": 1100000, "quantity": 8},
    {"make": "Tata", "model": "Tiago", "category": "Hatchback", "price": 650000, "quantity": 12},
    {"make": "Maruti Suzuki", "model": "Swift", "category": "Hatchback", "price": 700000, "quantity": 10},
    {"make": "Maruti Suzuki", "model": "Dzire", "category": "Sedan", "price": 800000, "quantity": 6},
    {"make": "Honda", "model": "City", "category": "Sedan", "price": 1300000, "quantity": 4},
    {"make": "Mahindra", "model": "Thar", "category": "SUV", "price": 1600000, "quantity": 2},
    {"make": "Toyota", "model": "Innova Crysta", "category": "MPV", "price": 2000000, "quantity": 3},
    {"make": "Kia", "model": "Carens", "category": "MPV", "price": 1200000, "quantity": 0},  # out of stock
    {"make": "BMW", "model": "3 Series", "category": "Luxury", "price": 5800000, "quantity": 1},
]


def _create_user_if_missing(db: Session, email: str, password: str, role: str) -> None:
    """Create the user only if the email is new; never modify an existing user."""
    email = email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        return
    db.add(models.User(email=email, hashed_password=security.hash_password(password), role=role))


def seed(db: Session) -> None:
    """Insert demo data without ever duplicating or overwriting existing rows."""
    admin_email = os.getenv("ADMIN_EMAIL", DEFAULT_ADMIN_EMAIL)
    admin_password = os.getenv("ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)

    _create_user_if_missing(db, admin_email, admin_password, "admin")
    _create_user_if_missing(db, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, "user")

    if db.query(models.Vehicle).count() == 0:
        db.add_all(models.Vehicle(**vehicle) for vehicle in SAMPLE_VEHICLES)
    db.commit()


if __name__ == "__main__":  # pragma: no cover
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed(session)
    print("Database seeded.")