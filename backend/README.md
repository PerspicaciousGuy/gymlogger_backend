# Exercise Backend (FastAPI)

Exercise-catalog-only backend for the Flutter gym planner app.

Setup (Windows):

```powershell
cd "backend"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
python -m uvicorn backend.app.main:app --reload --port 8000
```

Endpoints:
- `GET /health` — health check
- `GET /exercises` — list exercises (query params: `limit`, `offset`, `tag`, `equipment`, `search`)
- `GET /exercises/{slug}` — get exercise by slug

Migrations:
- Create migration: `python -m alembic revision --autogenerate -m "your message"`
- Apply migration: `python -m alembic upgrade head`

Notes:
- Uses SQLite by default (`exercise.db`).
- `exercise_library.json` is expected in the repository root for `seed.py`.
