"""SQLAlchemy ORM models."""
from sqlalchemy import CheckConstraint, Column, Float, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")  # "user" or "admin"


class Vehicle(Base):
    __tablename__ = "vehicles"
    # Database-level guard rails in addition to API validation.
    __table_args__ = (
        CheckConstraint("price > 0", name="ck_vehicle_price_positive"),
        CheckConstraint("quantity >= 0", name="ck_vehicle_quantity_non_negative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String, nullable=False, index=True)
    model = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)