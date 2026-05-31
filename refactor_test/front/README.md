# CE System 2 — Frontend

React + Vite + MUI frontend for the Carnaval Experience admin system.

## Stack

- React 18
- Vite 5
- Material UI 5
- React Router 6

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env example and point `VITE_API_URL` to your backend:

   ```bash
   cp .env.example .env
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs at http://localhost:3000.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | Base URL of the backend (e.g. `https://ce-system-2-back.up.railway.app`) |

> Vite injects env vars at **build time**, so changing `VITE_API_URL` requires a new build.

## Deploy on Railway

1. Push this repository to GitHub.
2. Create a new project on Railway and import the GitHub repo (separate service from the backend).
3. Set the env var `VITE_API_URL` to the **public URL** of the deployed backend service.
4. Railway will run `npm install`, `npm run build`, then `npm start`, which serves the static `dist/` folder using `serve`.

## Production build locally

```bash
npm run build
npm start
```

This serves the production build from `dist/` on `PORT` (default `3000`).
