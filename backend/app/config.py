from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_prefix: str = Field(default="/api")
    model_path: Path = Field(
        default=Path("model/fish_classifier.pkl"), description="Path to exported FastAI learner."
    )
    device: str = Field(default="cpu", description="Torch device identifier (cpu, cuda, etc.).")
    upload_dir: Path = Field(default=Path("storage/uploads"))
    metadata_path: Path = Field(default=Path("storage/metadata.json"))
    top_k: int = Field(default=5, description="Number of predictions to return.")
    max_upload_mb: int = Field(default=6)

    class Config:
        env_prefix = "FISHAI_"
        env_file = ".env"


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.metadata_path.parent.mkdir(parents=True, exist_ok=True)
