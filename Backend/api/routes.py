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
