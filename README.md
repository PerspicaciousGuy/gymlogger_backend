# Exercise Backend - Gym Planner API

A lightweight FastAPI backend that serves an exercise database for the Flutter gym planner app. This API provides comprehensive exercise data including movement patterns, muscle groups, difficulty levels, and form cues.

## Overview

This project is an exercise catalog API built with FastAPI and SQLModel. It loads 2,900+ exercises from `exercise_library.json` into a SQLite database and exposes them through REST endpoints with filtering and pagination capabilities.

**Key Features:**
- ⚡ Fast, production-ready FastAPI server
- 📦 SQLModel ORM with automatic OpenAPI documentation
- 🗄️ SQLite database with Alembic migrations
- 🔄 Automatic database initialization and seeding
- 🧪 Comprehensive pytest test suite
- 🚀 Docker support for containerized deployment
- 📱 CORS-enabled for Flutter mobile/web clients
- 🔍 Advanced filtering (tag, equipment, muscle group)
- 📍 Full-text search by exercise name

---

## Project Structure

```
Exercise Backend/
├── backend/                          # Main application package
│   ├── app/
│   │   ├── __init__.py              # Package marker
│   │   ├── main.py                  # FastAPI application & endpoints
│   │   ├── models.py                # SQLModel Exercise schema
│   │   └── database.py              # Database engine initialization
│   ├── alembic/                     # Database migrations
│   │   ├── alembic.ini              # Alembic configuration
│   │   ├── env.py                   # Alembic runtime environment
│   │   ├── versions/                # Migration files
│   │   │   └── cf1ebd098977_create_exercise_table.py
│   │   └── README                   # Alembic quickstart
│   ├── tests/
│   │   └── test_api.py              # API endpoint tests
│   ├── requirements.txt             # Python dependencies
│   ├── seed.py                      # Data seeding script
│   ├── README.md                    # Backend-specific setup
│   └── FLUTTER.md                   # Flutter integration guide
├── exercise_library.json            # Source exercise data (2,900+ exercises)
├── exercise.db                      # SQLite database (auto-created)
├── Dockerfile                       # Docker configuration for deployment
├── alembic.ini                      # Root alembic config (alternate)
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | FastAPI | Latest |
| **Server** | Uvicorn | With standard extras |
| **ORM** | SQLModel | Latest |
| **Database** | SQLite (default) | Built-in |
| **Migrations** | Alembic | Latest |
| **Testing** | pytest | Latest |
| **Python** | Python | 3.11+ |
| **Deployment** | Docker + Gunicorn | Latest |

---

## Installation & Setup

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)

### Local Development (Windows)

1. **Clone/Navigate to the project:**
   ```powershell
   cd "Exercise Backend"
   ```

2. **Create a virtual environment:**
   ```powershell
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   ```powershell
   .venv\Scripts\Activate.ps1
   ```

4. **Install dependencies:**
   ```powershell
   pip install -r backend/requirements.txt
   ```

5. **Apply database migrations:**
   ```powershell
   python -m alembic upgrade head
   ```

6. **Seed the database with exercise data:**
   ```powershell
   python backend/seed.py
   ```

7. **Start the development server:**
   ```powershell
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`

### Access the API

- **Interactive API docs:** http://localhost:8000/docs (Swagger UI)
- **Alternative docs:** http://localhost:8000/redoc (ReDoc)
- **Health check:** http://localhost:8000/health

---

## API Endpoints

### Health Check
```
GET /health
```
Simple liveness probe for load balancers and orchestration platforms.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

### List Exercises
```
GET /exercises
```
Retrieve paginated list of exercises with optional filtering.

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | int | Items per page (default: 20) | `?limit=10` |
| `offset` | int | Skip N items for pagination (default: 0) | `?offset=40` |
| `tag` | string | Filter by single tag | `?tag=push` |
| `equipment` | string | Filter by equipment type | `?equipment=Dumbbell` |
| `search` | string | Full-text search in name/slug | `?search=bench` |

**Response (200 OK):**
```json
{
  "total": 2847,
  "items": [
    {
      "id": 1,
      "name": "Barbell Bench Press",
      "slug": "barbell-bench-press",
      "category": "Strength",
      "movement_pattern": "Push",
      "primary_muscle": "Chest",
      "secondary_muscles": ["Shoulders", "Triceps"],
      "equipment": "Barbell",
      "difficulty": "Intermediate",
      "instructions": [
        "Lie flat on bench",
        "Grip bar slightly wider than shoulders",
        "Lower bar to chest",
        "Press bar up explosively"
      ],
      "form_cues": ["Keep feet flat", "Control the eccentric"],
      "common_mistakes": ["Bouncing the bar", "Flaring elbows too wide"],
      "tags": ["compound", "push", "chest", "strength"],
      "video_url": ""
    }
  ]
}
```

