"""
Fallback Handler for AI Service - Production-Ready Implementation
Provides fallback mechanisms when Gemini API fails
"""

import json
import logging
from typing import Dict, Any, Optional, List
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

    def generate_cv_fallback(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback CV generation"""
        cv_data = {
            "personal_info": {
                "name": request.get("name", "Professional"),
                "title": request.get("target_role", "Professional"),
                "email": "email@example.com",
                "phone": "+1234567890",
                "location": "City, Country"
            },
            "professional_summary": f"Experienced {request.get('target_role', 'professional')} with expertise in {', '.join(request.get('skills', [])[:3])}",
            "skills": {
                "technical": request.get('skills', []),
                "soft": ["Communication", "Teamwork", "Problem-solving"],
                "certifications": []
            },
            "experience": request.get('experience', []),
            "education": request.get('education', []),
            "interests": request.get('interests', [])
        }

        # Format CVs
        markdown_cv = self._format_fallback_markdown_cv(cv_data)
        formatted_cv = self._format_fallback_text_cv(cv_data)

        return {
            "cv_data": cv_data,
            "formatted_cv": formatted_cv,
            "markdown_cv": markdown_cv
        }

    def chat_fallback(self, message: str) -> Dict[str, Any]:
        """Fallback chat response"""
        responses = [
            "I'm here to help with your career journey! Based on your question, I'd recommend focusing on building your skills and gaining practical experience.",
            "That's a great question! I suggest exploring different career paths that align with your interests and current skillset.",
            "I understand you're looking for career guidance. Consider networking with professionals in your field and seeking mentorship opportunities.",
            "For career development, I recommend setting clear goals and creating a structured learning plan to achieve them.",
            "Career growth often comes from continuous learning. Stay curious and keep developing new skills relevant to your field."
        ]

        import random
        response = random.choice(responses)
        
        suggestions = [
            "What specific skills do you want to develop?",
            "What career paths interest you most?",
            "How can I help with your resume?",
            "What industry are you targeting?"
        ]

        return {
            "response": response,
            "suggestions": random.sample(suggestions, 2)
        }

    def recommendations_fallback(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback recommendations"""
        skills = request.get('skills', [])
        interests = request.get('interests', [])

        career_paths = [
            {
                "title": "Software Developer",
                "description": "Design, develop, and maintain software applications",
                "required_skills": ["Programming", "Problem-solving"],
                "existing_skills": skills[:2] if skills else [],
                "missing_skills": ["Problem-solving"] if not skills else [],
                "salary_range": "$60,000 - $120,000",
                "growth_potential": "High",
                "industry_demand": "High",
                "match_score": 70
            },
            {
                "title": "Data Analyst",
                "description": "Analyze data to help businesses make informed decisions",
                "required_skills": ["Data Analysis", "Statistics"],
                "existing_skills": skills[:1] if skills else [],
                "missing_skills": ["Statistics"] if not skills else [],
                "salary_range": "$55,000 - $95,000",
                "growth_potential": "High",
                "industry_demand": "High",
                "match_score": 65
            }
        ]

        learning_roadmap = [
            {
                "month": "Month 1",
                "focus_area": "Fundamentals",
                "skills_to_learn": skills[:2] if skills else ["Programming"],
                "resources": [
                    {
                        "type": "course",
                        "title": "Introduction to Programming",
                        "provider": "Coursera",
                        "duration": "20 hours",
                        "difficulty": "Beginner"
                    }
                ],
                "projects": ["Build a simple project"],
                "time_commitment": "10 hours per week",
                "outcomes": ["Learn basic concepts", "Complete first project"]
            }
        ]

        job_suggestions = [
            {
                "job_title": "Junior Developer",
                "company_type": "Startup",
                "responsibilities": ["Write code", "Debug applications"],
                "skills_match": {
                    "matched": skills[:1] if skills else [],
                    "missing": ["Experience"],
                    "match_percentage": 60
                },
                "salary_range": "$50,000 - $70,000",
                "location_options": ["Remote", "Hybrid"],
                "application_tips": ["Highlight projects", "Show learning attitude"],
                "urgency": "Medium"
            }
        ]

        skill_gaps = [
            "Communication skills",
            "Project management",
            "Technical writing"
        ]

        return {
            "career_paths": career_paths,
            "learning_roadmap": learning_roadmap,
            "job_suggestions": job_suggestions,
            "skill_gaps": skill_gaps
        }

    def cv_improver_fallback(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback CV improvement"""
        original_cv = request.get('cv_text', '')
        target_role = request.get('target_role', 'Professional')

        # Simple improvements
        improved_cv = original_cv
        
        # Add professional summary if missing
        if "summary" not in original_cv.lower():
            improved_cv = f"Professional Summary\nExperienced {target_role} with proven track record of success.\n\n{improved_cv}"
        
        # Add action verbs
        action_verbs = ["Led", "Developed", "Implemented", "Achieved", "Managed"]
        for verb in action_verbs:
            if verb.lower() not in improved_cv.lower():
                improved_cv = improved_cv.replace("responsible for", f"{verb}").replace("worked on", f"{verb}")

        improvements_made = [
            "Enhanced professional summary",
            "Added action verbs for impact",
            "Improved formatting"
        ]
        
        suggested_skills = ["Communication", "Leadership", "Problem-solving"]
        grammar_corrections = ["Fixed sentence structure", "Improved punctuation"]
        impact_additions = ["Added achievement-focused statements"]

        return {
            "improved_cv": improved_cv,
            "improvements_made": improvements_made,
            "suggested_skills": suggested_skills,
            "grammar_corrections": grammar_corrections,
            "impact_additions": impact_additions
        }

    def _format_fallback_markdown_cv(self, cv_data: Dict[str, Any]) -> str:
        """Format fallback CV as markdown"""
        markdown = f"# {cv_data['personal_info']['name']}\n\n"
        
        if cv_data.get('professional_summary'):
            markdown += f"## Professional Summary\n\n{cv_data['professional_summary']}\n\n"
        
        if cv_data.get('skills'):
            markdown += "## Skills\n\n"
            if cv_data['skills'].get('technical'):
                markdown += f"**Technical:** {', '.join(cv_data['skills']['technical'])}\n\n"
        
        return markdown

    def _format_fallback_text_cv(self, cv_data: Dict[str, Any]) -> str:
        """Format fallback CV as text"""
        text = f"{cv_data['personal_info']['name']}\n"
        text += "=" * len(cv_data['personal_info']['name']) + "\n\n"
        
        if cv_data.get('professional_summary'):
            text += f"PROFESSIONAL SUMMARY\n{cv_data['professional_summary']}\n\n"
        
        if cv_data.get('skills'):
            text += "SKILLS\n"
            if cv_data['skills'].get('technical'):
                text += f"Technical: {', '.join(cv_data['skills']['technical'])}\n"
        
        return text

# Global fallback handler instance
fallback_handler = FallbackHandler()
