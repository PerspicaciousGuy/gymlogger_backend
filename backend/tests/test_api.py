import os
from pathlib import Path

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session

# Set database URL before app imports so tests use an isolated SQLite file.
TEST_DB_PATH = Path(__file__).resolve().parent / "test_api.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"

from backend.app.database import engine
from backend.app.main import app
from backend.app.models import Exercise


def _setup_db() -> None:
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(
            Exercise(
                name="Test Push Up",
                slug="test-push-up",
                category="Strength",
                movement_pattern="Push",
                primary_muscle="Chest",
                secondary_muscles=["Triceps"],
                equipment="Body Only",
                difficulty="Beginner",
                instructions=["Do a push-up"],
                form_cues=["Brace core"],
                common_mistakes=["Sagging hips"],
                tags=["push", "bodyweight"],
                video_url="",
            )
        )
        session.add(
            Exercise(
                name="Test Row",
                slug="test-row",
                category="Strength",
                movement_pattern="Pull",
                primary_muscle="Back",
                secondary_muscles=["Biceps"],
                equipment="Cable",
                difficulty="Intermediate",
                instructions=["Row with control"],
                form_cues=["Squeeze shoulder blades"],
                common_mistakes=["Shrugging"],
                tags=["pull"],
                video_url="",
            )
        )
        session.commit()


def _client() -> TestClient:
    _setup_db()
    return TestClient(app)


def test_health() -> None:
    client = _client()
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_exercises_filters() -> None:
    client = _client()

    res_all = client.get("/exercises?limit=10&offset=0")
    assert res_all.status_code == 200
    assert res_all.json()["total"] == 2

    res_tag = client.get("/exercises?tag=pull")
    assert res_tag.status_code == 200
    assert res_tag.json()["total"] == 1
    assert res_tag.json()["items"][0]["slug"] == "test-row"

    res_equipment = client.get("/exercises?equipment=Body Only")
    assert res_equipment.status_code == 200
    assert res_equipment.json()["total"] == 1
    assert res_equipment.json()["items"][0]["slug"] == "test-push-up"


def test_get_exercise_by_slug() -> None:
    client = _client()

    ok = client.get("/exercises/test-push-up")
    assert ok.status_code == 200
    assert ok.json()["name"] == "Test Push Up"

    not_found = client.get("/exercises/does-not-exist")
    assert not_found.status_code == 404
