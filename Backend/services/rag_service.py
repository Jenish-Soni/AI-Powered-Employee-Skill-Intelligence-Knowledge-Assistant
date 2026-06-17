from core.config import supabase, model, ai_client

def ingest_text(content: str, source: str) -> int:
    """
    Chunks text, creates embeddings, and saves to Supabase.
    """
    if not supabase:
        raise ValueError("Supabase client not initialized")
        
    chunks = [chunk.strip() for chunk in content.split("\n\n") if chunk.strip() and len(chunk.strip()) > 20]
    
    inserted_count = 0
    for chunk in chunks:
        embedding = model.encode(chunk).tolist()
        supabase.table("hr_policy_chunks").insert({
            "content": chunk,
            "metadata": {"source": source},
            "embedding": embedding
        }).execute()
        inserted_count += 1
        
    return inserted_count

def process_query(query_text: str) -> dict:
    """
    Embeds query, searches Supabase via RPC, and generates AI response.
    """
    if not supabase or not ai_client:
        raise ValueError("Clients not initialized. Check .env")
        
    query_embedding = model.encode(query_text).tolist()
    
    try:
        response = supabase.rpc(
            "match_policy_chunks", 
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.2,
                "match_count": 3
            }
        ).execute()
        results = response.data
    except Exception as e:
        raise RuntimeError(f"Database query failed: {str(e)}")
        
    if not results:
        return {"answer": "I couldn't find any relevant HR policies for your question.", "retrieved_context": []}
        
    context_text = "\n\n".join([item["content"] for item in results])
    
    prompt = f"""
    You are a helpful and intelligent HR Assistant for our company. 
    You have access to the following HR policy snippets retrieved from our database.
    
    Context Sources:
    """
    for idx, item in enumerate(results):
        prompt += f"Source [{idx+1}]: {item['content']}\n\n"
        
    prompt += f"""
    User Question: {query_text}
    
    Instructions:
    1. Answer the user's question using the provided Context Sources if they are relevant.
    2. If you use information from the Context Sources, cite them inline using exponents/brackets like [1] or [2].
    3. If the Context Sources do not contain the exact answer, or if the user asks for general help (like writing an email, defining terms, or general HR best practices), be extremely helpful and act like a highly capable AI assistant to fulfill their request. DO NOT say "I don't have enough information".
    """
    
    try:
        chat_response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        answer = chat_response.text
    except Exception as e:
        raise RuntimeError(f"LLM Generation failed: {str(e)}")
        
    return {
        "answer": answer,
        "retrieved_context": [item["content"] for item in results]
    }
