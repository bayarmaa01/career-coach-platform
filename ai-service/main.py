from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os
import time
import json
import re
from contextlib import asynccontextmanager
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST, CollectorRegistry, REGISTRY
import google.generativeai as genai

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

# Create custom registry
registry = CollectorRegistry()

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'], registry=registry)
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', registry=registry)
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active connections', registry=registry)

# Request model for recommendations
class RecommendationsRequest(BaseModel):
    skills: list[str]
    interests: list[str]

# Response model for recommendations
class RecommendationItem(BaseModel):
    title: str
    description: str
    matchScore: float

class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationItem]

# Initialize Gemini AI
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_AVAILABLE = True
        print("Gemini AI initialized successfully")
    else:
        GEMINI_AVAILABLE = False
        print("GEMINI_API_KEY not found, using fallback recommendations")
except Exception as e:
    GEMINI_AVAILABLE = False
    print(f"Failed to initialize Gemini AI: {e}")

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

# Metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    ACTIVE_CONNECTIONS.inc()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    REQUEST_DURATION.observe(duration)
    ACTIVE_CONNECTIONS.dec()
    
    return response

@app.get("/health")
async def health_check():
    return {"status": "healthy", "processor": "simple" if USE_SIMPLE_PROCESSOR else "spacy"}

@app.get("/")
async def root():
    return {"message": "AI Career Coach Service", "status": "running"}

@app.post("/recommendations-lite", response_model=RecommendationsResponse)
async def get_recommendations_lite(request: RecommendationsRequest):
    """Get career recommendations using Gemini AI"""
    try:
        skills = request.skills
        interests = request.interests
        
        # If Gemini is available, use it for recommendations
        if GEMINI_AVAILABLE:
            return await get_gemini_recommendations(skills, interests)
        else:
            # Fallback to mock recommendations
            return get_fallback_recommendations(skills, interests)
            
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        # Always return fallback recommendations on error
        return get_fallback_recommendations(request.skills, request.interests)

async def get_gemini_recommendations(skills: list[str], interests: list[str]) -> RecommendationsResponse:
    """Get recommendations from Gemini AI"""
    try:
        prompt = f"""Based on the following skills and interests, suggest 3-5 career paths.
Return JSON in this exact format:
{{
  "recommendations": [
    {{
      "title": string,
      "description": string,
      "matchScore": number (0-1)
    }}
  ]
}}

Skills: {skills}
Interests: {interests}
"""
        
        response = await model.generate_content_async(prompt)
        response_text = response.text
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            json_str = json_match.group()
            data = json.loads(json_str)
            
            # Validate and format response
            recommendations = []
            for rec in data.get("recommendations", []):
                recommendations.append({
                    "title": rec.get("title", "Unknown Career"),
                    "description": rec.get("description", "No description available"),
                    "matchScore": float(rec.get("matchScore", 0.5))
                })
            
            return RecommendationsResponse(recommendations=recommendations[:5])
        else:
            print("No JSON found in Gemini response")
            return get_fallback_recommendations(skills, interests)
            
    except Exception as e:
        print(f"Gemini API error: {e}")
        return get_fallback_recommendations(skills, interests)

def get_fallback_recommendations(skills: list[str], interests: list[str]) -> RecommendationsResponse:
    """Fallback recommendations when Gemini is unavailable"""
    recommendations = []
    
    # Default recommendations
    recommendations.append({
        "title": "Full Stack Developer",
        "description": "Develop both frontend and backend applications using modern web technologies",
        "matchScore": 0.85
    })
    
    recommendations.append({
        "title": "DevOps Engineer",
        "description": "Automate and streamline software development and deployment processes",
        "matchScore": 0.75
    })
    
    recommendations.append({
        "title": "Technical Lead",
        "description": "Lead development teams and make technical decisions for projects",
        "matchScore": 0.70
    })
    
    # Skill-based recommendations
    if "JavaScript" in skills:
        recommendations.insert(0, {
            "title": "Frontend Developer",
            "description": "Build user interfaces and web applications using JavaScript frameworks",
            "matchScore": 0.90
        })
        
    if "Python" in skills:
        recommendations.insert(0, {
            "title": "Backend Developer",
            "description": "Develop server-side applications and APIs using Python",
            "matchScore": 0.88
        })
        
    if "React" in skills or "Angular" in skills or "Vue" in skills:
        recommendations.append({
            "title": "UI/UX Developer",
            "description": "Create user interfaces and improve user experience",
            "matchScore": 0.82
        })
        
    if "Docker" in skills or "Kubernetes" in skills:
        recommendations.append({
            "title": "Cloud Engineer",
            "description": "Design and manage cloud infrastructure and deployments",
            "matchScore": 0.80
        })
    
    # Interest-based recommendations
    if any("data" in interest.lower() for interest in interests):
        recommendations.append({
            "title": "Data Scientist",
            "description": "Analyze data and build machine learning models",
            "matchScore": 0.78
        })
        
    if any("mobile" in interest.lower() for interest in interests):
        recommendations.append({
            "title": "Mobile Developer",
            "description": "Build mobile applications for iOS and Android",
            "matchScore": 0.76
        })
    
    # Sort by match score and return top recommendations
    recommendations.sort(key=lambda x: x["matchScore"], reverse=True)
    
    return RecommendationsResponse(recommendations=recommendations[:5])

@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    try:
        # Generate metrics from our custom registry
        metrics_data = generate_latest(registry)
        return PlainTextResponse(
            metrics_data,
            media_type="text/plain; version=0.0.4; charset=utf-8"
        )
    except Exception as e:
        print(f"Metrics error: {e}")
        return PlainTextResponse(
            "# Error generating metrics\n# HELP prometheus_metrics_failed_total Total number of failed metrics generation\n# TYPE prometheus_metrics_failed_total counter\nprometheus_metrics_failed_total 1\n",
            media_type="text/plain",
            status_code=500
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5100,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )
