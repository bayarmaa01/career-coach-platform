"""
AI Service Main Application - Production-ready FastAPI service
Provides AI-powered career coaching features with Gemini API integration
"""

import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import uvicorn

from .cv_builder import CVBuilder, CVBuilderRequest, CVBuilderResponse
from .chat_assistant import ChatAssistant, ChatRequest, ChatResponse
from .smart_recommendations import SmartRecommendations, RecommendationsRequest, RecommendationsResponse
from .cv_improver import CVImprover, CVImproverRequest, CVImproverResponse
from .metrics import ai_metrics
from .fallback_handler import fallback_handler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize AI services
cv_builder = CVBuilder()
chat_assistant = ChatAssistant()
smart_recommendations = SmartRecommendations()
cv_improver = CVImprover()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("AI Service starting up...")
    
    # Initialize services
    try:
        # Test Gemini API connection
        from .gemini_client import gemini_client
        health_status = gemini_client.health_check()
        logger.info(f"Gemini API health: {health_status['status']}")
        
        if health_status['status'] != 'healthy':
            logger.warning("Gemini API not healthy, fallback mode will be used")
        
        logger.info("AI Service startup completed successfully")
        
    except Exception as e:
        logger.error(f"AI Service startup failed: {str(e)}")
        raise
    
    yield
    
    logger.info("AI Service shutting down...")

# Create FastAPI application
app = FastAPI(
    title="Career Coach AI Service",
    description="AI-powered career coaching and CV generation service",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Middleware to track request metrics"""
    start_time = time.time()
    
    # Increment active connections
    ai_metrics.increment_active_connections()
    
    try:
        response = await call_next(request)
        
        # Record metrics
        process_time = time.time() - start_time
        endpoint = request.url.path
        status = "success" if response.status_code < 400 else "error"
        
        ai_metrics.record_ai_request(endpoint, status, process_time)
        
        # Add custom headers
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except Exception as e:
        # Record error metrics
        process_time = time.time() - start_time
        endpoint = request.url.path
        ai_metrics.record_ai_request(endpoint, "error", process_time)
        ai_metrics.record_ai_failure(endpoint, "exception", str(e))
        raise
    finally:
        # Decrement active connections
        ai_metrics.decrement_active_connections()

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    try:
        from .gemini_client import gemini_client
        gemini_health = gemini_client.health_check()
        
        return {
            "status": "healthy" if gemini_health["status"] == "healthy" else "degraded",
            "gemini_status": gemini_health["status"],
            "fallback_enabled": fallback_handler.fallback_enabled,
            "api_key_configured": bool(gemini_health.get("api_key_configured", False)),
            "metrics": ai_metrics.get_metrics_summary(),
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )

# Metrics endpoint
@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint"""
    try:
        metrics_data = ai_metrics.get_prometheus_metrics()
        return JSONResponse(
            content=metrics_data,
            media_type=CONTENT_TYPE_LATEST
        )
    except Exception as e:
        logger.error(f"Metrics endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate metrics")

# CV Builder endpoint
@app.post("/generate-cv", response_model=CVBuilderResponse, tags=["CV Builder"])
async def generate_cv(request: CVBuilderRequest):
    """Generate professional CV using AI"""
    try:
        logger.info(f"CV generation request for: {request.name}")
        return await cv_builder.generate_cv(request)
    except Exception as e:
        logger.error(f"CV generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Chat endpoint
@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """Chat with AI career assistant"""
    try:
        logger.info(f"Chat request: {request.message[:50]}...")
        return await chat_assistant.chat(request)
    except Exception as e:
        logger.error(f"Chat request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Smart Recommendations endpoint
@app.post("/recommendations-lite", response_model=RecommendationsResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationsRequest):
    """Get smart recommendations without CV"""
    try:
        logger.info(f"Recommendations request for {len(request.skills)} skills")
        return await smart_recommendations.generate_recommendations(request)
    except Exception as e:
        logger.error(f"Recommendations request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# CV Improver endpoint
@app.post("/improve-cv", response_model=CVImproverResponse, tags=["CV Improver"])
async def improve_cv(request: CVImproverRequest):
    """Improve existing CV using AI"""
    try:
        logger.info(f"CV improvement request ({len(request.cv_text)} characters)")
        return await cv_improver.improve_cv(request)
    except Exception as e:
        logger.error(f"CV improvement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Career Coach AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "cv_builder": "/generate-cv",
            "chat": "/chat",
            "recommendations": "/recommendations-lite",
            "cv_improver": "/improve-cv",
            "health": "/health",
            "metrics": "/metrics"
        },
        "documentation": "/docs"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": time.time()
        }
    )

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5100,
        reload=False,  # Set to False in production
        log_level="info",
        access_log=True
    )
