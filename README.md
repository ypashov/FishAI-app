# FishAI App (FastAPI + React)

A container-friendly fish classification experience powered by your FastAI model. The stack combines a FastAPI backend (serving the exported learner) with a React/Vite front-end, designed to run locally and in Azure Container Apps.

## Features
- **FastAI inference service** - FastAPI serves `/api/classify`, `/api/recent`, `/api/stats`, and `/api/health`, loading `model/fish_classifier.pkl` once at startup.
- **Local metadata & uploads** - Classified images are stored in `storage/uploads` with metadata persisted to `storage/metadata.json` for quick recent-history queries.
- **React single-page app** - Vite + Tailwind UI drives the upload workflow, results dashboard, and recent gallery; it talks directly to the FastAPI endpoints.
- **Container ready** - A multi-stage `Dockerfile` builds the React bundle and packages the FastAPI app with all Python dependencies for Azure Container Apps (ACA) deployment.

## Project Structure
```
backend/
  app/
    main.py          # FastAPI entrypoint
    routes.py        # API routes
    service.py       # FastAI inference + persistence
    config.py        # Environment-driven settings
    storage.py       # Lightweight metadata helpers
    schemas.py       # Pydantic response models
  requirements.txt   # Backend dependencies
model/
  train_fish_classifier.py   # Training script (FastAI)
  infer_fish_classifier.py   # CLI inference helper
  fish_classifier.pkl        #  add your exported learner here
src/
  pages/...          # React routes (Home, Upload, Results)
Dockerfile           # Builds frontend + backend image
```

## Prerequisites
- Node.js 18+ and npm (for frontend development)
- Python 3.10+ with virtualenv (for backend development)
- FastAI-compatible `fish_classifier.pkl` in `model/`
- (Optional) Docker CLI for container builds

## Local Development

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
export FISHAI_MODEL_PATH=../model/fish_classifier.pkl  # adjust path if needed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Environment variables (all prefixed with `FISHAI_`):

| Variable            | Default                      | Description                                   |
|---------------------|------------------------------|-----------------------------------------------|
| `MODEL_PATH`        | `model/fish_classifier.pkl`  | Path to the exported FastAI learner           |
| `DEVICE`            | `cpu`                        | Torch device (`cpu`, `cuda`, `cuda:0`, etc.)  |
| `TOP_K`             | `5`                          | Predictions returned per request              |
| `MAX_UPLOAD_MB`     | `6`                          | Max accepted upload size                      |
| `UPLOAD_DIR`        | `storage/uploads`            | Where uploaded images are stored              |
| `METADATA_PATH`     | `storage/metadata.json`      | JSON store for recent predictions             |

### 2. Frontend
```bash
npm install
npm run dev
```
The Vite dev server proxies `/api/*` to `http://localhost:8000`, so start the backend first.

## Running via Docker
Build and run the container locally:
```bash
docker build -t fishai-app .
docker run --rm -p 8000:8000 \
  -e FISHAI_MODEL_PATH=/app/model/fish_classifier.pkl \
  fishai-app
```
The React bundle is served via FastAPI at `http://localhost:8000/`, with API routes under `/api/*`.

## Deploying to Azure Container Apps
1. **Build & push image** - Use Azure Container Registry (ACR):
   ```bash
   az acr build --registry <acr-name> --image fishai-app:latest .
   ```
2. **Provision ACA environment** - Create a Container Apps environment and Log Analytics workspace.
3. **Deploy Container App** - Point ACA to the pushed image:
   ```bash
   az containerapp create \
     --name fishai-app \
     --resource-group <rg> \
     --environment <aca-env> \
     --image <acr-name>.azurecr.io/fishai-app:latest \
     --ingress external --target-port 8000 \
     --env-vars FISHAI_MODEL_PATH=/app/model/fish_classifier.pkl FISHAI_DEVICE=cpu
   ```
4. **Model updates** - Rebuild and redeploy whenever you export a new `fish_classifier.pkl`.

If you need persistent storage across replicas (for uploads/metadata), mount Azure Files or another backing store and point `FISHAI_UPLOAD_DIR` / `FISHAI_METADATA_PATH` to the mounted volume.

## Testing & Quality
- `npm run lint` - ESLint for the React app.
- `npm run test:frontend` - Vitest + Testing Library suites.
- `python model/infer_fish_classifier.py --help` - quick CLI inference check.

Automated hooks (via `simple-git-hooks`) run `npm run lint` and `npm run test` on commit. Install dependencies once after cloning to activate.

## FastAI Utilities
- `model/train_fish_classifier.py` - configurable FastAI training pipeline (CLI prompts for dataset path and hyperparameters).
- `model/infer_fish_classifier.py` - stand-alone inference script used by the FastAPI backend and handy for quick checks.

## API Summary
| Endpoint            | Method | Purpose                                      |
|---------------------|--------|----------------------------------------------|
| `/api/health`       | GET    | Basic readiness probe                        |
| `/api/classify`     | POST   | Multipart image upload -> classification     |
| `/api/recent`       | GET    | Recent classifications (default 12 results)  |
| `/api/stats`        | GET    | Total classifications processed              |
| `/api/uploads/*`    | GET    | Served images stored on disk                 |

Enjoy running your fish classifier with your own model, locally or in Azure Container Apps!

