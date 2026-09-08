"""
app/database.py — Async SQLAlchemy engine.
Supports both PostgreSQL (Docker) and SQLite (local dev, no Docker needed).
"""
from __future__ import annotations
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


# Build engine kwargs — SQLite needs check_same_thread=False
def _make_engine():
    url = settings.effective_database_url
    kwargs: dict = {"echo": False}
    if settings.is_sqlite:
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_async_engine(url, **kwargs)


engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables (idempotent — safe to call on every startup)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
