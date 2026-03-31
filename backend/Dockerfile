FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Use workspace root as context
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt gunicorn uvicorn[standard]

# Copy project files
COPY backend /app/backend
COPY exercise_library.json /app/exercise_library.json

# If we want to run migrations, we should handle them here. 
# But for now, we'll just use the init_db() in main.py which handles schema creation.

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

# CMD: Seed the database (idempotent) and then start the server
CMD python seed.py && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:${PORT:-8000}
