import sys
from services.skill_service import save_employee_skills
try:
    save_employee_skills("8573", [{"skill_id": "ab6fa14d-6b08-4122-bd55-abf459c7a52e", "proficiency": 3}])
    print("Success")
except Exception as e:
    print("Error:", e)
