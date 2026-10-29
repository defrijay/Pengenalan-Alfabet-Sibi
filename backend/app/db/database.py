import os
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Dukungan kompilasi tipe PostgreSQL JSONB jika berjalan di lingkungan SQLite
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


def create_resilient_engine():
    """
    Membuat engine database yang tangguh.
    Memprioritaskan PostgreSQL (dari variabel DATABASE_URL), dan otomatis
    melakukan fallback ke SQLite jika Postgres belum terhubung / belum aktif.
    """
    db_url = settings.sync_database_url
    # Jika URL database adalah postgresql
    if "postgres" in db_url:
        try:
            pg_engine = create_engine(db_url, pool_pre_ping=True)
            with pg_engine.connect() as conn:
                pass
            print(f"[Database] Berhasil terhubung ke PostgreSQL: {db_url.split('@')[-1]}")
            return pg_engine
        except Exception as e:
            print(f"[Database Warning] PostgreSQL belum dapat diakses ({e}).")
            print("[Database Info] Otomatis fallback ke database SQLite lokal 'sibi_data.db'.")

    # Fallback SQLite
    sqlite_url = "sqlite:///./sibi_data.db"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency FastAPI: buka session DB per-request, tutup otomatis setelahnya."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
