from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, inference, sessions
from app.config import settings
from app.core.model_loader import load_model
from app.db.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Buat tabel otomatis jika belum ada di database
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[Warning] Gagal create_all database: {e}")

    # Muat model sekali saja saat server nyala, bukan setiap request.
    load_model()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
    }


app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(inference.router)
