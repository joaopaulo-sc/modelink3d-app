import enum
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, Float, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class OrderStatus(str, enum.Enum):
    BUDGET = "Budget"
    QUEUED = "Queued"
    PRINTING = "Printing"
    POST_PROCESSING = "PostProcessing"
    FINISHED = "Finished"
    DELIVERED = "Delivered"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[Optional[int]] = mapped_column(ForeignKey("clients.id"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(255))
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.BUDGET)
    print_type: Mapped[str] = mapped_column(String(10))
    estimated_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sell_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    down_payment: Mapped[float] = mapped_column(Float, default=0.0)
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    printer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("printers.id"), nullable=True)
    material_id: Mapped[Optional[int]] = mapped_column(ForeignKey("materials.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="orders")
    printer: Mapped[Optional["Printer"]] = relationship("Printer")
    material: Mapped[Optional["Material"]] = relationship("Material")
    status_history: Mapped[List["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory", back_populates="order", order_by="OrderStatusHistory.changed_at"
    )
    extra_services: Mapped[List["OrderExtraService"]] = relationship(
        "OrderExtraService", back_populates="order", cascade="all, delete-orphan"
    )
    materials: Mapped[List["OrderMaterial"]] = relationship(
        "OrderMaterial", back_populates="order", cascade="all, delete-orphan"
    )


class OrderMaterial(Base):
    __tablename__ = "order_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"))
    estimated_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="materials")
    material: Mapped[Optional["Material"]] = relationship("Material")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="status_history")


class OrderExtraService(Base):
    __tablename__ = "order_extra_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    extra_service_id: Mapped[int] = mapped_column(ForeignKey("extra_services.id"))
    price: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="extra_services")
    extra_service: Mapped["ExtraService"] = relationship("ExtraService")
