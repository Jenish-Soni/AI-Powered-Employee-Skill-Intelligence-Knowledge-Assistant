from pydantic import BaseModel, Field
from typing import Optional

class QueryRequest(BaseModel):
    query: str

class RoleUpdate(BaseModel):
    role: str

# ── Skill Intelligence Module ─────────────────────────────────────

class SkillInput(BaseModel):
    skill_id: str
    proficiency: int = Field(default=1, ge=1, le=5)

class EmployeeSkillsRequest(BaseModel):
    skills: list[SkillInput]

class ProgressUpdateRequest(BaseModel):
    progress_pct: int = Field(ge=0, le=100)
