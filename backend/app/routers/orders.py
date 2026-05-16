from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.order import Order, OrderStatus, OrderStatusHistory, OrderExtraService, OrderMaterial, OrderItem
from app.models.material import Material
from app.models.settings import SystemSettings
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderOut, OrderStatusUpdate,
    OrderFinishUpdate, OrderFailureUpdate,
)
from app.routers.auth import get_current_user
from app.services.pdf import generate_invoice_pdf

router = APIRouter(prefix="/orders", tags=["orders"])

LOAD_OPTS = [
    selectinload(Order.extra_services).selectinload(OrderExtraService.extra_service),
    selectinload(Order.status_history),
    selectinload(Order.client),
    selectinload(Order.materials).selectinload(OrderMaterial.material),
    selectinload(Order.items),
]


def _enrich(order: Order) -> dict:
    data = OrderOut.model_validate(order).model_dump()
    if order.client:
        data["client_name"] = order.client.name
    for es in data["extra_services"]:
        src = next((x for x in order.extra_services if x.id == es["id"]), None)
        if src and src.extra_service:
            es["extra_service_name"] = src.extra_service.name
    for mat in data["materials"]:
        src = next((x for x in order.materials if x.id == mat["id"]), None)
        if src and src.material:
            m = src.material
            mat["material_name"] = f"{m.brand} {m.material_type} {m.color}"
    return data


async def _get_or_404(order_id: int, db: AsyncSession) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id).options(*LOAD_OPTS))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    return order


async def _calculate_cost(order: Order, db: AsyncSession) -> float:
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
    cfg = result.scalar_one_or_none()
    if not cfg:
        return 0.0

    rate = cfg.fdm_rate_per_hour if order.print_type == "FDM" else cfg.resin_rate_per_hour

    material_cost = 0.0
    if order.materials:
        for om in order.materials:
            if om.material and om.estimated_weight:
                if om.material.price_per_gram:
                    material_cost += om.estimated_weight * om.material.price_per_gram
    elif order.material_id and order.estimated_weight:
        mat = await db.get(Material, order.material_id)
        if mat and mat.price_per_gram:
            material_cost = order.estimated_weight * mat.price_per_gram

    time_cost = (order.estimated_time or 0) * rate
    extra_cost = sum(es.price for es in order.extra_services)
    return round(material_cost + time_cost + extra_cost, 2)


@router.get("", response_model=List[OrderOut])
async def list_orders(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Order).options(*LOAD_OPTS).order_by(Order.created_at.desc())
    if status:
        q = q.where(Order.status == status)
    result = await db.execute(q)
    orders = result.scalars().all()
    return [_enrich(o) for o in orders]


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    payload = data.model_dump(exclude={"extra_services", "materials", "items"})
    if data.materials and not payload.get("material_id"):
        payload["material_id"] = data.materials[0].material_id
    if data.items:
        if len(data.items) == 1:
            payload["item_name"] = data.items[0].item_name
        else:
            payload["item_name"] = f"{data.items[0].item_name} (+ {len(data.items) - 1} item{'ns' if len(data.items) > 2 else ''})"

    order = Order(**payload)
    db.add(order)
    await db.flush()

    for es_data in data.extra_services:
        db.add(OrderExtraService(order_id=order.id, **es_data.model_dump()))

    for mat_data in data.materials:
        db.add(OrderMaterial(order_id=order.id, **mat_data.model_dump()))

    for item_data in data.items:
        db.add(OrderItem(order_id=order.id, **item_data.model_dump()))

    db.add(OrderStatusHistory(order_id=order.id, status=OrderStatus.BUDGET))

    await db.commit()
    order = await _get_or_404(order.id, db)
    order.cost_price = await _calculate_cost(order, db)
    await db.commit()
    return _enrich(await _get_or_404(order.id, db))


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return _enrich(await _get_or_404(order_id, db))


