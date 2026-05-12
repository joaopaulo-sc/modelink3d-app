from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.extra_service import ExtraService
from app.schemas.extra_service import ExtraServiceCreate, ExtraServiceUpdate, ExtraServiceOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/extra-services", tags=["extra-services"])


@router.get("", response_model=List[ExtraServiceOut])
async def list_services(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(ExtraService).order_by(ExtraService.name))
    return result.scalars().all()


@router.post("", response_model=ExtraServiceOut, status_code=201)
async def create_service(data: ExtraServiceCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    svc = ExtraService(**data.model_dump())
    db.add(svc)
    await db.commit()
    await db.refresh(svc)
    return svc


@router.put("/{svc_id}", response_model=ExtraServiceOut)
async def update_service(svc_id: int, data: ExtraServiceUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(ExtraService).where(ExtraService.id == svc_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(404, "Serviço não encontrado")
    for k, v in data.model_dump().items():
        setattr(svc, k, v)
    await db.commit()
    await db.refresh(svc)
    return svc


@router.delete("/{svc_id}", status_code=204)
async def delete_service(svc_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(ExtraService).where(ExtraService.id == svc_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(404, "Serviço não encontrado")
    await db.delete(svc)
    await db.commit()
