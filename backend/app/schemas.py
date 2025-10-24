from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PredictionItem(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class ClassificationResponse(BaseModel):
    id: str
    file_name: str
    description: str
    objects: List[PredictionItem]
    created_at: datetime
    image_url: Optional[str] = None


class RecentResponses(BaseModel):
    items: List[ClassificationResponse]
