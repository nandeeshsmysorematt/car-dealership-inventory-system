"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the models with SQLAlchemy)
from app.database import Base, SessionLocal, engine
from app.routers import auth, vehicles
from app.seed import seed

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def parse_cors_origins() -> list[str]:
    """Allowed browser origins, configurable via the CORS_ORIGINS variable."""
    raw = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on startup
    if os.getenv("SEED_ON_STARTUP", "").lower() == "true":
        with SessionLocal() as db:
            seed(db)
    yield


app = FastAPI(title="Car Dealership Inventory System", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(vehicles.router)