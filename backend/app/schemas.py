"""Pydantic schemas: request validation and response shaping."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    # bcrypt only uses the first 72 bytes, so we cap the length.
    password: str = Field(min_length=8, max_length=64)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class VehicleBase(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    category: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(VehicleBase):
    pass


class VehicleOut(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class RestockRequest(BaseModel):
    quantity: int = Field(gt=0)    