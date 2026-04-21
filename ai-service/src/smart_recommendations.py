"""
Smart Recommendations - AI-powered career suggestions without CV requirement
Generates personalized recommendations based on skills, interests, and chat history
"""

import logging
import json
import time
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel, Field
from .gemini_client import GeminiClient
from .fallback_handler import FallbackHandler
from .metrics import AIMetrics

logger = logging.getLogger(__name__)

class RecommendationsRequest(BaseModel):
    """Request model for smart recommendations"""
    skills: list[str] = Field(..., description="User's skills")
    interests: list[str] = Field(..., description="User's interests")
    target_role: Optional[str] = Field(None, description="Target job role")
    experience_level: Optional[str] = Field(None, description="Experience level")
    chat_history: Optional[List[str]] = Field([], description="Recent chat messages for context")
    preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")

class RecommendationsResponse(BaseModel):
    """Response model for smart recommendations"""
    success: bool
    career_paths: Optional[List[Dict[str, Any]]] = None
    learning_roadmap: Optional[List[Dict[str, Any]]] = None
    job_suggestions: Optional[List[Dict[str, Any]]] = None
    skill_gaps: Optional[List[str]] = None
    error: Optional[str] = None

class SmartRecommendations:
    """Smart Recommendations Engine"""
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.fallback_handler = FallbackHandler()
        self.metrics = AIMetrics()
    
    def generate_recommendations(self, request: RecommendationsRequest) -> RecommendationsResponse:
        """Generate personalized career recommendations"""
        start_time = time.time()
        
        try:
            logger.info(f"Generating recommendations for {len(request.skills)} skills and {len(request.interests)} interests")
            
            # Generate comprehensive recommendations
            career_paths = self._generate_career_paths(request)
            learning_roadmap = self._generate_learning_roadmap(request)
            job_suggestions = self._generate_job_suggestions(request)
            skill_gaps = self._identify_skill_gaps(request)
            
            # Record success metrics
            self.metrics.record_ai_request("recommendations", "success", time.time() - start_time)
            
            logger.info("Recommendations generated successfully")
            
            return RecommendationsResponse(
                success=True,
                career_paths=career_paths,
                learning_roadmap=learning_roadmap,
                job_suggestions=job_suggestions,
                skill_gaps=skill_gaps
            )
            
        except Exception as e:
            logger.error(f"Recommendations generation failed: {str(e)}")
            
            # Record failure metrics
            self.metrics.record_ai_request("recommendations", "error", time.time() - start_time)
            
            # Try fallback
            try:
                fallback_response = self.fallback_handler.recommendations_fallback(request)
                return RecommendationsResponse(
                    success=True,
                    career_paths=fallback_response["career_paths"],
                    learning_roadmap=fallback_response["learning_roadmap"],
                    job_suggestions=fallback_response["job_suggestions"],
                    skill_gaps=fallback_response["skill_gaps"],
                    error="Used fallback mode due to AI service unavailability"
                )
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                return RecommendationsResponse(
                    success=False,
                    error=f"Recommendations generation failed: {str(e)}"
                )
    
    def _generate_career_paths(self, request: RecommendationsRequest) -> List[Dict[str, Any]]:
        """Generate career path recommendations"""
        
        # Create AI prompt for career paths
        prompt = self._create_career_paths_prompt(request)
        
        # Get AI response
        ai_response = self.gemini_client.generate_content(prompt)
        
        # Parse career paths
        career_paths = self._parse_career_paths(ai_response)
        
        return career_paths
    
    def _create_career_paths_prompt(self, request: RecommendationsRequest) -> str:
        """Create prompt for career path generation"""
        
        prompt = f"""
        You are an expert career advisor. Based on the following user information, suggest 3-5 suitable career paths:
        
        USER PROFILE:
        Skills: {', '.join(request.skills)}
        Interests: {', '.join(request.interests)}
        Target Role: {request.target_role or 'Not specified'}
        Experience Level: {request.experience_level or 'Not specified'}
        
        """
        
        if request.chat_history:
            prompt += f"Recent Chat Context: {' | '.join(request.chat_history[-3:])}\n"
        
        prompt += """
        For each career path, provide:
        1. Job title and description
        2. Required skills (including what user already has)
        3. Salary range and growth potential
        4. Industry demand and future outlook
        5. Entry requirements and typical progression
        
        OUTPUT FORMAT:
        Return a JSON array of career paths:
        [
            {
                "title": "Career Path Title",
                "description": "Brief description of the role",
                "required_skills": ["skill1", "skill2", "skill3"],
                "existing_skills": ["skill1", "skill2"],
                "missing_skills": ["skill3"],
                "salary_range": "$X,XXX - $X,XXX",
                "growth_potential": "High/Medium/Low",
                "industry_demand": "High/Medium/Low",
                "entry_requirements": "Requirements for entry level",
                "career_progression": "Typical career path progression",
                "match_score": 85
            }
        ]
        
        Focus on careers that align with the user's skills and interests. Be realistic but encouraging.
        """
        
        return prompt
    
    def _parse_career_paths(self, ai_response: str) -> List[Dict[str, Any]]:
        """Parse AI response for career paths"""
        
        try:
            career_paths = json.loads(ai_response)
            return career_paths
        except json.JSONDecodeError:
            logger.warning("AI response not valid JSON, creating fallback career paths")
            return self._create_fallback_career_paths()
    
    def _create_fallback_career_paths(self) -> List[Dict[str, Any]]:
        """Create fallback career paths"""
        
        return [
            {
                "title": "Software Developer",
                "description": "Design, develop, and maintain software applications",
                "required_skills": ["Programming", "Problem-solving", "Communication"],
                "existing_skills": ["Programming"],
                "missing_skills": ["Problem-solving", "Communication"],
                "salary_range": "$60,000 - $120,000",
                "growth_potential": "High",
                "industry_demand": "High",
                "entry_requirements": "Bachelor's degree in Computer Science or related field",
                "career_progression": "Junior Developer -> Senior Developer -> Tech Lead -> Engineering Manager",
                "match_score": 75
            },
            {
                "title": "Data Analyst",
                "description": "Analyze data to help businesses make informed decisions",
                "required_skills": ["Data Analysis", "Statistics", "Communication"],
                "existing_skills": ["Data Analysis"],
                "missing_skills": ["Statistics", "Communication"],
                "salary_range": "$55,000 - $95,000",
                "growth_potential": "High",
                "industry_demand": "High",
                "entry_requirements": "Bachelor's degree in Statistics, Mathematics, or related field",
                "career_progression": "Junior Analyst -> Senior Analyst -> Data Scientist -> Analytics Manager",
                "match_score": 70
            }
        ]
    
    def _generate_learning_roadmap(self, request: RecommendationsRequest) -> List[Dict[str, Any]]:
        """Generate learning roadmap"""
        
        prompt = f"""
        Based on the user's profile, create a personalized learning roadmap:
        
        USER PROFILE:
        Skills: {', '.join(request.skills)}
        Interests: {', '.join(request.interests)}
        Target Role: {request.target_role or 'Not specified'}
        Experience Level: {request.experience_level or 'Not specified'}
        
        Create a 6-month learning plan with:
        1. Monthly goals and milestones
        2. Specific skills to learn
        3. Recommended resources (courses, books, projects)
        4. Practice projects or exercises
        5. Time commitment estimates
        
        OUTPUT FORMAT:
        Return a JSON array of monthly plans:
        [
            {
                "month": "Month 1",
                "focus_area": "Primary focus for the month",
                "skills_to_learn": ["skill1", "skill2"],
                "resources": [
                    {
                        "type": "course/book/project",
                        "title": "Resource title",
                        "provider": "Coursera/Udemy/etc",
                        "duration": "X hours",
                        "difficulty": "Beginner/Intermediate/Advanced"
                    }
                ],
                "projects": ["Project 1", "Project 2"],
                "time_commitment": "X hours per week",
                "outcomes": ["Expected outcome 1", "Expected outcome 2"]
            }
        ]
        """
        
        try:
            ai_response = self.gemini_client.generate_content(prompt)
            roadmap = json.loads(ai_response)
            return roadmap
        except Exception as e:
            logger.error(f"Learning roadmap generation failed: {str(e)}")
            return self._create_fallback_roadmap()
    
    def _create_fallback_roadmap(self) -> List[Dict[str, Any]]:
        """Create fallback learning roadmap"""
        
        return [
            {
                "month": "Month 1",
                "focus_area": "Fundamentals",
                "skills_to_learn": ["Basic Programming", "Problem Solving"],
                "resources": [
                    {
                        "type": "course",
                        "title": "Introduction to Programming",
                        "provider": "Coursera",
                        "duration": "20 hours",
                        "difficulty": "Beginner"
                    }
                ],
                "projects": ["Build a simple calculator"],
                "time_commitment": "10 hours per week",
                "outcomes": ["Understand programming basics", "Complete first project"]
            },
            {
                "month": "Month 2",
                "focus_area": "Advanced Concepts",
                "skills_to_learn": ["Data Structures", "Algorithms"],
                "resources": [
                    {
                        "type": "book",
                        "title": "Data Structures and Algorithms",
                        "provider": "O'Reilly",
                        "duration": "30 hours",
                        "difficulty": "Intermediate"
                    }
                ],
                "projects": ["Build a data structure library"],
                "time_commitment": "12 hours per week",
                "outcomes": ["Master data structures", "Implement algorithms"]
            }
        ]
    
    def _generate_job_suggestions(self, request: RecommendationsRequest) -> List[Dict[str, Any]]:
        """Generate job suggestions"""
        
        prompt = f"""
        Based on the user's profile, suggest 5-7 specific job opportunities:
        
        USER PROFILE:
        Skills: {', '.join(request.skills)}
        Interests: {', '.join(request.interests)}
        Target Role: {request.target_role or 'Not specified'}
        Experience Level: {request.experience_level or 'Not specified'}
        
        For each job suggestion, provide:
        1. Job title and company type
        2. Key responsibilities
        3. Required skills match
        4. Typical salary range
        5. Location options (remote/hybrid/onsite)
        6. Application tips
        
        OUTPUT FORMAT:
        Return a JSON array:
        [
            {
                "job_title": "Job Title",
                "company_type": "Startup/Enterprise/Medium-sized",
                "responsibilities": ["Responsibility 1", "Responsibility 2"],
                "skills_match": {
                    "matched": ["skill1", "skill2"],
                    "missing": ["skill3"],
                    "match_percentage": 75
                },
                "salary_range": "$X,XXX - $X,XXX",
                "location_options": ["Remote", "Hybrid", "On-site"],
                "application_tips": ["Tip 1", "Tip 2"],
                "urgency": "High/Medium/Low"
            }
        ]
        """
        
        try:
            ai_response = self.gemini_client.generate_content(prompt)
            job_suggestions = json.loads(ai_response)
            return job_suggestions
        except Exception as e:
            logger.error(f"Job suggestions generation failed: {str(e)}")
            return self._create_fallback_job_suggestions()
    
    def _create_fallback_job_suggestions(self) -> List[Dict[str, Any]]:
        """Create fallback job suggestions"""
        
        return [
            {
                "job_title": "Junior Software Developer",
                "company_type": "Startup",
                "responsibilities": ["Write code", "Debug applications", "Collaborate with team"],
                "skills_match": {
                    "matched": ["Programming"],
                    "missing": ["Experience", "Advanced skills"],
                    "match_percentage": 60
                },
                "salary_range": "$50,000 - $70,000",
                "location_options": ["Remote", "Hybrid"],
                "application_tips": ["Highlight projects", "Show learning attitude"],
                "urgency": "Medium"
            }
        ]
    
    def _identify_skill_gaps(self, request: RecommendationsRequest) -> List[str]:
        """Identify skill gaps based on target role"""
        
        if not request.target_role:
            return ["Consider specifying a target role for personalized skill gap analysis"]
        
        prompt = f"""
        Based on the user's current skills and target role, identify skill gaps:
        
        CURRENT SKILLS: {', '.join(request.skills)}
        TARGET ROLE: {request.target_role}
        EXPERIENCE LEVEL: {request.experience_level or 'Not specified'}
        
        Identify 5-7 skills the user should develop to be successful in the target role.
        For each skill, provide:
        1. Skill name
        2. Why it's important for the role
        3. How to acquire it (brief suggestion)
        
        OUTPUT FORMAT:
        Return a JSON array:
        [
            "Skill 1 - Important because... - Learn by...",
            "Skill 2 - Important because... - Learn by..."
        ]
        """
        
        try:
            ai_response = self.gemini_client.generate_content(prompt)
            skill_gaps = json.loads(ai_response)
            return skill_gaps
        except Exception as e:
            logger.error(f"Skill gap analysis failed: {str(e)}")
            return ["Communication skills", "Technical writing", "Project management"]
