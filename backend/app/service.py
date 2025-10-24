from __future__ import annotations

import io
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

import torch
from fastai.learner import load_learner
from fastai.vision.all import PILImage

from .config import settings
from .schemas import ClassificationResponse, PredictionItem
from .storage import add_record


class ModelService:
    def __init__(self) -> None:
        if settings.device.startswith("cuda") and not torch.cuda.is_available():
            raise RuntimeError("CUDA requested but not available. Set FISHAI_DEVICE=cpu.")

        cpu = settings.device.startswith("cpu")
        self.learner = load_learner(settings.model_path, cpu=cpu)
        self.learner.to(settings.device)

    def predict(self, file_name: str, data: bytes) -> ClassificationResponse:
        image = PILImage.create(io.BytesIO(data))
        _, pred_idx, probabilities = self.learner.predict(image)

        vocab = list(self.learner.dls.vocab)
        probs_tensor = torch.tensor(probabilities, device="cpu")

        top_k = max(1, min(settings.top_k, len(vocab)))
        top_values, top_indices = torch.topk(probs_tensor, top_k)

        predictions: List[PredictionItem] = [
            PredictionItem(label=vocab[idx], confidence=float(value))
            for value, idx in zip(top_values.tolist(), top_indices.tolist())
        ]

        primary = predictions[0]
        description = f"Likely {primary.label} ({round(primary.confidence * 100)}% confidence)"

        safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", file_name) or "upload.jpg"

        record = ClassificationResponse(
            id=str(uuid.uuid4()),
            file_name=safe_name,
            description=description,
            objects=predictions,
            created_at=datetime.utcnow(),
            image_url=None,
        )

        self._persist_upload(record, data)
        return record

    def _persist_upload(self, record: ClassificationResponse, data: bytes) -> None:
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = settings.upload_dir / f"{record.id}-{record.file_name}"
        file_path.write_bytes(data)
        record.image_url = f"/api/uploads/{file_path.name}"
        add_record(settings.metadata_path, record)


model_service = ModelService()
