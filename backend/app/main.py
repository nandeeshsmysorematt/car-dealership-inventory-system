"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401  (registers the models with SQLAlchemy)
from app.database import Base, SessionLocal, engine
from app.routers import auth, vehicles
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on startup
    if os.getenv("SEED_ON_STARTUP", "").lower() == "true":
        with SessionLocal() as db:
            seed(db)
    yield


app = FastAPI(title="Car Dealership Inventory System", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(vehicles.router)