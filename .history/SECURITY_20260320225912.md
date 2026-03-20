# Security Checklist

This project is a hackathon demo. Use this checklist before sharing, deploying, or submitting.

## 1. Secrets and Credentials

- Never commit real API keys, database passwords, private keys, or tokens.
- Keep runtime secrets in local `.env` files only.
- Commit only template files such as `backend/.env.example` and `dashboard/.env.example`.

## 2. Local Run Safety

- Prefer local SQLite for demos unless PostgreSQL is required.
- Keep backend bound to localhost in development.
- Use the configured CORS allowlist only for known local origins.

## 3. API Safety

- Validate inputs with schema constraints (already enabled via Pydantic models).
- Treat admin endpoints as privileged and protect them before production use.
- Add auth + rate limiting before exposing any admin mutation endpoints publicly.

## 4. Data Safety

- Do not store real rider PII in sample/demo datasets.
- Use synthetic IDs and mock telemetry for demos.
- Rotate and purge logs before public release if they include sensitive details.

## 5. Dependency Safety

- Keep frontend and backend dependencies updated.
- Run package audits before release:
  - `npm --prefix dashboard audit`
  - `pip list --outdated` (inside the project virtual environment)

## 6. Release Gate

Before final submission/deploy:

- Confirm no secrets are present in tracked files.
- Confirm `.gitignore` is active for env files, DB files, and keys.
- Confirm only required ports/services are exposed.
