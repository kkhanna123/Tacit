"""Vercel entrypoint — exposes the FastAPI app for the Python runtime.

Local dev still uses `uvicorn app.main:app` (see dev.sh).
"""
from app.main import app  # noqa: F401
