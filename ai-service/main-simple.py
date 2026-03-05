from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="AI Career Coach Service",
    description="AI-powered resume analysis and career recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "processor": "simple"}

@app.get("/")
async def root():
    return {"message": "AI Career Coach Service", "status": "running"}

@app.post("/api/analyze-resume")
async def analyze_resume():
    return {"message": "Resume analysis endpoint - simple version working"}

@app.get("/api/analysis/{resume_id}")
async def get_analysis(resume_id: str):
    return {"resume_id": resume_id, "status": "completed", "analysis": "Simple analysis"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main-simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
