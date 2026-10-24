"""FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401  (registers the models with SQLAlchemy)
from app.database import Base, engine
from app.routers import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on startup
    yield


app = FastAPI(title="Car Dealership Inventory System", lifespan=lifespan)
app.include_router(auth.router)