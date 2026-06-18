"""
skill_service.py — Core ML engine for skill recommendations and roadmap generation.

Two pure ML engines (no LLM API):
  Engine A: Skill Knowledge Graph — graph readiness scoring via NetworkX
  Engine B: Embedding Similarity  — cosine similarity via sentence-transformers

Hybrid score = 0.6 × graph_readiness + 0.4 × embedding_similarity
"""

from __future__ import annotations

import numpy as np
import networkx as nx
from typing import Optional
from core.config import supabase, model as embed_model

# ─────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────
WEEKS_BY_COMPLEXITY = {1: 1, 2: 2, 3: 4, 4: 8, 5: 12}
GRAPH_WEIGHT = 0.6
EMBED_WEIGHT = 0.4

CATEGORY_ICONS = {
    "Programming Languages": "code",
    "Data Science & ML":     "hub",
    "Web Backend":           "dns",
    "Web Frontend":          "web",
    "DevOps & Cloud":        "cloud",
    "System Design":         "architecture",
    "Soft Skills":           "psychology",
}

# ─────────────────────────────────────────────────────────────────
# In-memory caches (populated on first call, reused after)
# ─────────────────────────────────────────────────────────────────
_skill_graph: Optional[nx.DiGraph] = None
_all_skills_cache: Optional[list[dict]] = None
_embeddings_cache: Optional[dict[str, list[float]]] = None


def _load_all_skills() -> list[dict]:
    global _all_skills_cache
    if _all_skills_cache is None:
        resp = supabase.table("skills").select("id,name,category,complexity,embedding").execute()
        _all_skills_cache = resp.data or []
    return _all_skills_cache


def _load_embeddings() -> dict[str, list[float]]:
    global _embeddings_cache
    if _embeddings_cache is None:
        skills = _load_all_skills()
        _embeddings_cache = {
            s["id"]: s["embedding"]
            for s in skills
            if s.get("embedding")
        }
    return _embeddings_cache


def build_skill_graph() -> nx.DiGraph:
    """Build and cache a directed NetworkX graph from skill_relationships table."""
    global _skill_graph
    if _skill_graph is not None:
        return _skill_graph

    resp = supabase.table("skill_relationships").select(
        "from_skill_id,to_skill_id,weight"
    ).execute()
    rows = resp.data or []

    G = nx.DiGraph()
    # Add all skill nodes
    for s in _load_all_skills():
        G.add_node(s["id"], name=s["name"], category=s["category"], complexity=s["complexity"])
    # Add edges
    for row in rows:
        G.add_edge(row["from_skill_id"], row["to_skill_id"], weight=row.get("weight", 1.0))

    _skill_graph = G
    return G


def invalidate_cache():
    """Call this if skills/relationships are modified at runtime."""
    global _skill_graph, _all_skills_cache, _embeddings_cache
    _skill_graph = None
    _all_skills_cache = None
    _embeddings_cache = None


# ─────────────────────────────────────────────────────────────────
# Engine A — Graph Readiness Score
# ─────────────────────────────────────────────────────────────────
def _graph_readiness_score(
    candidate_id: str,
    known_ids: set[str],
    G: nx.DiGraph,
) -> float:
    """
    Returns 0.0–1.0.
    • prereqs fully met   → high score
    • no prereqs at all   → 0.5 (neutral)
    • direct 'leads-to'   → +0.2 bonus
    """
    predecessors = list(G.predecessors(candidate_id))

    if not predecessors:
        base = 0.5
    else:
        met = sum(1 for p in predecessors if p in known_ids)
        base = met / len(predecessors)

    # Bonus: any known skill has a direct edge to this candidate
    has_direct = any(G.has_edge(k, candidate_id) for k in known_ids)
    bonus = 0.2 if has_direct else 0.0

    return min(1.0, base + bonus)


