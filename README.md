# Fish Recognition SPA (React + Vite + Tailwind + React Router)

A production-ready Single Page Application scaffold designed for Azure Static Web Apps (SWA),
ideal for the fish image-recognition project (frontend for uploads and viewing results).

## Features
- React + Vite (fast dev server, optimized build)
- Tailwind CSS (modern, utility-first styling)
- React Router v6 (client-side routing)
- Azure Static Web Apps config (SPA fallback, headers)
- GitHub Actions workflow for SWA deployment

## Getting Started
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to Azure Static Web Apps
1. Create a new SWA in the Azure Portal (or CLI).
2. Set **App location** to `.` and **Output location** to `dist`.
3. Use the included GitHub Actions workflow and set the SWA deployment token as a secret:
   - Secret name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: (copy from your Static Web App's deployment token)

## Backend Integration
- Upload flow: `src/pages/Upload.jsx` has placeholders to call your FastAPI backend to get a SAS URL and record metadata.
- Results view: `src/pages/Results.jsx` shows where to fetch predictions.
