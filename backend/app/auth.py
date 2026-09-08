"""Small deployment-facing API-key and organization-scope guard."""
from __future__ import annotations

from dataclasses import dataclass
import secrets

from fastapi import Header, HTTPException, Request, status

from .config import settings


@dataclass(frozen=True)
class AuthContext:
    allowed_org_ids: frozenset[str]

    @property
    def can_access_all_orgs(self) -> bool:
        return "*" in self.allowed_org_ids


async def require_api_key(
    request: Request,
    x_api_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> AuthContext:
    """Authenticate a request and return the organization's permitted scope."""
    if not settings.auth_required:
        return AuthContext(frozenset({"*"}))

    supplied = x_api_key or ""
    if not supplied and authorization and authorization.lower().startswith("bearer "):
        supplied = authorization[7:].strip()
    if not supplied:
        supplied = request.query_params.get("api_key") or ""
    if not supplied:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="An API key is required")

    for configured_key, allowed_org_ids in settings.api_key_tenants_map.items():
        if secrets.compare_digest(supplied, configured_key):
            context = AuthContext(frozenset(allowed_org_ids))
            request.state.auth = context
            return context

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


def assert_org_access(auth: AuthContext, org_id: str) -> None:
    """Raise 403 unless the caller has access to the requested organization."""
    if auth.can_access_all_orgs or org_id in auth.allowed_org_ids:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This API key is not authorized for the requested organization",
    )
