import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Environment Variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Warning: Supabase credentials not found in environment.")

if not GEMINI_API_KEY:
    print("Warning: Gemini API Key not found in environment.")

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL else None

# Initialize Sentence Transformer
# all-MiniLM-L6-v2 creates exactly 384-dimensional embeddings, mapping well to our Supabase schema
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Google GenAI client
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

app = FastAPI(title="AI HR Assistant")

class QueryRequest(BaseModel):
    query: str

@app.post("/api/ingest")
async def ingest_policies():
    """
    Reads hr_policies_sample.txt, chunks by paragraph, creates 384D embeddings,
    and inserts them into Supabase.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    file_path = "hr_policies_sample.txt"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample policy file not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Split by double newline to get paragraphs/sections
    chunks = [chunk.strip() for chunk in content.split("\n\n") if chunk.strip()]
    
    inserted_count = 0
    for chunk in chunks:
        # Generate the 384D vector
        embedding = model.encode(chunk).tolist()
        
        # Insert into Supabase
        data, count = supabase.table("hr_policy_chunks").insert({
            "content": chunk,
            "metadata": {"source": "hr_policies_sample.txt"},
            "embedding": embedding
        }).execute()
        
        inserted_count += 1
        
    return {"message": "Ingestion complete", "chunks_processed": inserted_count}

@app.post("/api/ask")
async def ask_hr(request: QueryRequest):
    """
    Takes a user query, embeds it, retrieves top 2 context chunks from Supabase,
    and uses Gemini to answer the question using only the context.
    """
    if not supabase or not ai_client:
        raise HTTPException(status_code=500, detail="Clients not initialized. Check .env")
        
    query_text = request.query
    
    # 1. Embed the query using the same local model
    query_embedding = model.encode(query_text).tolist()
    
    # 2. Vector Math Search: call the Supabase RPC function
    try:
        response = supabase.rpc(
            "match_policy_chunks", 
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5,
                "match_count": 2
            }
        ).execute()
        
        results = response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
        
    if not results:
        return {"answer": "I couldn't find any relevant HR policies for your question.", "context": []}
        
    # 3. Prepare Context for LLM
    context_text = "\n\n".join([item["content"] for item in results])
    
    # 4. LLM Generation
    prompt = f"""
    You are a helpful HR Assistant for our company. 
    Please answer the user's question based strictly on the provided Context below.
    If the context does not contain the answer, say "I don't have enough information in the HR policy to answer this."
    
    Context:
    {context_text}
    
    User Question:
    {query_text}
    """
    
    try:
        chat_response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        answer = chat_response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")
        
    return {
        "answer": answer,
        "retrieved_context": [item["content"] for item in results]
    }
