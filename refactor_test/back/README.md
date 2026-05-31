# CE System 2 — Backend

Node.js + Express + PostgreSQL backend for the Carnaval Experience admin system.

## Stack

- Node.js 20+
- Express 4
- PostgreSQL (via `pg`)
- JWT auth (`jsonwebtoken`)

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env example and fill it in:

   ```bash
   cp .env.example .env
   ```

3. Run migrations (creates the schema in the configured DB):

   ```bash
   npm run migrate
   ```

4. Start in dev mode:

   ```bash
   npm run dev
   ```

The server listens on `PORT` (default `3001`). Health check at `GET /health`.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Secret used to sign JWTs |
| `PORT` | no | Defaults to `3001` (Railway sets this automatically) |
| `NODE_ENV` | no | `production` enables SSL on Postgres by default |
| `CORS_ORIGIN` | no | Comma-separated list of allowed origins. `*` allows any. |
| `PGSSL` | no | Force `true`/`false` for Postgres SSL (overrides auto-detection) |

## Deploy on Railway

1. Push this repository to GitHub.
2. Create a new project on Railway and import the GitHub repo.
3. Add the **PostgreSQL** plugin — Railway will populate `DATABASE_URL` automatically.
4. Set the required env vars (`JWT_SECRET`, `CORS_ORIGIN`).
5. Deploy. Railway will run, in order:
   - `npm install` (build)
   - `npm run migrate` (pre-deploy — applies any pending migrations)
   - `npm start` (start command)
6. Point the frontend at the public URL Railway gives you for this service.

## Migrations

Migrations live in `migrations/` as numbered SQL files (`001_*.sql`, `002_*.sql`, …).

The runner (`src/shared/db.js → runMigrations()`):

- Tracks applied files in a `_migrations` table.
- Applies only files not yet recorded, sorted by filename.
- Wraps each migration in a transaction (rollback on failure).

This means migrations run automatically on every Railway deploy via `preDeployCommand` in `railway.json`. To run manually (e.g. against a fresh local DB):

```bash
npm run migrate
```

When adding new migrations:

1. Create `migrations/00X_description.sql`.
2. Prefer idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) so a partial state is safe to retry.
3. Commit and push — Railway runs it on the next deploy.
