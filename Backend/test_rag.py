from core.config import supabase
from services.rag_service import process_query
import traceback

try:
    print(process_query("Can I work from home on Friday?"))
except Exception as e:
    traceback.print_exc()
