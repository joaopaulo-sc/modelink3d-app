from typing import Optional
from pydantic import BaseModel


class ExtraServiceCreate(BaseModel):
    name: str
    default_price: float = 0.0
    estimated_time_hours: Optional[float] = None


class ExtraServiceUpdate(ExtraServiceCreate):
    pass


class ExtraServiceOut(BaseModel):
    id: int
    name: str
    default_price: float
    estimated_time_hours: Optional[float]

    model_config = {"from_attributes": True}
