from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str

class RoleUpdate(BaseModel):
    role: str
