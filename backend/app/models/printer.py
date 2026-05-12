import enum
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PrintType(str, enum.Enum):
    FDM = "FDM"
    RESIN = "Resin"


class PrinterStatus(str, enum.Enum):
    IDLE = "Idle"
    PRINTING = "Printing"
    MAINTENANCE = "Maintenance"


class Printer(Base):
    __tablename__ = "printers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[PrintType] = mapped_column(Enum(PrintType))
    status: Mapped[PrinterStatus] = mapped_column(Enum(PrinterStatus), default=PrinterStatus.IDLE)
