from typing import Optional
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ExtraService(Base):
    __tablename__ = "extra_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    default_price: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_time_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
