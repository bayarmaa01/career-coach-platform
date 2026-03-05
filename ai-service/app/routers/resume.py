from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import os
import json

from app.schemas.resume import ResumeAnalysisRequest, ResumeAnalysisResponse, ResumeAnalysis
from app.services.resume_processor import ResumeProcessor
from app.services.simple_resume_processor import SimpleResumeProcessor
from app.services.career_analyzer import CareerAnalyzer
from app.core.config import settings

router = APIRouter()

# Global storage for analysis results (in production, use Redis or database)
analysis_results: Dict[str, Dict[str, Any]] = {}

# Global processor (will be set based on spaCy availability)
resume_processor = None
career_analyzer = CareerAnalyzer()

@router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze resume and return analysis results"""
    global resume_processor
    
    try:
        # Check if file exists
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        # Initialize processor if not already done
        if resume_processor is None:
            try:
                resume_processor = ResumeProcessor()
                print("Using spaCy-based resume processor")
            except ImportError:
                resume_processor = SimpleResumeProcessor()
                print("Using simple resume processor (spaCy not available)")
        
        # Add background task for processing
        background_tasks.add_task(process_resume_analysis, request.resume_id, request.file_path, resume_processor)
        
        return ResumeAnalysisResponse(
            resume_id=request.resume_id,
            status="processing",
            message="Resume analysis started. Results will be available shortly."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

async def process_resume_analysis(resume_id: str, file_path: str, processor):
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis: {str(e)}")

async def process_resume_analysis(resume_id: str, file_path: str):
    """Background task to process resume analysis"""
    try:
        # Update status to processing
        analysis_results[resume_id] = {
            "status": "processing",
            "message": "Analyzing resume..."
        }
        
        # Process resume
        processed_data = resume_processor.process_resume(file_path)
        
        # Convert to proper format
        from app.schemas.resume import Skill, Experience, Education
        skills = [Skill(**skill) for skill in processed_data["skills"]]
        experience = Experience(**processed_data["experience"])
        education = [Education(**edu) for edu in processed_data["education"]]
        
        # Generate career recommendations
        recommendations = career_analyzer.generate_recommendations(skills, experience.years)
        
        # Create complete analysis
        analysis = ResumeAnalysis(
            skills=skills,
            experience=experience,
            education=education,
            recommendations=recommendations
        )
        
        # Store results
        analysis_results[resume_id] = {
            "status": "completed",
            "analysis": analysis.dict()
        }
        
    except Exception as e:
        analysis_results[resume_id] = {
            "status": "failed",
            "message": f"Analysis failed: {str(e)}"
        }

@router.get("/analysis-status/{resume_id}")
async def get_analysis_status(resume_id: str):
    """Get analysis status"""
    if resume_id not in analysis_results:
        return {"status": "not_found", "message": "Analysis not started"}
    
    return {
        "status": analysis_results[resume_id]["status"],
        "message": analysis_results[resume_id].get("message", "")
    }
