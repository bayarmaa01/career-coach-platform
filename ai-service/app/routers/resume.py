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
        # Enhanced validation
        if not request.resume_id or not request.file_path:
            raise HTTPException(status_code=400, detail="Missing resume_id or file_path")
        
        # Check if file exists
        if not os.path.exists(request.file_path):
            print(f"File not found: {request.file_path}")
            raise HTTPException(status_code=404, detail=f"Resume file not found: {request.file_path}")
        
        # Initialize processor if not already done
        if resume_processor is None:
            try:
                resume_processor = ResumeProcessor()
                print("Using spaCy-based resume processor")
            except ImportError:
                resume_processor = SimpleResumeProcessor()
                print("Using simple resume processor (spaCy not available)")
        
        print(f"Starting analysis for resume {request.resume_id} at {request.file_path}")
        
        # Add background task for processing
        background_tasks.add_task(process_resume_analysis, request.resume_id, request.file_path, resume_processor)
        
        return ResumeAnalysisResponse(
            resume_id=request.resume_id,
            status="processing",
            message="Resume analysis started. Results will be available shortly."
        )
        
    except Exception as e:
        print(f"Error in analyze_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

async def process_resume_analysis(resume_id: str, file_path: str, processor):
    """Background task to process resume analysis"""
    try:
        # Update status to processing
        analysis_results[resume_id] = {
            "status": "processing",
            "message": "Analyzing resume...",
            "progress": 10
        }
        
        print(f"Processing resume {resume_id} with {type(processor).__name__}")
        
        # Process resume
        processed_data = processor.process_resume(file_path)
        
        # Update progress
        analysis_results[resume_id] = {
            "status": "processing", 
            "message": "Extracting skills and experience...",
            "progress": 50
        }
        
        # Convert to proper format
        from app.schemas.resume import Skill, Experience, Education
        skills = [Skill(**skill) for skill in processed_data["skills"]]
        experience = Experience(**processed_data["experience"])
        education = [Education(**edu) for edu in processed_data["education"]]
        
        # Update progress
        analysis_results[resume_id] = {
            "status": "processing",
            "message": "Generating career recommendations...",
            "progress": 80
        }
        
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
            "message": "Analysis completed successfully",
            "progress": 100,
            "analysis": analysis.dict()
        }
        
        print(f"Analysis completed for resume {resume_id}")
        
    except Exception as e:
        print(f"Error in process_resume_analysis: {str(e)}")
        analysis_results[resume_id] = {
            "status": "failed",
            "message": f"Analysis failed: {str(e)}",
            "error": str(e)
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
