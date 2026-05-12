from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MaterialCreate(BaseModel):
    brand: str
    material_type: str
    color: str
    initial_weight: float
    current_weight: Optional[float] = None
    min_alert_weight: float = 150.0
    price_per_gram: float = 0.0


class MaterialUpdate(BaseModel):
    brand: Optional[str] = None
    material_type: Optional[str] = None
    color: Optional[str] = None
    initial_weight: Optional[float] = None
    current_weight: Optional[float] = None
    min_alert_weight: Optional[float] = None
    price_per_gram: Optional[float] = None


class MaterialOut(BaseModel):
    id: int
    brand: str
    material_type: str
    color: str
    initial_weight: float
    current_weight: float
    min_alert_weight: float
    price_per_gram: Optional[float]
    created_at: datetime
    low_stock: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_alert(cls, obj):
        data = cls.model_validate(obj)
        data.low_stock = obj.current_weight <= obj.min_alert_weight
        return data
