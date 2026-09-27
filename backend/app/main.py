from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, inference, sessions
from app.config import settings
from app.core.model_loader import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Muat model sekali saja saat server nyala, bukan setiap request.
    load_model()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(inference.router)
