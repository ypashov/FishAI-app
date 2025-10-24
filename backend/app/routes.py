from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from .config import settings
from .schemas import ClassificationResponse, RecentResponses
from .service import ModelService, model_service
from .storage import count_records, list_records

router = APIRouter()


def get_service() -> ModelService:
    return model_service


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/classify", response_model=ClassificationResponse)
async def classify_image(
    file: UploadFile = File(...),
    service: ModelService = Depends(get_service),
) -> ClassificationResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=400, detail=f"Image exceeds maximum size of {settings.max_upload_mb} MB."
        )
    return service.predict(file.filename or "upload.jpg", data)


@router.get("/recent", response_model=RecentResponses)
def recent_predictions(limit: int = 12) -> RecentResponses:
    limit = max(1, min(limit, 50))
    items = list_records(settings.metadata_path, limit)
    return RecentResponses(items=items)


@router.get("/stats")
def stats() -> dict[str, int]:
    return {"totalRecognitions": count_records(settings.metadata_path)}
