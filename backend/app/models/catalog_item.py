from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    print_type: Mapped[str] = mapped_column(String(10), default="FDM")  # FDM | Resin
    default_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)   # gramas
    default_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)     # horas
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
