from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ClientCreate(BaseModel):
    name: str
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    address: Optional[str] = None

    @field_validator("whatsapp", "instagram", "address", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == "" else v


class ClientUpdate(ClientCreate):
    pass


class ClientOut(ClientCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
