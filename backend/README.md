# RideGuard Backend


FastAPI service exposing RideGuard dashboard and pricing contract endpoints.

## Built With

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- SQLite
- Requests

## Quickstart

1. **Clone the repo and enter backend:**
	```bash
	git clone https://github.com/Zero-Day-Smile/RideGuard_app_web.git
	cd RideGuard_app_web/backend
	```

2. **Create and activate a Python virtual environment:**
	```bash
	python -m venv .venv
	source .venv/bin/activate
	```

3. **Install dependencies:**
	```bash
	pip install -r requirements.txt
	```

4. **Copy and edit your environment file:**
	```bash
	cp .env.example .env
	# Edit .env to add your real API keys and DB URL
	```

5. **Start the server:**
	```bash
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
	```

6. **Open the API docs:**
	- Visit http://localhost:8000/docs in your browser.

Default local mode uses SQLite, and production can use PostgreSQL via `DATABASE_URL`.

## Implemented Endpoints

- `GET /health`
- `GET /api/v1/rider/summary`
- `GET /api/v1/admin/overview`
- `GET /api/v1/triggers`
- `POST /api/v1/pricing/quote`
- `POST /api/v1/admin/fraud-alerts`
- `PATCH /api/v1/admin/fraud-alerts/{alert_id}`
- `POST /api/v1/admin/trigger-events`
- `PATCH /api/v1/rider/snapshot`
- `GET /api/v1/admin/audit-logs?limit=20`

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=sqlite:///./rideguard.db
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

For PostgreSQL:

```bash
export DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/rideguard
```

## Contract Notes

- Responses are shaped for the dashboard service layer in `dashboard/app/api/*`.
- Pricing quote applies the RideGuard weekly premium formula and returns `computedPremium` and `riskScore`.
- Database schema and seed bootstrap are in `app/models.py` and `app/seed.py`.
