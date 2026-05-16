from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut, UserCreate
from app.routers.auth import get_current_user
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserOut])
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=UserOut, status_code=201)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "E-mail já cadastrado")
    if len(data.password) < 6:
        raise HTTPException(400, "Senha deve ter ao menos 6 caracteres")
    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(400, "Você não pode excluir sua própria conta")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    await db.delete(user)
    await db.commit()
