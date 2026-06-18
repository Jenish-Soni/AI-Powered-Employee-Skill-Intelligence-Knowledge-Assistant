"""
seed_skills.py — One-time script to populate the skills catalogue.
Run from Backend directory:
    source venv/bin/activate
    python seed_skills.py
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env from Backend/.env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from core.config import supabase, model

# ─────────────────────────────────────────────────────────────────
# SKILL CATALOGUE  (name, category, complexity 1-5)
# ─────────────────────────────────────────────────────────────────
SKILLS = [
    # Programming Languages
    ("Python",                          "Programming Languages", 2),
    ("JavaScript",                      "Programming Languages", 2),
    ("TypeScript",                      "Programming Languages", 2),
    ("Java",                            "Programming Languages", 3),
    ("Go",                              "Programming Languages", 3),
    ("Rust",                            "Programming Languages", 4),
    ("SQL",                             "Programming Languages", 2),
    ("Bash / Shell Scripting",          "Programming Languages", 2),
    ("R",                               "Programming Languages", 2),
    ("C++",                             "Programming Languages", 4),

    # Data Science & ML
    ("NumPy",                           "Data Science & ML", 2),
    ("Pandas",                          "Data Science & ML", 2),
    ("Matplotlib",                      "Data Science & ML", 1),
    ("scikit-learn",                    "Data Science & ML", 3),
    ("TensorFlow",                      "Data Science & ML", 4),
    ("PyTorch",                         "Data Science & ML", 4),
    ("Power BI",                        "Data Science & ML", 2),
    ("Tableau",                         "Data Science & ML", 2),
    ("Apache Spark",                    "Data Science & ML", 4),
    ("Apache Kafka",                    "Data Science & ML", 4),
    ("Apache Airflow",                  "Data Science & ML", 3),
    ("dbt (Data Build Tool)",           "Data Science & ML", 3),
    ("XGBoost",                         "Data Science & ML", 3),
    ("Feature Engineering",             "Data Science & ML", 3),

    # Web Backend
    ("FastAPI",                         "Web Backend", 2),
    ("Node.js / Express",               "Web Backend", 2),
    ("REST API Design",                 "Web Backend", 2),
    ("GraphQL",                         "Web Backend", 3),
    ("PostgreSQL",                      "Web Backend", 2),
    ("Redis",                           "Web Backend", 3),
    ("MongoDB",                         "Web Backend", 2),
    ("RabbitMQ / Message Queues",       "Web Backend", 3),

    # Web Frontend
    ("HTML & CSS",                      "Web Frontend", 1),
    ("React",                           "Web Frontend", 2),
    ("Next.js",                         "Web Frontend", 3),
    ("Tailwind CSS",                    "Web Frontend", 1),
    ("Vue.js",                          "Web Frontend", 2),
    ("Angular",                         "Web Frontend", 3),
    ("Figma / UI Design",               "Web Frontend", 2),

    # DevOps & Cloud
    ("Linux Fundamentals",              "DevOps & Cloud", 2),
    ("Git & Version Control",           "DevOps & Cloud", 1),
    ("Docker",                          "DevOps & Cloud", 2),
    ("Kubernetes",                      "DevOps & Cloud", 4),
    ("CI/CD Pipelines",                 "DevOps & Cloud", 3),
    ("AWS Fundamentals",                "DevOps & Cloud", 3),
    ("Terraform",                       "DevOps & Cloud", 3),
    ("Nginx",                           "DevOps & Cloud", 2),
    ("Prometheus & Grafana",            "DevOps & Cloud", 3),
    ("Helm",                            "DevOps & Cloud", 4),

    # System Design & Architecture
    ("Data Structures & Algorithms",    "System Design", 3),
    ("System Design",                   "System Design", 4),
    ("Microservices Architecture",      "System Design", 4),
    ("API Security & OAuth2",           "System Design", 3),

    # Soft Skills
    ("Communication",                   "Soft Skills", 1),
    ("Problem Solving",                 "Soft Skills", 2),
    ("Agile & Scrum",                   "Soft Skills", 1),
    ("Technical Writing",               "Soft Skills", 2),
    ("Code Review Best Practices",      "Soft Skills", 2),
    ("Leadership & Mentoring",          "Soft Skills", 3),
]

# ─────────────────────────────────────────────────────────────────
# SKILL GRAPH EDGES  (from_skill_name, to_skill_name)
# ─────────────────────────────────────────────────────────────────
RELATIONSHIPS = [
    # Python ecosystem
    ("Python",          "NumPy"),
    ("Python",          "Pandas"),
    ("Python",          "FastAPI"),
    ("Python",          "Matplotlib"),
    ("Python",          "Feature Engineering"),
    ("Python",          "Apache Airflow"),
    ("Python",          "dbt (Data Build Tool)"),
    ("Python",          "Apache Kafka"),
    ("NumPy",           "scikit-learn"),
    ("NumPy",           "TensorFlow"),
    ("NumPy",           "PyTorch"),
    ("Pandas",          "scikit-learn"),
    ("Pandas",          "Matplotlib"),
    ("Pandas",          "Feature Engineering"),
    ("Pandas",          "XGBoost"),
    ("scikit-learn",    "TensorFlow"),
    ("scikit-learn",    "PyTorch"),
    ("scikit-learn",    "XGBoost"),
    ("Feature Engineering", "TensorFlow"),
    ("Feature Engineering", "XGBoost"),
    ("TensorFlow",      "Apache Spark"),
    ("PyTorch",         "Apache Spark"),

    # JavaScript ecosystem
    ("JavaScript",      "TypeScript"),
    ("JavaScript",      "React"),
    ("JavaScript",      "Node.js / Express"),
    ("JavaScript",      "Vue.js"),
    ("TypeScript",      "Angular"),
    ("TypeScript",      "Next.js"),
    ("HTML & CSS",      "React"),
    ("HTML & CSS",      "Vue.js"),
    ("HTML & CSS",      "Angular"),
    ("React",           "Next.js"),
    ("Node.js / Express",   "REST API Design"),
    ("Node.js / Express",   "GraphQL"),
    ("Node.js / Express",   "RabbitMQ / Message Queues"),

    # SQL / Data
    ("SQL",             "PostgreSQL"),
    ("SQL",             "dbt (Data Build Tool)"),
    ("SQL",             "Power BI"),
    ("SQL",             "Tableau"),
    ("SQL",             "Apache Kafka"),
    ("PostgreSQL",      "Redis"),

    # DevOps chain
    ("Linux Fundamentals",   "Docker"),
    ("Linux Fundamentals",   "Bash / Shell Scripting"),
    ("Linux Fundamentals",   "Nginx"),
    ("Git & Version Control","CI/CD Pipelines"),
    ("Docker",          "Kubernetes"),
    ("Docker",          "CI/CD Pipelines"),
    ("Docker",          "Microservices Architecture"),
    ("Kubernetes",      "Helm"),
    ("Kubernetes",      "Prometheus & Grafana"),
    ("CI/CD Pipelines", "Terraform"),
    ("AWS Fundamentals","Terraform"),
    ("AWS Fundamentals","Kubernetes"),

    # Backend connections
    ("FastAPI",         "REST API Design"),
    ("REST API Design", "GraphQL"),
    ("REST API Design", "API Security & OAuth2"),
    ("REST API Design", "Microservices Architecture"),

    # System Design
    ("Problem Solving",              "Data Structures & Algorithms"),
    ("Problem Solving",              "System Design"),
    ("Data Structures & Algorithms", "System Design"),
    ("System Design",                "Microservices Architecture"),
    ("Go",                           "Microservices Architecture"),

    # Soft Skills
    ("Communication",               "Technical Writing"),
    ("Communication",               "Leadership & Mentoring"),
    ("Agile & Scrum",               "Leadership & Mentoring"),
    ("Code Review Best Practices",  "Leadership & Mentoring"),
]


def seed():
    if not supabase:
        print("ERROR: Supabase client not initialized. Check .env")
        sys.exit(1)

    # ── Step 0: Pre-load existing skills to avoid schema-cache thrashing ──
    print("\n🔍  Checking existing skills in database...")
    name_to_id: dict[str, str] = {}
    try:
        existing = supabase.table("skills").select("id,name").execute()
        for row in (existing.data or []):
            name_to_id[row["name"]] = row["id"]
        print(f"    Found {len(name_to_id)} existing skills.")
    except Exception as e:
        print(f"    Could not pre-load skills (table may not exist yet): {e}")
        print("    ⚠️  Make sure you have run skills_migration.sql in Supabase first!")
        sys.exit(1)

    # ── Step 1: Insert / upsert skills (only missing ones) ──────────────
    print(f"\n🌱  Seeding {len(SKILLS)} skills...")
    import time

    inserted_count = 0
    for name, category, complexity in SKILLS:
        if name in name_to_id:
            print(f"  ⏭   {name} (already exists)")
            continue

        # Compute 384-dim embedding for the skill name
        embedding = model.encode(name).tolist()

        try:
            resp = supabase.table("skills").insert(
                {
                    "name": name,
                    "category": category,
                    "complexity": complexity,
                    "embedding": embedding,
                }
            ).execute()
            skill_id = resp.data[0]["id"]
            name_to_id[name] = skill_id
            inserted_count += 1
            print(f"  ✅  {name} ({category}, complexity={complexity})")
        except Exception as e:
            print(f"  ❌  {name} failed: {e}")

        # Small delay to avoid PostgREST schema-cache rate limiting
        time.sleep(0.15)

    print(f"\n    Inserted {inserted_count} new skills. Total in DB: {len(name_to_id)}")

    # ── Step 2: Insert relationships ─────────────────────────────────────
    print(f"\n🔗  Inserting {len(RELATIONSHIPS)} skill relationships...")

    inserted = 0
    for from_name, to_name in RELATIONSHIPS:
        from_id = name_to_id.get(from_name)
        to_id   = name_to_id.get(to_name)
        if not from_id or not to_id:
            print(f"  ⚠️   Skipping ({from_name} → {to_name}): skill not in DB")
            continue
        try:
            supabase.table("skill_relationships").upsert(
                {
                    "from_skill_id": from_id,
                    "to_skill_id":   to_id,
                    "relationship_type": "prerequisite",
                    "weight": 1.0,
                },
                on_conflict="from_skill_id,to_skill_id",
            ).execute()
            inserted += 1
            print(f"  🔗  {from_name} → {to_name}")
        except Exception as e:
            print(f"  ❌  ({from_name} → {to_name}) failed: {e}")

    print(f"\n✨  Done! {len(name_to_id)} skills total, {inserted} relationships seeded.\n")


if __name__ == "__main__":
    seed()