# ─────────────────────────────────────────────────────────────────
# Engine B — Embedding Similarity Score
# ─────────────────────────────────────────────────────────────────
def _embedding_similarity_score(
    candidate_id: str,
    known_ids: set[str],
    embeddings: dict[str, list[float]],
) -> float:
    """
    Returns 0.0–1.0 (cosine similarity normalised from [-1,1]).
    Employee vector = mean of their known skill embeddings.
    Falls back to 0.5 if embeddings unavailable.
    """
    if not known_ids:
        return 0.5

    emp_vecs = [embeddings[sid] for sid in known_ids if sid in embeddings]
    if not emp_vecs or candidate_id not in embeddings:
        return 0.5

    emp_arr = np.array(emp_vecs, dtype=np.float32)
    emp_mean = emp_arr.mean(axis=0)
    cand_vec = np.array(embeddings[candidate_id], dtype=np.float32)

    norm_emp  = np.linalg.norm(emp_mean)
    norm_cand = np.linalg.norm(cand_vec)
    if norm_emp == 0 or norm_cand == 0:
        return 0.5

    cosine = float(np.dot(emp_mean, cand_vec) / (norm_emp * norm_cand))
    # Normalise from [-1, 1] → [0, 1]
    return (cosine + 1.0) / 2.0


# ─────────────────────────────────────────────────────────────────
# Hybrid Score
# ─────────────────────────────────────────────────────────────────
def _hybrid_score(
    candidate_id: str,
    known_ids: set[str],
    G: nx.DiGraph,
    embeddings: dict[str, list[float]],
) -> float:
    a = _graph_readiness_score(candidate_id, known_ids, G)
    b = _embedding_similarity_score(candidate_id, known_ids, embeddings)
    return GRAPH_WEIGHT * a + EMBED_WEIGHT * b


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def _get_phase(complexity: int) -> int:
    if complexity <= 2:
        return 1
    elif complexity == 3:
        return 2
    else:
        return 3


def _build_reason(
    candidate_id: str,
    known_ids: set[str],
    G: nx.DiGraph,
    skills_map: dict[str, dict],
) -> str:
    prereqs = list(G.predecessors(candidate_id))
    met_prereqs = [skills_map[p]["name"] for p in prereqs if p in known_ids and p in skills_map]
    if met_prereqs:
        names = ", ".join(met_prereqs[:2])
        return f"Natural next step — you already know {names}"
    successors_of_known = [
        skills_map[k]["name"]
        for k in known_ids
        if G.has_edge(k, candidate_id) and k in skills_map
    ]
    if successors_of_known:
        return f"Follows naturally from {successors_of_known[0]}"
    return "Semantically close to your current skill profile"


# ─────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────

def get_employee_skill_ids(employee_id: str) -> set[str]:
    resp = supabase.table("employee_skills").select("skill_id").eq("employee_id", employee_id).execute()
    return {r["skill_id"] for r in (resp.data or [])}


def get_roadmap_progress(employee_id: str) -> dict[str, dict]:
    """Returns {skill_id: progress_row} for this employee."""
    resp = supabase.table("roadmap_progress").select("*").eq("employee_id", employee_id).execute()
    return {r["skill_id"]: r for r in (resp.data or [])}


