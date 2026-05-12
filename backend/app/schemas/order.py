from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.order import OrderStatus


class OrderExtraServiceIn(BaseModel):
    extra_service_id: int
    price: float
    notes: Optional[str] = None


class OrderExtraServiceOut(BaseModel):
    id: int
    extra_service_id: int
    price: float
    notes: Optional[str]
    extra_service_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderMaterialIn(BaseModel):
    material_id: int
    estimated_weight: Optional[float] = None


class OrderMaterialOut(BaseModel):
    id: int
    material_id: int
    estimated_weight: Optional[float]
    material_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderStatusHistoryOut(BaseModel):
    id: int
    status: OrderStatus
    changed_at: datetime
    notes: Optional[str]

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    client_id: Optional[int] = None
    item_name: str
    file_url: Optional[str] = None
    print_type: str
    estimated_weight: Optional[float] = None
    estimated_time: Optional[float] = None
    sell_price: Optional[float] = None
    down_payment: float = 0.0
    notes: Optional[str] = None
    material_id: Optional[int] = None
    deadline: Optional[datetime] = None
    extra_services: List[OrderExtraServiceIn] = []
    materials: List[OrderMaterialIn] = []


class OrderUpdate(BaseModel):
    client_id: Optional[int] = None
    item_name: Optional[str] = None
    file_url: Optional[str] = None
    print_type: Optional[str] = None
    estimated_weight: Optional[float] = None
    estimated_time: Optional[float] = None
    sell_price: Optional[float] = None
    down_payment: Optional[float] = None
    notes: Optional[str] = None
    printer_id: Optional[int] = None
    material_id: Optional[int] = None
    deadline: Optional[datetime] = None
    extra_services: Optional[List[OrderExtraServiceIn]] = None
    materials: Optional[List[OrderMaterialIn]] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None


class OrderFinishUpdate(BaseModel):
    actual_weight: float
    notes: Optional[str] = None


class OrderFailureUpdate(BaseModel):
    partial_weight_used: Optional[float] = None
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    client_id: Optional[int]
    item_name: str
    file_url: Optional[str]
    status: OrderStatus
    print_type: str
    estimated_weight: Optional[float]
    actual_weight: Optional[float]
    estimated_time: Optional[float]
    cost_price: Optional[float]
    sell_price: Optional[float]
    down_payment: float
    failure_count: int
    notes: Optional[str]
    printer_id: Optional[int]
    material_id: Optional[int]
    created_at: datetime
    deadline: Optional[datetime]
    extra_services: List[OrderExtraServiceOut] = []
    materials: List[OrderMaterialOut] = []
    status_history: List[OrderStatusHistoryOut] = []
    client_name: Optional[str] = None

    model_config = {"from_attributes": True}
