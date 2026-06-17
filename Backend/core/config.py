import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
from google import genai

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

settings = Settings()

if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
    print("Warning: Supabase credentials not found in environment.")

if not settings.GEMINI_API_KEY:
    print("Warning: Gemini API Key not found in environment.")

# Initialize Clients
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY) if settings.SUPABASE_URL else None
model = SentenceTransformer('all-MiniLM-L6-v2')
ai_client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
