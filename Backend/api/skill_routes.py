"""
skill_routes.py — API endpoints for the Skill Intelligence module.
"""
from fastapi import APIRouter, HTTPException
from models.schemas import EmployeeSkillsRequest, ProgressUpdateRequest
from services import skill_service

router = APIRouter()


# ──────────────────────────────────────────────────────────────────
# Skills Catalogue
# ──────────────────────────────────────────────────────────────────

@router.get("/catalogue")
async def get_catalogue():
    """Return all skills grouped by category for the assessment picker."""
    try:
        return {"catalogue": skill_service.get_skill_catalogue()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────
# Employee Self-Assessment
# ──────────────────────────────────────────────────────────────────

@router.get("/employee/{employee_id}/skills")
async def get_employee_skills(employee_id: str):
    """Return an employee's saved skills with proficiency levels."""
    try:
        skills = skill_service.get_employee_skills_detail(employee_id)
        return {"skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/{employee_id}/assess")
async def assess_skills(employee_id: str, request: EmployeeSkillsRequest):
    """
    Upsert an employee's skill proficiency list.
    Replaces everything — send the full list each time.
    """
    try:
        count = skill_service.save_employee_skills(
            employee_id,
            [s.model_dump() for s in request.skills]
        )
        return {"message": f"Saved {count} skills", "count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/employee/{employee_id}/skill/{skill_id}")
async def remove_skill(employee_id: str, skill_id: str):
    """Remove a specific skill from an employee's profile."""
    try:
        skill_service.delete_employee_skill(employee_id, skill_id)
        return {"message": "Skill removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────
# ML Recommendation Engine
# ──────────────────────────────────────────────────────────────────

@router.get("/employee/{employee_id}/recommendations")
async def get_recommendations(employee_id: str, top_n: int = 5):
    """
    Returns top-N recommended skills using:
      Engine A: Skill Graph readiness scoring (NetworkX)
      Engine B: Embedding cosine similarity (sentence-transformers)
      Final:    0.6 × A + 0.4 × B
    """
    try:
        recs = skill_service.get_recommendations(employee_id, top_n=top_n)
        return {"recommendations": recs, "count": len(recs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employee/{employee_id}/roadmap")
async def get_roadmap(employee_id: str):
    """
    Returns the full learning roadmap with 3 sections:
    - in_progress : skills currently being learned (resume point)
    - up_next     : recommended skills in prerequisite-correct order
    - completed   : skills already marked complete
    """
    try:
        roadmap = skill_service.generate_roadmap(employee_id)
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────
# Roadmap Progress (Start / Complete / Update)
# ──────────────────────────────────────────────────────────────────

@router.post("/employee/{employee_id}/roadmap/{skill_id}/start")
async def start_skill(employee_id: str, skill_id: str):
    """Mark a skill as in_progress. Sets started_at timestamp on first call."""
    try:
        row = skill_service.update_skill_status(employee_id, skill_id, "in_progress", 0)
        return {"message": "Skill started", "progress": row}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/{employee_id}/roadmap/{skill_id}/complete")
async def complete_skill(employee_id: str, skill_id: str):
    """
    Mark a skill as completed.
    Also returns fresh top-3 'what to learn next' suggestions.
    """
    try:
        skill_service.update_skill_status(employee_id, skill_id, "completed", 100)
        # Return next suggestions so frontend can display the panel
        next_suggestions = skill_service.get_recommendations(employee_id, top_n=3)
        return {
            "message": "Skill completed! 🎉",
            "next_suggestions": next_suggestions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/employee/{employee_id}/roadmap/{skill_id}/progress")
async def update_progress(employee_id: str, skill_id: str, request: ProgressUpdateRequest):
    """Update progress percentage (0-100) for an in-progress skill."""
    try:
        row = skill_service.update_progress_pct(employee_id, skill_id, request.progress_pct)
        return {"message": "Progress updated", "progress": row}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────
# Admin — One-time Embedding Computation
# ──────────────────────────────────────────────────────────────────

@router.post("/admin/compute-embeddings")
async def compute_embeddings():
    """
    One-time endpoint: computes sentence-transformer embeddings for all skills
    that have a NULL embedding column and stores them in Supabase.
    Safe to call multiple times (only updates null rows).
    """
    try:
        from core.config import supabase, model as embed_model

        # Fetch all skill IDs and names, compute + store embeddings for each
        resp = supabase.table("skills").select("id,name").execute()
        all_skills = resp.data or []

        if not all_skills:
            return {"message": "No skills found in catalogue. Run seeding first.", "updated": 0}

        updated = 0
        errors = []
        for skill in all_skills:
            try:
                embedding = embed_model.encode(skill["name"]).tolist()
                supabase.table("skills").update({"embedding": embedding}).eq("id", skill["id"]).execute()
                updated += 1
            except Exception as skill_err:
                errors.append(f"{skill['name']}: {skill_err}")

        # Clear in-memory caches so next request reloads fresh embeddings
        skill_service.invalidate_cache()

        result = {"message": f"Computed and stored embeddings for {updated} skills", "updated": updated}
        if errors:
            result["errors"] = errors
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