def get_recommendations(employee_id: str, top_n: int = 5) -> list[dict]:
    """
    Returns top_n skill recommendations with scores and reasons.
    All unlearned skills are candidates (no proficiency filter).
    """
    all_skills  = _load_all_skills()
    embeddings  = _load_embeddings()
    G           = build_skill_graph()
    skills_map  = {s["id"]: s for s in all_skills}

    known_ids   = get_employee_skill_ids(employee_id)
    progress    = get_roadmap_progress(employee_id)
    completed   = {sid for sid, p in progress.items() if p["status"] == "completed"}
    in_progress = {sid for sid, p in progress.items() if p["status"] == "in_progress"}

    # Effective known = saved skills + completed roadmap items
    effective_known = known_ids | completed

    scored = []
    for skill in all_skills:
        sid = skill["id"]
        if sid in effective_known or sid in in_progress:
            continue
        score  = _hybrid_score(sid, effective_known, G, embeddings)
        reason = _build_reason(sid, effective_known, G, skills_map)
        scored.append({
            "skill_id":       sid,
            "name":           skill["name"],
            "category":       skill["category"],
            "complexity":     skill["complexity"],
            "complexity_label": ["", "Beginner", "Beginner", "Intermediate", "Advanced", "Expert"][skill["complexity"]],
            "icon":           CATEGORY_ICONS.get(skill["category"], "school"),
            "score":          round(score, 3),
            "reason":         reason,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]


def generate_roadmap(employee_id: str, top_n: int = 8) -> dict:
    """
    Returns the full roadmap JSON:
    {
      "in_progress": [...],   # resume section — skills currently being learned
      "up_next":    [...],    # recommended skills in prerequisite order
      "completed":  [...],    # skills already marked complete
    }
    """
    all_skills  = _load_all_skills()
    embeddings  = _load_embeddings()
    G           = build_skill_graph()
    skills_map  = {s["id"]: s for s in all_skills}

    known_ids   = get_employee_skill_ids(employee_id)
    progress    = get_roadmap_progress(employee_id)
    completed   = {sid for sid, p in progress.items() if p["status"] == "completed"}
    in_progress = {sid for sid, p in progress.items() if p["status"] == "in_progress"}

    effective_known = known_ids | completed

    # ── Score remaining candidates ──────────────────────────────
    candidates = [
        s for s in all_skills
        if s["id"] not in effective_known and s["id"] not in in_progress
    ]
    scored = sorted(
        candidates,
        key=lambda s: _hybrid_score(s["id"], effective_known, G, embeddings),
        reverse=True,
    )
    top_skills = scored[:top_n]

    # ── Pull in missing prerequisites ───────────────────────────
    roadmap_ids: set[str] = {s["id"] for s in top_skills}
    for skill in top_skills:
        for prereq_id in G.predecessors(skill["id"]):
            if prereq_id not in effective_known and prereq_id not in in_progress:
                roadmap_ids.add(prereq_id)

    # ── Topological sort on subgraph ────────────────────────────
    sub_G = G.subgraph(roadmap_ids)
    try:
        ordered_ids = list(nx.topological_sort(sub_G))
    except nx.NetworkXUnfeasible:
        ordered_ids = list(roadmap_ids)

    # ── Build "up_next" section ─────────────────────────────────
    up_next = []
    for order_idx, sid in enumerate(ordered_ids):
        skill = skills_map.get(sid)
        if not skill:
            continue
        prog   = progress.get(sid, {})
        reason = _build_reason(sid, effective_known, G, skills_map)
        up_next.append({
            "order":            order_idx,
            "skill_id":         sid,
            "name":             skill["name"],
            "category":         skill["category"],
            "complexity":       skill["complexity"],
            "complexity_label": ["", "Beginner", "Beginner", "Intermediate", "Advanced", "Expert"][skill["complexity"]],
            "icon":             CATEGORY_ICONS.get(skill["category"], "school"),
            "estimated_weeks":  WEEKS_BY_COMPLEXITY.get(skill["complexity"], 4),
            "phase":            _get_phase(skill["complexity"]),
            "status":           prog.get("status", "not_started"),
            "progress_pct":     prog.get("progress_pct", 0),
            "reason":           reason,
        })

    # ── Build "in_progress" section (resume point) ─────────────
    in_progress_list = []
    for sid in in_progress:
        skill = skills_map.get(sid)
        if not skill:
            continue
        prog = progress.get(sid, {})
        in_progress_list.append({
            "skill_id":         sid,
            "name":             skill["name"],
            "category":         skill["category"],
            "complexity":       skill["complexity"],
            "complexity_label": ["", "Beginner", "Beginner", "Intermediate", "Advanced", "Expert"][skill["complexity"]],
            "icon":             CATEGORY_ICONS.get(skill["category"], "school"),
            "estimated_weeks":  WEEKS_BY_COMPLEXITY.get(skill["complexity"], 4),
            "phase":            _get_phase(skill["complexity"]),
            "status":           "in_progress",
            "progress_pct":     prog.get("progress_pct", 0),
            "started_at":       prog.get("started_at"),
            "last_active_at":   prog.get("last_active_at"),
            "reason":           "You started this — keep going!",
        })

    # ── Build "completed" section ───────────────────────────────
    completed_list = []
    for sid in completed:
        skill = skills_map.get(sid)
        if not skill:
            continue
        prog = progress.get(sid, {})
        completed_list.append({
            "skill_id":     sid,
            "name":         skill["name"],
            "category":     skill["category"],
            "complexity":   skill["complexity"],
            "icon":         CATEGORY_ICONS.get(skill["category"], "school"),
            "completed_at": prog.get("completed_at"),
        })

    return {
        "in_progress": in_progress_list,
        "up_next":     up_next,
        "completed":   completed_list,
    }


def update_skill_status(
    employee_id: str,
    skill_id: str,
    status: str,
    progress_pct: int = 0,
) -> dict:
    """Upsert progress row. Handles started_at / completed_at timestamps."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()
    row: dict = {
        "employee_id":   employee_id,
        "skill_id":      skill_id,
        "status":        status,
        "last_active_at": now,
    }

    if status == "in_progress":
        # Only set started_at once — check if row already exists
        existing = supabase.table("roadmap_progress").select("started_at").eq(
            "employee_id", employee_id
        ).eq("skill_id", skill_id).execute()
        if not existing.data or not existing.data[0].get("started_at"):
            row["started_at"] = now
        row["progress_pct"] = progress_pct

    elif status == "completed":
        row["progress_pct"] = 100
        row["completed_at"] = now

    elif status == "not_started":
        row["progress_pct"] = 0

    resp = supabase.table("roadmap_progress").upsert(
        row, on_conflict="employee_id,skill_id"
    ).execute()
    return resp.data[0] if resp.data else {}


def update_progress_pct(employee_id: str, skill_id: str, pct: int) -> dict:
    """Partial update — only changes progress_pct and last_active_at."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    resp = supabase.table("roadmap_progress").upsert(
        {
            "employee_id":    employee_id,
            "skill_id":       skill_id,
            "status":         "in_progress",
            "progress_pct":   max(0, min(100, pct)),
            "last_active_at": now,
        },
        on_conflict="employee_id,skill_id",
    ).execute()
    return resp.data[0] if resp.data else {}


