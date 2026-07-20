"""
routes/auth.py
---------------
Lightweight authentication for the Login Page. This is a
demo-grade implementation (hardcoded / in-memory user store +
signed opaque token) — swap for a real user table + JWT/OAuth in V2
once PostgreSQL is wired in.
"""

from __future__ import annotations

import hashlib
import hmac
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = "sl-dashboard-dev-secret-change-me"

# Demo user store: username -> (password, role)
USERS = {
    "admin": ("admin123", "Administrator"),
    "wfm": ("wfm123", "WFM Analyst"),
    "manager": ("manager123", "Operations Manager"),
}


class LoginRequest(BaseModel):
    username: str
    password: str


def _make_token(username: str) -> str:
    payload = f"{username}:{int(time.time())}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


@router.post("/login", summary="Authenticate and receive a session token")
def login(body: LoginRequest):
    record = USERS.get(body.username)
    if not record or record[0] != body.password:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = _make_token(body.username)
    return {
        "token": token,
        "username": body.username,
        "role": record[1],
    }
