from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get("", response_model=List[MaterialOut])
async def list_materials(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Material).order_by(Material.brand))
    items = result.scalars().all()
    return [MaterialOut.from_orm_with_alert(m) for m in items]


@router.post("", response_model=MaterialOut, status_code=201)
async def create_material(data: MaterialCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    payload = data.model_dump()
    if payload["current_weight"] is None:
        payload["current_weight"] = payload["initial_weight"]
    material = Material(**payload)
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return MaterialOut.from_orm_with_alert(material)


@router.get("/{material_id}", response_model=MaterialOut)
async def get_material(material_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(404, "Material não encontrado")
    return MaterialOut.from_orm_with_alert(material)


@router.patch("/{material_id}", response_model=MaterialOut)
async def update_material(material_id: int, data: MaterialUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(404, "Material não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(material, k, v)
    await db.commit()
    await db.refresh(material)
    return MaterialOut.from_orm_with_alert(material)


@router.delete("/{material_id}", status_code=204)
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(404, "Material não encontrado")
    await db.delete(material)
    await db.commit()
