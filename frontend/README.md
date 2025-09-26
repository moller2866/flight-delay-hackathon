# Flight delay frontend

A lightweight React + TypeScript single-page app that connects to the workshop flight-delay API. It lets you pick a day of the week and a destination airport, calls the `/prediction` endpoint, and visualises the probability of arriving late.

## Prerequisites

- Node.js 20+
- Running instance of the backend from `../server` (defaults to `http://localhost:5000`)

## Quick start

```bash
cd frontend
cp .env.example .env               # optional if backend runs somewhere else
npm install                        # already done once when scaffolding
npm run dev
```

The dev server prints a local URL (usually `http://localhost:5173`). Open it in your browser. The app will auto-refresh on code changes.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL of the Flask API | `http://localhost:5000` |

If you are proxying/hosting the API elsewhere, update `.env` before running the app.

## Available scripts

- `npm run dev` – start Vite in development mode with hot-module reloading.
- `npm run build` – type-check and create a production build in `dist/`.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run ESLint across the project.

## Troubleshooting

- **CORS errors:** ensure the backend enables CORS for the frontend origin. During local development you can run both on `localhost` to avoid additional configuration.
- **No airports listed:** the API might be offline or unreachable. The banner includes a retry button; double-check `VITE_API_BASE_URL` if the issue persists.
