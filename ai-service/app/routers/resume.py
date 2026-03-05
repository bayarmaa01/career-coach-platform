from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import os
import json

from app.schemas.resume import ResumeAnalysisRequest, ResumeAnalysisResponse, ResumeAnalysis
from app.services.resume_processor import ResumeProcessor
from app.services.career_analyzer import CareerAnalyzer
from app.core.config import settings

router = APIRouter()

# Global storage for analysis results (in production, use Redis or database)
analysis_results: Dict[str, Dict[str, Any]] = {}

resume_processor = ResumeProcessor()
career_analyzer = CareerAnalyzer()

@router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze resume and return analysis results"""
    try:
        # Check if file exists
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
        
        # Add background task for processing
        background_tasks.add_task(process_resume_analysis, request.resume_id, request.file_path)
        
        return ResumeAnalysisResponse(
            resume_id=request.resume_id,
            status="processing",
            message="Resume analysis started. Results will be available shortly."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@router.get("/analysis/{resume_id}")
async def get_analysis(resume_id: str):
    """Get resume analysis results"""
    try:
        if resume_id not in analysis_results:
            raise HTTPException(status_code=404, detail="Analysis not found or not completed")
        
        result = analysis_results[resume_id]
        
        if result["status"] == "processing":
            return ResumeAnalysisResponse(
                resume_id=resume_id,
                status="processing",
                message="Analysis in progress..."
            )
        
        return ResumeAnalysisResponse(
            resume_id=resume_id,
            status="completed",
            analysis=ResumeAnalysis(**result["analysis"])
        )
        
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
