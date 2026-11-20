"""
Vercel serverless entry point.
Imports the FastAPI app from the backend package so Vercel can serve it.
"""
import sys
import os

# Allow imports from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: F401, E402
