"""Vehicle and inventory endpoints. All routes require a logged-in user."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.services import vehicle_service
from app.services.vehicle_service import OutOfStockError, VehicleNotFoundError

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)

NOT_FOUND = HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")


@router.post("", response_model=schemas.VehicleOut, status_code=status.HTTP_201_CREATED)
def add_vehicle(payload: schemas.VehicleCreate, db: Session = Depends(get_db)):
    return vehicle_service.create_vehicle(db, payload)


@router.get("", response_model=list[schemas.VehicleOut])
def list_vehicles(db: Session = Depends(get_db)):
    return vehicle_service.list_vehicles(db)


@router.get("/search", response_model=list[schemas.VehicleOut])
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    db: Session = Depends(get_db),
):
    return vehicle_service.search_vehicles(db, make, model, category, min_price, max_price)


@router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(vehicle_id: int, payload: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    try:
        return vehicle_service.update_vehicle(db, vehicle_id, payload)
    except VehicleNotFoundError:
        raise NOT_FOUND


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_admin)])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    try:
        vehicle_service.delete_vehicle(db, vehicle_id)
    except VehicleNotFoundError:
        raise NOT_FOUND
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/purchase", response_model=schemas.VehicleOut)
def purchase_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    try:
        return vehicle_service.purchase_vehicle(db, vehicle_id)
    except VehicleNotFoundError:
        raise NOT_FOUND
    except OutOfStockError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Vehicle is out of stock")


@router.post("/{vehicle_id}/restock", response_model=schemas.VehicleOut,
             dependencies=[Depends(require_admin)])
def restock_vehicle(vehicle_id: int, payload: schemas.RestockRequest, db: Session = Depends(get_db)):
    try:
        return vehicle_service.restock_vehicle(db, vehicle_id, payload.quantity)
    except VehicleNotFoundError:
        raise NOT_FOUND