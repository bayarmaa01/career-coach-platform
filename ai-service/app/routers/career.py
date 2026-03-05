from fastapi import APIRouter, HTTPException
from typing import List

from app.schemas.resume import CareerPath, SkillGap, Course
from app.services.career_analyzer import CareerAnalyzer
from app.routers.resume import analysis_results

router = APIRouter()
career_analyzer = CareerAnalyzer()

@router.get("/career-recommendations/{resume_id}")
async def get_career_recommendations(resume_id: str) -> List[CareerPath]:
    """Get career path recommendations based on resume analysis"""
    try:
        if resume_id not in analysis_results:
            raise HTTPException(status_code=404, detail="Resume analysis not found")
        
        result = analysis_results[resume_id]
        
        if result["status"] != "completed":
            raise HTTPException(status_code=400, detail="Resume analysis not completed")
        
        analysis = result["analysis"]
        return analysis["recommendations"]["career_paths"]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting career recommendations: {str(e)}")

@router.get("/skill-gap/{resume_id}")
async def get_skill_gap_analysis(resume_id: str) -> List[SkillGap]:
    """Get skill gap analysis based on resume analysis"""
    try:
        if resume_id not in analysis_results:
            raise HTTPException(status_code=404, detail="Resume analysis not found")
        
        result = analysis_results[resume_id]
        
        if result["status"] != "completed":
            raise HTTPException(status_code=400, detail="Resume analysis not completed")
        
        analysis = result["analysis"]
        return analysis["recommendations"]["skill_gaps"]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting skill gap analysis: {str(e)}")

@router.get("/courses/{resume_id}")
async def get_course_recommendations(resume_id: str) -> List[Course]:
    """Get course recommendations based on skill gaps"""
    try:
        if resume_id not in analysis_results:
            raise HTTPException(status_code=404, detail="Resume analysis not found")
        
        result = analysis_results[resume_id]
        
        if result["status"] != "completed":
            raise HTTPException(status_code=400, detail="Resume analysis not completed")
        
        analysis = result["analysis"]
        return analysis["recommendations"]["courses"]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting course recommendations: {str(e)}")
