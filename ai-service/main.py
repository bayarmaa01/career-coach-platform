from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import os
import time
from contextlib import asynccontextmanager
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

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

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active connections')

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

@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        metrics_data = generate_latest()
        return PlainTextResponse(
            metrics_data, 
            media_type="text/plain; version=0.0.4; charset=utf-8"
        )
    except Exception as e:
        print(f"Metrics error: {e}")
        return PlainTextResponse(
            "# Error generating metrics\n", 
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