@router.put("/{order_id}", response_model=OrderOut)
async def update_order(order_id: int, data: OrderUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)

    for k, v in data.model_dump(exclude_unset=True, exclude={"extra_services", "materials", "items"}).items():
        setattr(order, k, v)

    if data.extra_services is not None:
        await db.execute(delete(OrderExtraService).where(OrderExtraService.order_id == order_id))
        for es_data in data.extra_services:
            db.add(OrderExtraService(order_id=order_id, **es_data.model_dump()))

    if data.materials is not None:
        await db.execute(delete(OrderMaterial).where(OrderMaterial.order_id == order_id))
        for mat_data in data.materials:
            db.add(OrderMaterial(order_id=order_id, **mat_data.model_dump()))
        order.material_id = data.materials[0].material_id if data.materials else None

    if data.items is not None:
        await db.execute(delete(OrderItem).where(OrderItem.order_id == order_id))
        for item_data in data.items:
            db.add(OrderItem(order_id=order_id, **item_data.model_dump()))
        if data.items:
            if len(data.items) == 1:
                order.item_name = data.items[0].item_name
            else:
                order.item_name = f"{data.items[0].item_name} (+ {len(data.items) - 1} item{'ns' if len(data.items) > 2 else ''})"

    await db.flush()
    order = await _get_or_404(order_id, db)
    order.cost_price = await _calculate_cost(order, db)
    await db.commit()
    return _enrich(await _get_or_404(order_id, db))


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_status(order_id: int, data: OrderStatusUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)
    order.status = data.status
    db.add(OrderStatusHistory(order_id=order.id, status=data.status, notes=data.notes))
    await db.commit()
    return _enrich(await _get_or_404(order_id, db))


@router.patch("/{order_id}/finish", response_model=OrderOut)
async def finish_order(order_id: int, data: OrderFinishUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)
    order.actual_weight = data.actual_weight
    order.status = OrderStatus.FINISHED

    if order.materials:
        total_est = sum(om.estimated_weight or 0 for om in order.materials)
        for om in order.materials:
            mat = await db.get(Material, om.material_id)
            if mat:
                if total_est > 0 and om.estimated_weight:
                    deduct = data.actual_weight * (om.estimated_weight / total_est)
                else:
                    deduct = data.actual_weight / len(order.materials)
                mat.current_weight = max(0.0, mat.current_weight - deduct)
    elif order.material_id:
        material = await db.get(Material, order.material_id)
        if material:
            material.current_weight = max(0.0, material.current_weight - data.actual_weight)

    db.add(OrderStatusHistory(order_id=order.id, status=OrderStatus.FINISHED, notes=data.notes))
    await db.commit()
    return _enrich(await _get_or_404(order_id, db))


@router.patch("/{order_id}/failure", response_model=OrderOut)
async def register_failure(order_id: int, data: OrderFailureUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)
    order.failure_count += 1
    order.status = OrderStatus.QUEUED

    if data.partial_weight_used:
        if order.materials:
            total_est = sum(om.estimated_weight or 0 for om in order.materials)
            for om in order.materials:
                mat = await db.get(Material, om.material_id)
                if mat:
                    deduct = (data.partial_weight_used * (om.estimated_weight / total_est)
                              if total_est > 0 and om.estimated_weight
                              else data.partial_weight_used / len(order.materials))
                    mat.current_weight = max(0.0, mat.current_weight - deduct)
        elif order.material_id:
            material = await db.get(Material, order.material_id)
            if material:
                material.current_weight = max(0.0, material.current_weight - data.partial_weight_used)

    db.add(OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.QUEUED,
        notes=f"Falha registrada. {data.notes or ''}".strip(),
    ))
    await db.commit()
    return _enrich(await _get_or_404(order_id, db))


@router.get("/{order_id}/invoice")
async def get_invoice(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)
    pdf_bytes = generate_invoice_pdf(order)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=pedido_{order_id}.pdf"},
    )


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    order = await _get_or_404(order_id, db)
    await db.delete(order)
    await db.commit()
