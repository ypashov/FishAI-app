# Fish Recognition SPA (React + Vite + Tailwind + React Router)

An Azure Static Web Apps site that lets users upload a fish photo, stores it in Azure Blob Storage, and calls Azure AI Vision to describe what is in the image.

## Features
- React + Vite SPA with Tailwind and React Router.
- Azure Function (`/api/upload-and-analyze`) handles blob uploads and Vision analysis.
- One-click upload experience that redirects users to a rich analysis view.
- Time-limited SAS link returned so the analyzed photo can be revisited for ~1 hour.
- GitHub Actions workflow ready for SWA deployment (app + API).

## Architecture Overview
1. The React app collects the image, previews it locally, and POSTs a base64 payload to `/api/upload-and-analyze`.
2. The Azure Function writes the image to Blob Storage, generates a read-only SAS URL, and calls Azure AI Vision for `Description`, `Tags`, and `Objects`.
3. The function response (image SAS, captions, tags, objects, raw payload) is cached locally in the browser and rendered on the `/results` route.

## Local Development
```bash
# Frontend
npm install
npm run dev
```

To work on the Azure Function locally you will need the [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) and Node 18+.
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
Provision the following resources (or reuse existing ones) and store their secrets as application settings for the Static Web App (or as GitHub secrets if you prefer to bind via workflow):

| Setting | Description |
| --- | --- |
| `AZURE_STORAGE_CONNECTION_STRING` | Connection string for the storage account that holds your images. |
| `AZURE_STORAGE_CONTAINER` | (Optional) Name of the blob container. Defaults to `uploads` if omitted. |
| `AZURE_VISION_ENDPOINT` | Endpoint of your Azure AI Vision resource, e.g. `https://<resource>.cognitiveservices.azure.com`. |
| `AZURE_VISION_KEY` | Primary/secondary key for the Vision resource. |

All secrets must be configured before deploying; otherwise the function returns a 500 response indicating the missing configuration.

## Deploy to Azure Static Web Apps
1. Create a new SWA in the Azure Portal (or CLI).
2. Set **App location** to `.` and **Output location** to `dist`. The included workflow already deploys the API from `api/`.
3. Configure the GitHub Action with your SWA deployment token via repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_COAST_0C0378410` (matching the workflow).
4. After deployment, add the Function configuration values above under **Settings → Configuration** in the Static Web App.

## Frontend Flow
- `src/pages/Upload.jsx`: handles file selection, preview, API call, and navigation to results.
- `src/pages/Results.jsx`: reads the analysis payload (from route state or local storage), shows the AI summary, tags, detected objects, and the SAS-backed image preview.

The `staticwebapp.config.json` grants anonymous access to the API routes so the SPA can call them without authentication. Adjust as needed if you later add secured endpoints.
