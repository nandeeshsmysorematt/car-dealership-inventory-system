"""Business logic for registration and authentication, kept out of the routes."""
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas, security


class DuplicateEmailError(Exception):
    """Raised when registering an email that already exists."""


def register_user(db: Session, data: schemas.UserCreate) -> models.User:
    email = data.email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise DuplicateEmailError(email)

    user = models.User(
        email=email,
        hashed_password=security.hash_password(data.password),
        role="user",  # roles are never taken from client input
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two simultaneous requests with the same email
        db.rollback()
        raise DuplicateEmailError(email)
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if user and security.verify_password(password, user.hashed_password):
        return user
    return None