# Fish Classifier (Demo) SPA (React + Vite + Tailwind + React Router)

An Azure Static Web Apps site that lets anyone upload a fish photo, stores it in Azure Blob Storage, and uses Azure AI Vision to describe what is in the image.

## Features
- React + Vite SPA with Tailwind and React Router.
- Azure Functions (`/api/upload-and-analyze`, `/api/recent`, `/api/stats`) handle uploads, shared history, and metrics.
- Dark-themed UI with a streamlined upload flow and dynamic results dashboard.
- Shared "recent analyses" list with thumbnails and detected objects available to every visitor.
- GitHub Actions workflow ready for Azure Static Web Apps deployment (app + API).

## Architecture Overview
1. The React app collects the image, previews it locally, and POSTs a base64 payload to `/api/upload-and-analyze`.
2. The upload Function writes the image to Blob Storage, calls Azure AI Vision for objects/tags, and saves a JSON metadata record alongside the blob.
3. `/api/recent` enumerates the metadata container, generates short-lived SAS links for each image, and returns the latest analyses.
4. `/api/stats` counts the metadata blobs to power the total recognitions counter on the home page.
5. The React results page consumes both the direct upload response and `/api/recent` so the latest analyses (with thumbnails) are visible to everyone.

## Local Development
```bash
# Frontend
npm install
npm run dev
```

To work on the Azure Functions locally you will need the [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) and Node 18+.
```bash
cd api
npm install
func start
```

## Build / Preview
```bash
npm run build
npm run preview
```

## Azure Configuration
Provision the following resources (or reuse existing ones) and add these settings in your Static Web App configuration (or surface them as GitHub secrets if you prefer to bind via workflow):

| Setting | Description |
| --- | --- |
| `AZURE_STORAGE_CONNECTION_STRING` | Connection string for the storage account that holds uploads and metadata. |
| `AZURE_STORAGE_CONTAINER` | (Optional) Blob container for uploaded images. Defaults to `uploads`. |
| `AZURE_METADATA_CONTAINER` | (Optional) Container that stores JSON metadata per analysis. Defaults to `analysis-metadata`. |
| `AZURE_VISION_ENDPOINT` | Endpoint of the Azure AI Vision resource (e.g. `https://<resource>.cognitiveservices.azure.com`). |
| `AZURE_VISION_KEY` | Primary or secondary key for the Vision resource. |
| `API_KEY` | (Optional) Shared secret required in the `x-api-key` header (or `api_key` query) to call the Functions. |
| `MAX_IMAGE_SIZE_BYTES` | (Optional) Maximum accepted upload size in bytes (default 6 MB). |

All settings must be present before running the Functions in Azure; otherwise requests will return a 500 with details about the missing configuration.

## Deploy to Azure Static Web Apps
1. Create (or reuse) a Static Web App.
2. Set **App location** to `.` and **Output location** to `dist`. The provided workflow deploys the Functions from `api/`.
3. Populate the GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_FIELD_03B865710` (match the workflow name).
4. After deployment, add the configuration settings listed above under **Settings -> Configuration** in the Static Web App.

## Frontend Flow
- `src/pages/Home.jsx`: loads shared stats and quick facts, with calls-to-action for upload/results.
- `src/pages/Upload.jsx`: handles file selection, preview, API submission, and navigation to the results page.
- `src/pages/Results.jsx`: fetches `/api/recent`, shows the active analysis (objects + preview), and lists the most recent analyses with thumbnails and detected objects.

`staticwebapp.config.json` allows anonymous access to `/api/*` and enables client-side routing. Adjust the configuration if you later secure endpoints or change containers.
