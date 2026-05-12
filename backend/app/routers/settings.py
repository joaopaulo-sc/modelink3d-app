from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.settings import SystemSettings
from app.schemas.settings import SettingsUpdate, SettingsOut, PublicSettingsOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


async def _get_or_create(db: AsyncSession) -> SystemSettings:
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
    cfg = result.scalar_one_or_none()
    if not cfg:
        cfg = SystemSettings(id=1)
        db.add(cfg)
        await db.commit()
        await db.refresh(cfg)
    return cfg


@router.get("/public", response_model=PublicSettingsOut)
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Expõe apenas dados necessários para a vitrine pública (sem autenticação)."""
    cfg = await _get_or_create(db)
    return cfg


@router.get("", response_model=SettingsOut)
async def get_settings(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await _get_or_create(db)


@router.put("", response_model=SettingsOut)
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    cfg = await _get_or_create(db)
    for k, v in data.model_dump().items():
        setattr(cfg, k, v)
    cfg.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(cfg)
    return cfg
