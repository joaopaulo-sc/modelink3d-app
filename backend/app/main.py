from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, text

from app.database import engine, AsyncSessionLocal, Base
from app.models import *  # noqa: F401,F403 — registers all models with Base
from app.core.config import settings
from app.core.security import hash_password
from app.routers import auth, clients, printers, materials, extra_services, orders, stock, settings as settings_router, catalog, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30)"
        ))
        await conn.execute(text(
            "ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS image_urls JSON"
        ))
        await conn.execute(text(
            "CREATE TABLE IF NOT EXISTS order_materials ("
            "id SERIAL PRIMARY KEY, "
            "order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, "
            "material_id INTEGER NOT NULL REFERENCES materials(id), "
            "estimated_weight FLOAT"
            ")"
        ))

    async with AsyncSessionLocal() as db:
        from app.models.user import User
        from app.models.settings import SystemSettings

        result = await db.execute(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))
        if not result.scalar_one_or_none():
            db.add(User(email=settings.FIRST_ADMIN_EMAIL, password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD)))

        result = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
        if not result.scalar_one_or_none():
            db.add(SystemSettings(id=1))

        await db.commit()

    yield


app = FastAPI(title="ModelInk3D API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(printers.router)
app.include_router(materials.router)
app.include_router(extra_services.router)
app.include_router(orders.router)
app.include_router(stock.router)
app.include_router(settings_router.router)
app.include_router(catalog.router)
app.include_router(upload.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
