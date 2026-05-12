from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.catalog_item import CatalogItem
from app.schemas.catalog_item import CatalogItemCreate, CatalogItemUpdate, CatalogItemOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=List[CatalogItemOut])
async def list_items(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(CatalogItem).order_by(CatalogItem.name))
    return result.scalars().all()


@router.post("", response_model=CatalogItemOut, status_code=201)
async def create_item(data: CatalogItemCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    item = CatalogItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{item_id}", response_model=CatalogItemOut)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item não encontrado")
    return item


@router.put("/{item_id}", response_model=CatalogItemOut)
async def update_item(item_id: int, data: CatalogItemUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
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
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item não encontrado")
    await db.delete(item)
    await db.commit()
