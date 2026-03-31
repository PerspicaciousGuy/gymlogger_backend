from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import engine, init_db
from .models import Exercise


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    init_db()
    yield

app = FastAPI(title="Exercise Library API", lifespan=lifespan)

# Allow cross-origin requests for development (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




def exercise_to_dict(ex: Exercise) -> dict:
    return {
        "id": ex.id,
        "name": ex.name,
        "slug": ex.slug,
        "category": ex.category,
        "movement_pattern": ex.movement_pattern,
        "primary_muscle": ex.primary_muscle,
        "secondary_muscles": ex.secondary_muscles,
        "equipment": ex.equipment,
        "difficulty": ex.difficulty,
        "instructions": ex.instructions,
        "form_cues": ex.form_cues,
        "common_mistakes": ex.common_mistakes,
        "tags": ex.tags or [],
        "video_url": ex.video_url,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/exercises")
def list_exercises(
    limit: int = 20,
    offset: int = 0,
    tag: Optional[str] = None,
    equipment: Optional[str] = None,
    search: Optional[str] = None,
):
    with Session(engine) as session:
        statement = select(Exercise)
        exercises = session.exec(statement).all()

        filtered: List[Exercise] = []
        for ex in exercises:
            if equipment and (not ex.equipment or ex.equipment.lower() != equipment.lower()):
                continue
            if tag and not any(t.lower() == tag.lower() for t in (ex.tags or [])):
                continue
            if search and search.lower() not in (ex.name or "").lower() and search.lower() not in (ex.slug or "").lower():
                continue
            filtered.append(ex)

        total = len(filtered)
        page = filtered[offset : offset + limit]
        return {"total": total, "items": [exercise_to_dict(e) for e in page]}


@app.get("/exercises/{slug}")
def get_exercise(slug: str):
    with Session(engine) as session:
        stmt = select(Exercise).where(Exercise.slug == slug)
        ex = session.exec(stmt).first()
        if not ex:
            raise HTTPException(status_code=404, detail="Exercise not found")
        return exercise_to_dict(ex)
