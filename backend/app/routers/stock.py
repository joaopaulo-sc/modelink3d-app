from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.stock_item import StockItem
from app.schemas.stock_item import StockItemCreate, StockItemUpdate, StockItemOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("", response_model=List[StockItemOut])
async def list_stock(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(StockItem).order_by(StockItem.name))
    return result.scalars().all()


@router.get("/public", response_model=List[StockItemOut])
async def list_stock_public(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StockItem).where(StockItem.quantity > 0).order_by(StockItem.name))
    return result.scalars().all()


@router.get("/public/{item_id}", response_model=StockItemOut)
async def get_stock_item_public(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StockItem).where(StockItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item não encontrado")
    return item


@router.post("", response_model=StockItemOut, status_code=201)
async def create_item(data: StockItemCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    item = StockItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}", response_model=StockItemOut)
async def update_item(item_id: int, data: StockItemUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(StockItem).where(StockItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item não encontrado")
    for k, v in data.model_dump().items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(StockItem).where(StockItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item não encontrado")
    await db.delete(item)
    await db.commit()
