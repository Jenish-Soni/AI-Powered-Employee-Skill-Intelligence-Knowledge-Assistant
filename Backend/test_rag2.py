from core.config import supabase
from services.rag_service import process_query
import traceback

try:
    print(process_query("I want to apply for the leave"))
except Exception as e:
    traceback.print_exc()
