from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CatalogItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    print_type: str = "FDM"
    default_weight: Optional[float] = None
    default_time: Optional[float] = None
    file_url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class CatalogItemUpdate(CatalogItemCreate):
    pass


class CatalogItemOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    print_type: str
    default_weight: Optional[float]
    default_time: Optional[float]
    file_url: Optional[str]
    image_url: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
