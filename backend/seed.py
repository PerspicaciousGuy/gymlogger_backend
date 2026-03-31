import json
import os
import re
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models import Exercise


def slugify(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def seed():
    init_db()
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    json_path = os.path.join(repo_root, "exercise_library.json")
    if not os.path.exists(json_path):
        print("exercise_library.json not found at", json_path)
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with Session(engine) as session:
        for item in data:
            slug = item.get("slug") or slugify(item.get("name", ""))
            existing = session.exec(select(Exercise).where(Exercise.slug == slug)).first()
            if existing:
                continue

            ex = Exercise(
                name=item.get("name"),
                slug=slug,
                category=item.get("category"),
                movement_pattern=item.get("movement_pattern"),
                primary_muscle=item.get("primary_muscle"),
                secondary_muscles=item.get("secondary_muscles", []),
                equipment=item.get("equipment"),
                difficulty=item.get("difficulty"),
                instructions=item.get("instructions", []),
                form_cues=item.get("form_cues", []),
                common_mistakes=item.get("common_mistakes", []),
                tags=item.get("tags", []),
                video_url=item.get("video_url") or None,
            )

            session.add(ex)
            session.flush()

        session.commit()
    print("Seed complete")


if __name__ == "__main__":
    seed()
