from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.skill_routes import router as skill_router

app = FastAPI(title="AI HR Assistant")

# Add CORS middleware to allow Next.js frontend (port 3000) to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routers
app.include_router(router, prefix="/api")
app.include_router(skill_router, prefix="/api/skills")
