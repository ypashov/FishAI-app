from __future__ import annotations

# FastAI transfer learning entry point for fish classification dataset.

import argparse
from pathlib import Path

# Core FastAI vision APIs for building dataloaders and learners.
from fastai.vision.all import (
    DataBlock,
    ImageBlock,
    CategoryBlock,
    RandomSplitter,
    Resize,
    aug_transforms,
    get_image_files,
    vision_learner,
    error_rate,
    resnet18,
    resnet34,
    resnet50,
    resnet101,
)
import torch


# Pretrained architectures the user can choose from via CLI.
ARCH_CHOICES = {
    "resnet18": resnet18,
    "resnet34": resnet34,
    "resnet50": resnet50,
    "resnet101": resnet101,
}

# Default dataset root (can be overridden with --data-path).
DEFAULT_DATA_PATH = Path(
    r"C:\Users\burnbrain\OneDrive\Desktop\Fish classifier app\Dataset"
)


def parse_args() -> argparse.Namespace:
    """Build the command-line interface for configuring training."""
    parser = argparse.ArgumentParser(
        description="Train a FastAI vision classifier for fish species."
    )
    parser.add_argument(
        "--data-path",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Root folder containing one subfolder per fish class (default: dataset path shared in the project brief).",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        default=224,
        help="Image size (pixels) to which every image will be resized (default: 224).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size to use for training (default: 32).",
    )
    parser.add_argument(
        "--valid-pct",
        type=float,
        default=0.2,
        help="Fraction of images reserved for validation (default: 0.2).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Number of fine-tune epochs to run after the frozen stage (default: 5).",
    )
    parser.add_argument(
        "--freeze-epochs",
        type=int,
        default=1,
        help="Number of epochs to train the frozen head before unfreezing (default: 1).",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=2e-3,
        help="Base learning rate passed to fine_tune (default: 2e-3).",
    )
    parser.add_argument(
        "--arch",
        choices=ARCH_CHOICES.keys(),
        default="resnet34",
        help="Model architecture to use for transfer learning (default: resnet34).",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=Path("fish_classifier.pkl"),
        help="Where to save the exported learner (default: fish_classifier.pkl in the working directory).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed used for deterministic data splits (default: 42).",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cuda",
        help="Torch device identifier (default: cuda). Use cpu if you lack a compatible GPU.",
    )
    return parser.parse_args()


def build_dataloaders(
    data_path: Path,
    image_size: int,
    batch_size: int,
    valid_pct: float,
    seed: int,
    device: torch.device,
):
    """Create FastAI DataLoaders from the fish image folder structure."""
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset path '{data_path}' does not exist. Update --data-path to point to your images."
        )

    block = DataBlock(
        blocks=(ImageBlock, CategoryBlock),
        get_items=get_image_files,
        get_y=lambda path: path.parent.name,
        splitter=RandomSplitter(valid_pct=valid_pct, seed=seed),
        item_tfms=Resize(image_size),
        batch_tfms=aug_transforms(),
    )

    dls = block.dataloaders(
        data_path,
        bs=batch_size,
        num_workers=0,  # num_workers=0 keeps Windows runs simple; adjust if you prefer
    )
    return dls.to(device)


def main() -> None:
    """Orchestrate end-to-end training and export the resulting learner."""
    args = parse_args()

    if not torch.cuda.is_available() and args.device.startswith("cuda"):
        raise RuntimeError(
            "CUDA device requested but no GPU detected. Install the CUDA-enabled PyTorch build or switch --device cpu."
        )

    device = torch.device(args.device)

    dls = build_dataloaders(
        data_path=args.data_path,
        image_size=args.image_size,
        batch_size=args.batch_size,
        valid_pct=args.valid_pct,
        seed=args.seed,
        device=device,
    )

    arch = ARCH_CHOICES[args.arch]
    learn = vision_learner(
        dls,
        arch,
        metrics=[error_rate],
    )
    learn.to(device)

    learn.fine_tune(
        epochs=args.epochs,
        base_lr=args.learning_rate,
        freeze_epochs=args.freeze_epochs,
    )

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    learn.export(args.output_path)
    print(f"Model exported to: {args.output_path.resolve()}")


if __name__ == "__main__":
    main()