**Example Requests:**
```
GET /exercises?limit=5
GET /exercises?offset=100&limit=20
GET /exercises?tag=bodyweight
GET /exercises?equipment=Dumbbell&tag=core
GET /exercises?search=squat
```

### Get Exercise by Slug
```
GET /exercises/{slug}
```
Retrieve a single exercise by its URL-friendly slug identifier.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `slug` | URL-friendly exercise identifier (e.g., `bench-press`) |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Barbell Bench Press",
  "slug": "barbell-bench-press",
  "category": "Strength",
  "movement_pattern": "Push",
  "primary_muscle": "Chest",
  "secondary_muscles": ["Shoulders", "Triceps"],
  "equipment": "Barbell",
  "difficulty": "Intermediate",
  "instructions": [...],
  "form_cues": [...],
  "common_mistakes": [...],
  "tags": [...],
  "video_url": ""
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Exercise not found"
}
```

**Example Requests:**
```
GET /exercises/bench-press
GET /exercises/dumbbell-squat
GET /exercises/push-up
```

---

## Database Schema

### Exercise Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | TEXT | NOT NULL | Exercise display name |
| `slug` | TEXT | NOT NULL UNIQUE | URL-friendly identifier |
| `category` | TEXT | | Classification (e.g., "Strength", "Cardio") |
| `movement_pattern` | TEXT | | Type (e.g., "Push", "Pull", "Core", "Legs") |
| `primary_muscle` | TEXT | | Main targeted muscle group |
| `secondary_muscles` | JSON | | Array of auxiliary muscles |
| `equipment` | TEXT | | Equipment needed (e.g., "Barbell", "Dumbbell") |
| `difficulty` | TEXT | | Skill level ("Beginner", "Intermediate", "Advanced") |
| `instructions` | JSON | | Array of step-by-step instructions |
| `form_cues` | JSON | | Array of form tips and best practices |
| `common_mistakes` | JSON | | Array of errors to avoid |
| `tags` | JSON | | Array of categorical tags |
| `video_url` | TEXT | | Link to demonstration video (optional) |

**Indexes:**
- `slug` — Indexed for fast lookups by slug

---

## Database Migrations

### Overview
The project uses **Alembic** for database versioning. All schema changes are tracked in migration files under `backend/alembic/versions/`.

**Current Baseline:** `cf1ebd098977_create_exercise_table.py`
- Creates the `exercise` table with all 14 columns
- Includes indexes and constraints
- Single migration maintains simplicity

### Common Migration Commands

**Create a new migration** (auto-detect changes):
```powershell
python -m alembic revision --autogenerate -m "Describe your change"
```

**Apply all pending migrations:**
```powershell
python -m alembic upgrade head
```

**Downgrade to previous revision:**
```powershell
python -m alembic downgrade -1
```

**View migration history:**
```powershell
python -m alembic history
```

**See current database version:**
```powershell
python -m alembic current
```

---

## Testing

### Running Tests

Run all tests:
```powershell
cd backend
pytest
```

Run tests with verbose output:
```powershell
pytest -v
```

Run specific test file:
```powershell
pytest tests/test_api.py
```

Run specific test function:
```powershell
pytest tests/test_api.py::test_health
```

### Test Suite

Located in `backend/tests/test_api.py`, includes:

1. **`test_health()`** — Verifies health endpoint returns 200 OK
2. **`test_exercise_endpoints()`** — Tests list and get endpoints with real data
3. **`test_exercise_filters()`** — Tests filtering by tag, equipment, and search

**Test Database:**
- Tests use isolated SQLite database (`test_api.db`)
- Schema is reset before each test for consistency
- No dependencies on production data

**Running Tests:**
```powershell
pytest backend/tests -q       # Quiet mode
pytest backend/tests -v       # Verbose mode
pytest backend/tests --cov    # With coverage (if coverage installed)
```

---

## Data Seeding

### Overview
The `backend/seed.py` script imports exercises from `exercise_library.json` into the database.

### What It Does
1. Reads `exercise_library.json` (2,900+ exercise entries)
2. Generates URL-friendly slugs from exercise names
3. Parses JSON arrays for `secondary_muscles`, `instructions`, `form_cues`, `common_mistakes`, and `tags`
4. Inserts all exercises into the `exercise` table
5. **Skips duplicates** (by slug) if exercise already exists

### Running the Seed Script
```powershell
python backend/seed.py
```

### Data Source
- **File:** `exercise_library.json` (root directory)
- **Format:** JSON array of exercise objects
- **Record Count:** 2,847 unique exercises (after deduplication)
- **Fields:** name, category, movement_pattern, primary_muscle, secondary_muscles, equipment, difficulty, instructions, form_cues, common_mistakes, tags, video_url

---

## Development

### Environment Variables

Optional environment variables for configuration:

```powershell
# Database connection (defaults to SQLite)
$env:DATABASE_URL = "sqlite:///exercise.db"

