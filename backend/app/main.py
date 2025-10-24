from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import settings
from .routes import router

app = FastAPI(title="FishAI Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)

uploads_dir = settings.upload_dir
app.mount(
    f"{settings.api_prefix}/uploads",
    StaticFiles(directory=uploads_dir, check_dir=False),
    name="uploads",
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(directory=FRONTEND_DIR, html=True),
        name="static",
    )


@app.get("/")
def root() -> FileResponse | dict[str, str]:
    if FRONTEND_DIR.exists():
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=500, detail="Frontend bundle missing index.html.")
    return {"message": "FishAI classifier service", "docs": "/docs"}


@app.get("/{full_path:path}")
def spa_routes(full_path: str) -> FileResponse | dict[str, str]:
    if full_path.startswith(settings.api_prefix.lstrip("/")):
        raise HTTPException(status_code=404, detail="Not found")
    if FRONTEND_DIR.exists():
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=500, detail="Frontend bundle missing index.html.")
    return {"message": "FishAI classifier service", "docs": "/docs"}
