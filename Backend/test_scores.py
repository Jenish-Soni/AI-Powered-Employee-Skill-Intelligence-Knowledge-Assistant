import sys
from services.skill_service import _load_all_skills, _load_embeddings, build_skill_graph, _hybrid_score, _build_reason
import numpy as np

all_skills = _load_all_skills()
embeddings = _load_embeddings()
G = build_skill_graph()
skills_map = {s["id"]: s for s in all_skills}

python_skill = next(s for s in all_skills if s["name"] == "Python")
known_ids = {python_skill["id"]}

scored = []
for s in all_skills:
    if s["id"] in known_ids: continue
    score = _hybrid_score(s["id"], known_ids, G, embeddings)
    reason = _build_reason(s["id"], known_ids, G, skills_map)
    scored.append({"name": s["name"], "score": score, "reason": reason})

scored.sort(key=lambda x: x["score"], reverse=True)
for s in scored[:10]:
    print(f"{s['name']:30} | {s['score']:.3f} | {s['reason']}")