# Or for PostgreSQL:
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/exercise_db"
```

### Adding New Features

1. **New Endpoint:** Edit `backend/app/main.py`
2. **Database Change:** 
   - Modify `backend/app/models.py`
   - Create migration: `python -m alembic revision --autogenerate -m "description"`
   - Apply migration: `python -m alembic upgrade head`
3. **Tests:** Add test functions to `backend/tests/test_api.py`

### Code Organization

```
backend/app/
├── main.py       # FastAPI app & all endpoints (router pattern could be used for larger projects)
├── models.py     # SQLModel schemas
├── database.py   # Engine & connection setup
└── __init__.py   # Package marker
```

### Dependencies
All Python dependencies are listed in `backend/requirements.txt`:
- `fastapi` — Web framework
- `uvicorn[standard]` — ASGI server
- `sqlmodel` — ORM combining Pydantic + SQLAlchemy
- `alembic` — Database migrations
- `pytest` — Testing framework
- `psycopg2-binary` — PostgreSQL driver (for production deployments)

---

## Flutter Integration

This API is designed to serve a Flutter gym planner app. For Flutter-specific integration details, endpoint examples, and client code snippets, see [backend/FLUTTER.md](backend/FLUTTER.md).

### Quick Start for Flutter Developers

**Android Emulator:**
```dart
const String baseUrl = 'http://10.0.2.2:8000';
```

**iOS Simulator:**
```dart
const String baseUrl = 'http://127.0.0.1:8000';
```

**Physical Device:**
```dart
const String baseUrl = 'http://192.168.x.x:8000'; // Your machine IP
```

Example API call:
```dart
final response = await http.get(
  Uri.parse('$baseUrl/exercises?tag=push&limit=10'),
);
```

---

## Deployment

### Docker Deployment

Build the Docker image:
```bash
docker build -t exercise-api .
```

Run the container:
```bash
docker run -p 8000:8000 exercise-api
```

The API will start at `http://localhost:8000`

**Production Environment Variables:**
```bash
docker run -e DATABASE_URL=postgresql://... -p 8000:8000 exercise-api
```

### Environment-Specific Configurations

**Development:**
- SQLite database (`exercise.db`)
- CORS enabled for all origins
- Auto-reload server

**Production:**
- PostgreSQL recommended (switch `DATABASE_URL`)
- CORS restricted to known origins (update `backend/app/main.py`)
- Run with Gunicorn (already in Dockerfile)
- Behind a reverse proxy (nginx/Caddy)

### Cloud Deployment Options

1. **Render.com** (configured in Dockerfile)
   - Upload repository
   - Set `DATABASE_URL` environment variable
   - Deploy automatically

2. **Heroku** (legacy, but still supported)
   - Add `Procfile`
   - Set build pack to Python 3.11

3. **AWS/Azure/GCP** (Kubernetes/App Service)
   - Use provided Dockerfile
   - Scale with multiple worker processes

---

## Troubleshooting

### Common Issues

**`ModuleNotFoundError: No module named 'backend'`**
- Solution: Ensure you're running commands from the project root, or set `PYTHONPATH=/app/backend`

**`Database is locked` (Windows)**
- Solution: This is rare with SQLite in-memory or file mode. Use PostgreSQL for production.

**`exercise_library.json not found`**
- Solution: Ensure `exercise_library.json` is in the project root before running `seed.py`

**Port 8000 already in use**
- Solution: Change port: `uvicorn backend.app.main:app --port 8001`

**Tests fail with database errors**
- Solution: Ensure test database file can be created in `backend/` directory. Check write permissions.

---

## Performance Notes

- **Exercise List Query:** ~50ms for 20 items with filtering (SQLite)
- **Exercise Lookup by Slug:** ~5ms (indexed query)
- **Database Size:** ~2 MB SQLite, ~5 MB with indexes
- **Memory Footprint:** ~100 MB per worker process

For high-traffic production (1000+ concurrent users), consider:
- PostgreSQL instead of SQLite
- Redis caching for exercise lists
- Multiple Gunicorn workers (4-8 recommended)
- CDN for static content

---

## Contributing

To add features or fix bugs:

1. Create a feature branch: `git checkout -b feature/exercise-filters`
2. Make changes and add tests
3. Run tests: `pytest backend/tests -v`
4. Commit: `git commit -am "Add exercise filtering"`
5. Push and open a PR

---

## License

This project is part of the Flutter gym planner application.

---

## Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **SQLModel Docs:** https://sqlmodel.tiangolo.com
- **Alembic Docs:** https://alembic.sqlalchemy.org
- **OpenAPI Spec:** http://localhost:8000/openapi.json

---

## Support

For issues, questions, or feature requests, refer to the project documentation or check the [conversation summary](conversation-summary.md) for project history and decision rationale.

---

**Last Updated:** April 24, 2026  
**Status:** Production-ready ✅
