"""
app/config.py — Environment variable settings for Tarazu backend.
"""
from __future__ import annotations
import os
import json
from functools import cached_property
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # ── AI ────────────────────────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Database ──────────────────────────────────────────────────────────────
    # When DATABASE_URL is blank, fall back to local SQLite file.
    database_url: str = ""

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        # Local SQLite fallback for dev without Docker
        db_path = os.path.join(os.path.dirname(__file__), "..", "tarazu.db")
        db_path = os.path.abspath(db_path)
        return f"sqlite+aiosqlite:///{db_path}"

    @property
    def is_sqlite(self) -> bool:
        url = self.effective_database_url
        return url.startswith("sqlite")

    # ── NVD ───────────────────────────────────────────────────────────────────
    nvd_api_base: str = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    nvd_api_timeout: int = 15

    # ── App ───────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    auth_required: bool = False
    api_key_tenants: str = ""

    @cached_property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit origins; wildcard origins are not allowed")
        return origins

    @cached_property
    def api_key_tenants_map(self) -> dict[str, list[str]]:
        if not self.api_key_tenants.strip():
            return {}
        try:
            parsed = json.loads(self.api_key_tenants)
        except json.JSONDecodeError as exc:
            raise ValueError("API_KEY_TENANTS must be valid JSON") from exc
        if not isinstance(parsed, dict):
            raise ValueError("API_KEY_TENANTS must be a JSON object")
        if not all(
            isinstance(key, str) and key.strip()
            and isinstance(org_ids, list)
            and all(isinstance(org_id, str) and org_id.strip() for org_id in org_ids)
            for key, org_ids in parsed.items()
        ):
            raise ValueError("API_KEY_TENANTS must map non-empty keys to non-empty organization ID strings")
        return parsed
    seed_on_startup: bool = True

    @property
    def ai_enabled(self) -> bool:
        return bool(self.groq_api_key and self.groq_api_key.strip())

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
