from typing import Optional
from pydantic import BaseModel
from app.models.printer import PrintType, PrinterStatus


class PrinterCreate(BaseModel):
    name: str
    type: PrintType
    status: PrinterStatus = PrinterStatus.IDLE


class PrinterUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[PrintType] = None
    status: Optional[PrinterStatus] = None


class PrinterOut(BaseModel):
    id: int
    name: str
    type: PrintType
    status: PrinterStatus

    model_config = {"from_attributes": True}
