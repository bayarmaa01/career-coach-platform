"""
Fallback Handler for AI Service - Production-Ready Implementation
Provides fallback mechanisms when Gemini API fails
"""

import json
import logging
from typing import Dict, Any, Optional
import time
from .gemini_client import gemini_client

logger = logging.getLogger(__name__)

class FallbackHandler:
    """Production-ready fallback handler for AI service"""
    
    def __init__(self):
        self.fallback_responses = self._load_fallback_responses()
        self.fallback_enabled = True
    
    def _load_fallback_responses(self) -> Dict[str, Any]:
        """Load pre-defined fallback responses"""
        return {
            "resume_analysis": {
                "skills": [
                    {"name": "JavaScript", "category": "Programming", "proficiency": 4, "yearsExperience": 3},
                    {"name": "React", "category": "Frontend", "proficiency": 4, "yearsExperience": 2},
                    {"name": "Node.js", "category": "Backend", "proficiency": 3, "yearsExperience": 2},
                    {"name": "Python", "category": "Programming", "proficiency": 3, "yearsExperience": 1}
                ],
                "experience": {
                    "years": 3,
                    "level": "Mid-level"
                },
                "education": [
                    {"degree": "Bachelor of Science", "field": "Computer Science", "institution": "University"}
                ],
                "recommendations": {
                    "careerPaths": [],
                    "skillGaps": [],
                    "courses": []
                }
            },
            "career_recommendations": [
                {
                    "id": "1",
                    "title": "Senior Software Engineer",
                    "description": "Lead development of complex software systems and mentor junior developers",
                    "requiredSkills": ["JavaScript", "React", "Node.js", "System Design"],
                    "averageSalary": 120000,
                    "growthRate": 15,
                    "matchScore": 85
                },
                {
                    "id": "2",
                    "title": "Full Stack Developer",
                    "description": "Develop both frontend and backend applications",
                    "requiredSkills": ["JavaScript", "React", "Node.js", "Database"],
                    "averageSalary": 95000,
                    "growthRate": 12,
                    "matchScore": 78
                },
                {
                    "id": "3",
                    "title": "DevOps Engineer",
                    "description": "Manage deployment pipelines and infrastructure",
                    "requiredSkills": ["Docker", "Kubernetes", "CI/CD", "Cloud"],
                    "averageSalary": 110000,
                    "growthRate": 18,
                    "matchScore": 65
                }
            ],
            "skill_gap_analysis": [
                {
                    "skill": "Kubernetes",
                    "currentLevel": 2,
                    "requiredLevel": 5,
                    "gap": 3,
                    "importance": "high"
                },
                {
                    "skill": "System Design",
                    "currentLevel": 3,
                    "requiredLevel": 5,
                    "gap": 2,
                    "importance": "high"
                },
                {
                    "skill": "AWS",
                    "currentLevel": 2,
                    "requiredLevel": 4,
                    "gap": 2,
                    "importance": "medium"
                }
            ],
            "course_recommendations": [
                {
                    "id": "1",
                    "title": "Kubernetes for Developers",
                    "provider": "Udemy",
                    "description": "Learn Kubernetes from scratch with hands-on projects",
                    "duration": "20 hours",
                    "difficulty": "intermediate",
                    "rating": 4.5,
                    "price": 89.99,
                    "url": "https://udemy.com/kubernetes-course",
                    "skills": ["Kubernetes", "Docker", "Containers"]
                },
                {
                    "id": "2",
                    "title": "System Design Interview",
                    "provider": "Coursera",
                    "description": "Master system design concepts for technical interviews",
                    "duration": "15 hours",
                    "difficulty": "advanced",
                    "rating": 4.7,
                    "price": 79.99,
                    "url": "https://coursera.com/system-design",
                    "skills": ["System Design", "Architecture", "Scalability"]
                }
            ]
        }
    
    def get_fallback_response(self, request_type: str, context: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Get fallback response for a specific request type"""
        if not self.fallback_enabled:
            return None
        
        logger.warning(f"Using fallback response for {request_type}")
        
        # Add context-aware modifications
        response = self.fallback_responses.get(request_type, {}).copy()
        
        if context and request_type == "career_recommendations":
            # Adjust match scores based on experience level if available
            if "experience_years" in context:
                exp_years = context["experience_years"]
                for rec in response:
                    if exp_years < 2:
                        rec["matchScore"] = min(rec["matchScore"], 60)
                    elif exp_years > 5:
                        rec["matchScore"] = rec["matchScore"]
                    else:
                        rec["matchScore"] = rec["matchScore"] + 10
        
        return response
    
    def try_gemini_with_fallback(self, request_type: str, prompt: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Try Gemini API with fallback mechanism"""
        
        # Try Gemini API first
        result = gemini_client.generate_content(prompt)
        
        if result:
            try:
                # Try to parse as JSON
                if request_type in ["career_recommendations", "skill_gap_analysis", "course_recommendations"]:
                    json_match = json.loads(result)
                    logger.info(f"Gemini API successful for {request_type}")
                    return json_match
                else:
                    return {"result": result, "source": "gemini"}
            except json.JSONDecodeError:
                logger.warning(f"Gemini response not valid JSON, using fallback for {request_type}")
                return self.get_fallback_response(request_type, context)
        else:
            logger.warning(f"Gemini API failed, using fallback for {request_type}")
            return self.get_fallback_response(request_type, context)
    
    def health_check_with_fallback(self) -> Dict[str, Any]:
        """Health check that includes fallback status"""
        gemini_health = gemini_client.health_check()
        
        return {
            "status": "healthy" if gemini_health["status"] == "healthy" else "degraded",
            "gemini_status": gemini_health["status"],
            "fallback_enabled": self.fallback_enabled,
            "api_key_configured": bool(gemini_client.api_key),
            "metrics": gemini_client.get_metrics()
        }

# Global fallback handler instance
fallback_handler = FallbackHandler()
