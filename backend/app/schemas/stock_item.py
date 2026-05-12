from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class StockItemCreate(BaseModel):
    name: str
    quantity: int = 0
    sell_price: float = 0.0
    production_cost: Optional[float] = None
    material_id: Optional[int] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    description: Optional[str] = None


class StockItemUpdate(StockItemCreate):
    pass


class StockItemOut(BaseModel):
    id: int
    name: str
    quantity: int
    sell_price: float
    production_cost: Optional[float]
    material_id: Optional[int]
    image_url: Optional[str]
    image_urls: Optional[List[str]] = None
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
