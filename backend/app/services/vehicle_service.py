"""Business logic for vehicles and inventory."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas


class VehicleNotFoundError(Exception):
    """Raised when a vehicle id does not exist."""


class OutOfStockError(Exception):
    """Raised when purchasing a vehicle with no units left."""


def _get_or_raise(db: Session, vehicle_id: int) -> models.Vehicle:
    vehicle = db.get(models.Vehicle, vehicle_id)
    if vehicle is None:
        raise VehicleNotFoundError(vehicle_id)
    return vehicle


def create_vehicle(db: Session, data: schemas.VehicleCreate) -> models.Vehicle:
    vehicle = models.Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def list_vehicles(db: Session) -> list[models.Vehicle]:
    return db.query(models.Vehicle).order_by(models.Vehicle.id).all()


def search_vehicles(
    db: Session,
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> list[models.Vehicle]:
    """Filter vehicles; text filters are case-insensitive partial matches."""
    query = db.query(models.Vehicle)
    if make:
        query = query.filter(func.lower(models.Vehicle.make).contains(make.lower()))
    if model:
        query = query.filter(func.lower(models.Vehicle.model).contains(model.lower()))
    if category:
        query = query.filter(func.lower(models.Vehicle.category).contains(category.lower()))
    if min_price is not None:
        query = query.filter(models.Vehicle.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Vehicle.price <= max_price)
    return query.order_by(models.Vehicle.id).all()


def update_vehicle(db: Session, vehicle_id: int, data: schemas.VehicleUpdate) -> models.Vehicle:
    vehicle = _get_or_raise(db, vehicle_id)
    for field, value in data.model_dump().items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> None:
    vehicle = _get_or_raise(db, vehicle_id)
    db.delete(vehicle)
    db.commit()


def purchase_vehicle(db: Session, vehicle_id: int) -> models.Vehicle:
    """Decrease stock by one. The check and decrement happen in a single
    atomic UPDATE, so two buyers can never take the last unit together."""
    updated = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id, models.Vehicle.quantity > 0)
        .update({models.Vehicle.quantity: models.Vehicle.quantity - 1}, synchronize_session=False)
    )
    db.commit()
    if updated == 0:
        _get_or_raise(db, vehicle_id)  # raises VehicleNotFoundError if missing
        raise OutOfStockError(vehicle_id)
    return _get_or_raise(db, vehicle_id)


def restock_vehicle(db: Session, vehicle_id: int, amount: int) -> models.Vehicle:
    updated = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .update({models.Vehicle.quantity: models.Vehicle.quantity + amount}, synchronize_session=False)
    )
    db.commit()
    if updated == 0:
        raise VehicleNotFoundError(vehicle_id)
    return _get_or_raise(db, vehicle_id)