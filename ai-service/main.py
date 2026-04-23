from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import os
import time
from contextlib import asynccontextmanager
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST, CollectorRegistry, REGISTRY

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

@app.post("/recommendations-lite")
async def get_recommendations_lite(request: dict):
    """Get career recommendations without CV - mock implementation"""
    try:
        skills = request.get("skills", [])
        interests = request.get("interests", [])
        
        # Mock logic based on skills
        recommendations = []
        
        # Default recommendations
        recommendations.append({
            "title": "Full Stack Developer",
            "description": "Develop both frontend and backend applications using modern web technologies",
            "matchScore": 85
        })
        
        recommendations.append({
            "title": "DevOps Engineer",
            "description": "Automate and streamline software development and deployment processes",
            "matchScore": 75
        })
        
        recommendations.append({
            "title": "Technical Lead",
            "description": "Lead development teams and make technical decisions for projects",
            "matchScore": 70
        })
        
        # Skill-based recommendations
        if "JavaScript" in skills:
            recommendations.insert(0, {
                "title": "Frontend Developer",
                "description": "Build user interfaces and web applications using JavaScript frameworks",
                "matchScore": 90
            })
            
        if "Python" in skills:
            recommendations.insert(0, {
                "title": "Backend Developer",
                "description": "Develop server-side applications and APIs using Python",
                "matchScore": 88
            })
            
        if "React" in skills or "Angular" in skills or "Vue" in skills:
            recommendations.append({
                "title": "UI/UX Developer",
                "description": "Create user interfaces and improve user experience",
                "matchScore": 82
            })
            
        if "Docker" in skills or "Kubernetes" in skills:
            recommendations.append({
                "title": "Cloud Engineer",
                "description": "Design and manage cloud infrastructure and deployments",
                "matchScore": 80
            })
        
        # Interest-based recommendations
        if any("data" in interest.lower() for interest in interests):
            recommendations.append({
                "title": "Data Scientist",
                "description": "Analyze data and build machine learning models",
                "matchScore": 78
            })
            
        if any("mobile" in interest.lower() for interest in interests):
            recommendations.append({
                "title": "Mobile Developer",
                "description": "Build mobile applications for iOS and Android",
                "matchScore": 76
            })
        
        # Sort by match score and return top recommendations
        recommendations.sort(key=lambda x: x["matchScore"], reverse=True)
        
        return {"recommendations": recommendations[:5]}  # Return top 5
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

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
