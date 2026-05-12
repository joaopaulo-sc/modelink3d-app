from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(100))
    material_type: Mapped[str] = mapped_column(String(50))  # PLA, PETG, ABS-Like, etc.
    color: Mapped[str] = mapped_column(String(80))
    initial_weight: Mapped[float] = mapped_column(Float)       # gramas
    current_weight: Mapped[float] = mapped_column(Float)       # gramas
    min_alert_weight: Mapped[float] = mapped_column(Float, default=150.0)
    price_per_gram: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
