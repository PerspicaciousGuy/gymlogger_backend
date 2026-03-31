from __future__ import annotations
from typing import List, Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.types import JSON as JSONType


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str
    category: Optional[str] = None
    movement_pattern: Optional[str] = None
    primary_muscle: Optional[str] = None
    secondary_muscles: List[str] = Field(default_factory=list, sa_column=Column(JSONType))
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    instructions: List[str] = Field(default_factory=list, sa_column=Column(JSONType))
    form_cues: List[str] = Field(default_factory=list, sa_column=Column(JSONType))
    common_mistakes: List[str] = Field(default_factory=list, sa_column=Column(JSONType))
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSONType))
    video_url: Optional[str] = None
