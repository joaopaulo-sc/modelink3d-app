from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.printer import Printer
from app.schemas.printer import PrinterCreate, PrinterUpdate, PrinterOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/printers", tags=["printers"])


@router.get("", response_model=List[PrinterOut])
async def list_printers(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Printer))
    return result.scalars().all()


@router.post("", response_model=PrinterOut, status_code=201)
async def create_printer(data: PrinterCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    printer = Printer(**data.model_dump())
    db.add(printer)
    await db.commit()
    await db.refresh(printer)
    return printer


@router.patch("/{printer_id}", response_model=PrinterOut)
async def update_printer(printer_id: int, data: PrinterUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()
    if not printer:
        raise HTTPException(404, "Impressora não encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(printer, k, v)
    await db.commit()
    await db.refresh(printer)
    return printer


@router.delete("/{printer_id}", status_code=204)
async def delete_printer(printer_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()
    if not printer:
        raise HTTPException(404, "Impressora não encontrada")
    await db.delete(printer)
    await db.commit()
