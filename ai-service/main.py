from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager

from app.routers import resume, career
from app.core.config import settings

# Handle spaCy import gracefully
try:
    from app.services.resume_processor import ResumeProcessor
    USE_SIMPLE_PROCESSOR = False
except ImportError:
    from app.services.simple_resume_processor import SimpleResumeProcessor
    USE_SIMPLE_PROCESSOR = True
    print("Using simple resume processor (spaCy not available)")

app = FastAPI(
    title="AI Career Coach Service",
    description="AI-powered resume analysis and career recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resume.router, prefix="/api")
app.include_router(career.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "processor": "simple" if USE_SIMPLE_PROCESSOR else "spacy"}

@app.get("/")
async def root():
    return {"message": "AI Career Coach Service", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )
