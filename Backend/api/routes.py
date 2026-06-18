import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from pypdf import PdfReader
from models.schemas import QueryRequest
from services import rag_service

router = APIRouter()

@router.post("/ingest")
async def ingest_policies():
    """
    Reads hr_policies_sample.txt from disk and ingests it.
    """
    file_path = "hr_policies_sample.txt"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample policy file not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    try:
        count = rag_service.ingest_text(content, "hr_policies_sample.txt")
        return {"message": "Ingestion complete", "chunks_processed": count}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accepts a PDF file, extracts text, generates embeddings, and inserts into Supabase.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    content = ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        content_bytes = await file.read()
        temp_file.write(content_bytes)
        temp_path = temp_file.name
        
    try:
        reader = PdfReader(temp_path)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                content += text + "\n\n"
    except Exception as e:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
        
    os.remove(temp_path)
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
    try:
        count = rag_service.ingest_text(content, file.filename)
        return {"message": f"Successfully processed {file.filename}", "chunks_processed": count}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
async def ask_hr(request: QueryRequest):
    """
    Takes a user query, retrieves context from Supabase, and uses Gemini to answer.
    """
    try:
        result = rag_service.process_query(request.query)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/hr/employee/{user_id}")
async def delete_employee(user_id: str):
    """
    HR endpoint to delete an employee from Supabase Auth and the database.
    """
    from core.config import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        # Delete from auth.users (requires service role key, which is used in backend)
        supabase.auth.admin.delete_user(user_id)
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

from models.schemas import RoleUpdate

@router.put("/admin/role/{user_id}")
async def update_role(user_id: str, request: RoleUpdate):
    """
    Admin endpoint to change a user's role.
    """
    from core.config import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
        
    if request.role not in ['admin', 'hr', 'employee']:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    try:
        response = supabase.table("employees").update({"role": request.role}).eq("id", user_id).execute()
        return {"message": "Role updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")