def save_employee_skills(employee_id: str, skills: list[dict]) -> int:
    """
    Replaces employee skill proficiencies entirely.
    skills = [{"skill_id": "...", "proficiency": 3}, ...]
    Returns count of inserted rows.
    """
    # 1. Delete all existing skills for this employee
    supabase.table("employee_skills").delete().eq("employee_id", employee_id).execute()

    # 2. Insert the new ones
    rows = [
        {"employee_id": employee_id, "skill_id": s["skill_id"], "proficiency": s["proficiency"]}
        for s in skills
    ]
    if not rows:
        return 0
    supabase.table("employee_skills").insert(rows).execute()
    return len(rows)


def delete_employee_skill(employee_id: str, skill_id: str) -> bool:
    supabase.table("employee_skills").delete().eq("employee_id", employee_id).eq("skill_id", skill_id).execute()
    return True


def get_skill_catalogue() -> list[dict]:
    """Returns all skills grouped by category for the frontend picker."""
    all_skills = _load_all_skills()
    grouped: dict[str, list] = {}
    for s in all_skills:
        cat = s["category"]
        grouped.setdefault(cat, [])
        grouped[cat].append({
            "id":         s["id"],
            "name":       s["name"],
            "complexity": s["complexity"],
            "icon":       CATEGORY_ICONS.get(cat, "school"),
        })
    return [{"category": cat, "skills": skills} for cat, skills in grouped.items()]


def get_employee_skills_detail(employee_id: str) -> list[dict]:
    """Returns employee's saved skills with names and proficiency."""
    resp = supabase.table("employee_skills").select(
        "skill_id, proficiency, acquired_at, skills(id, name, category, complexity)"
    ).eq("employee_id", employee_id).execute()
    result = []
    for row in (resp.data or []):
        skill = row.get("skills") or {}
        result.append({
            "skill_id":   row["skill_id"],
            "name":       skill.get("name", ""),
            "category":   skill.get("category", ""),
            "complexity": skill.get("complexity", 1),
            "proficiency": row["proficiency"],
            "icon":       CATEGORY_ICONS.get(skill.get("category", ""), "school"),
        })
    return result
