# Free Deployment Guide (Stable + Free)

This uses a free, stable combo:

- Frontend: Cloudflare Pages (free)
- Backend: Render Web Service (free)
- Database: Neon Postgres (free)

## 1. Push code to GitHub

1. Create a new GitHub repo.
2. Push this project.

## 2. Create free Postgres on Neon

1. Sign in to Neon.
2. Create a project and database.
3. Copy the connection string.
4. Make sure it uses SSL mode (typically already included).

## 3. Deploy backend on Render

1. Sign in to Render.
2. Create a new Blueprint deployment from your GitHub repo.
3. Render will detect `render.yaml` and create `rideguard-api`.
4. In Render service environment variables, set:
   - `DATABASE_URL` = your Neon connection string
   - `CORS_ORIGINS` = your Cloudflare frontend URL (set this after frontend deploy)
5. Deploy and verify backend health:
   - `https://<your-render-api>/health`

## 4. Deploy frontend on Cloudflare Pages

1. Sign in to Cloudflare Pages.
2. Create project from your GitHub repo.
3. Use these settings:
   - Framework preset: Vite
   - Root directory: `dashboard`
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
4. Add environment variable in Cloudflare Pages:
   - `VITE_API_BASE_URL` = `https://<your-render-api>`
5. Deploy.

## 5. Final wire-up

1. Copy your Cloudflare frontend URL.
2. Update Render env var `CORS_ORIGINS` to that exact URL.
3. Redeploy Render backend.
4. Hard refresh frontend and test dashboard/API flows.

## 6. Notes

- Free backend tiers may sleep; first request can be slow.
- `dashboard/public/_redirects` is included so SPA routes work on Cloudflare Pages.
- If you want custom domain later, keep same env vars and update `CORS_ORIGINS`.
