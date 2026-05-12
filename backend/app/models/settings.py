from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Float, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    fdm_rate_per_hour: Mapped[float] = mapped_column(Float, default=5.0)
    resin_rate_per_hour: Mapped[float] = mapped_column(Float, default=8.0)
    default_margin: Mapped[float] = mapped_column(Float, default=0.30)
    default_min_alert_weight: Mapped[float] = mapped_column(Float, default=150.0)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
