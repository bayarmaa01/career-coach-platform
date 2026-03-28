# Lightweight AI Service - FastAPI with minimal dependencies
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import os
import httpx
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Career Coach AI Service", version="1.0.0")

# Redis connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis-service"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

# Simple data models
class ResumeRequest(BaseModel):
    text: str
    skills: list[str] = []

class CareerAdvice(BaseModel):
    recommendation: str
    confidence: float
    skills_matched: list[str]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

# Simple skill matching using TF-IDF
def analyze_resume_skills(text: str, skills: list[str]) -> dict:
    """Simple skill analysis without heavy ML models"""
    if not text.strip():
        return {"skills_found": [], "recommendations": []}
    
    # Extract common tech skills from text
    common_skills = [
        "python", "javascript", "react", "node.js", "docker", "kubernetes",
        "aws", "azure", "sql", "mongodb", "git", "ci/cd", "linux",
        "java", "c++", "html", "css", "typescript", "angular",
        "machine learning", "data analysis", "api", "rest", "graphql"
    ]
    
    text_lower = text.lower()
    found_skills = [skill for skill in common_skills if skill in text_lower]
    
    # Simple career recommendations based on skills
    recommendations = []
    if "python" in found_skills or "java" in found_skills:
        recommendations.append("Consider backend development roles")
    if "react" in found_skills or "angular" in found_skills:
        recommendations.append("Frontend development positions suit you")
    if "docker" in found_skills or "kubernetes" in found_skills:
        recommendations.append("DevOps engineer roles would be a good fit")
    if "aws" in found_skills or "azure" in found_skills:
        recommendations.append("Cloud architecture positions are available")
    
    return {
        "skills_found": found_skills,
        "recommendations": recommendations
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Test Redis connection
        redis_client.ping()
        return HealthResponse(
            status="healthy",
            service="ai-service",
            version="1.0.0"
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/analyze-resume", response_model=CareerAdvice)
async def analyze_resume(request: ResumeRequest):
    """Analyze resume and provide career advice"""
    try:
        # Analyze skills
        analysis = analyze_resume_skills(request.text, request.skills)
        
        # Generate recommendation
        if analysis["recommendations"]:
            recommendation = " | ".join(analysis["recommendations"])
            confidence = 0.8
        else:
            recommendation = "Consider adding more technical skills to your resume"
            confidence = 0.5
        
        # Cache result in Redis
        cache_key = f"resume_analysis:{hash(request.text)}"
        redis_client.setex(cache_key, 3600, json.dumps({
            "recommendation": recommendation,
            "confidence": confidence,
            "skills_matched": analysis["skills_found"]
        }))
        
        return CareerAdvice(
            recommendation=recommendation,
            confidence=confidence,
            skills_matched=analysis["skills_found"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/recommendations/{skill}")
async def get_career_recommendations(skill: str):
    """Get career recommendations for a specific skill"""
    try:
        # Simple skill-to-career mapping
        skill_careers = {
            "python": ["Data Scientist", "Backend Developer", "ML Engineer"],
            "javascript": ["Frontend Developer", "Full Stack Developer"],
            "docker": ["DevOps Engineer", "Cloud Engineer"],
            "aws": ["Cloud Architect", "Solutions Architect"],
            "react": ["Frontend Developer", "UI/UX Developer"],
            "sql": ["Database Administrator", "Data Analyst"]
        }
        
        careers = skill_careers.get(skill.lower(), ["Software Developer"])
        
        return {"skill": skill, "recommended_careers": careers}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Career Coach AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze_resume": "/analyze-resume (POST)",
            "recommendations": "/recommendations/{skill}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5100)
