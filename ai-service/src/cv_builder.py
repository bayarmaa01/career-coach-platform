"""
Smart CV Builder - AI-powered CV generation service
Generates professional CVs based on user input
"""

import logging
import json
import time
from typing import Dict, Any, Optional
from fastapi import HTTPException
from pydantic import BaseModel, Field
from .gemini_client import GeminiClient
from .fallback_handler import FallbackHandler
from .metrics import AIMetrics

logger = logging.getLogger(__name__)

class CVBuilderRequest(BaseModel):
    """Request model for CV generation"""
    name: str = Field(..., description="Full name")
    skills: list[str] = Field(..., description="List of technical and soft skills")
    experience: list[Dict[str, Any]] = Field(..., description="Work experience entries")
    education: list[Dict[str, Any]] = Field(..., description="Education entries")
    interests: list[str] = Field(default=[], description="Professional interests")
    target_role: Optional[str] = Field(None, description="Target job role")

class CVBuilderResponse(BaseModel):
    """Response model for CV generation"""
    success: bool
    cv_data: Optional[Dict[str, Any]] = None
    formatted_cv: Optional[str] = None
    markdown_cv: Optional[str] = None
    error: Optional[str] = None

class CVBuilder:
    """Smart CV Builder using AI"""
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.fallback_handler = FallbackHandler()
        self.metrics = AIMetrics()
    
    def generate_cv(self, request: CVBuilderRequest) -> CVBuilderResponse:
        """Generate professional CV from user input"""
        start_time = time.time()
        
        try:
            logger.info(f"Generating CV for {request.name}")
            
            # Generate structured CV data using AI
            cv_data = self._generate_cv_data(request)
            
            # Format CV in multiple formats
            markdown_cv = self._format_markdown_cv(cv_data)
            formatted_cv = self._format_text_cv(cv_data)
            
            # Record success metrics
            self.metrics.record_ai_request("generate_cv", "success", time.time() - start_time)
            
            logger.info(f"CV generated successfully for {request.name}")
            
            return CVBuilderResponse(
                success=True,
                cv_data=cv_data,
                formatted_cv=formatted_cv,
                markdown_cv=markdown_cv
            )
            
        except Exception as e:
            logger.error(f"CV generation failed: {str(e)}")
            
            # Record failure metrics
            self.metrics.record_ai_request("generate_cv", "error", time.time() - start_time)
            
            # Try fallback
            try:
                fallback_response = self.fallback_handler.generate_cv_fallback(request)
                return CVBuilderResponse(
                    success=True,
                    cv_data=fallback_response["cv_data"],
                    formatted_cv=fallback_response["formatted_cv"],
                    markdown_cv=fallback_response["markdown_cv"],
                    error="Used fallback mode due to AI service unavailability"
                )
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                return CVBuilderResponse(
                    success=False,
                    error=f"CV generation failed: {str(e)}"
                )
    
    def _generate_cv_data(self, request: CVBuilderRequest) -> Dict[str, Any]:
        """Generate structured CV data using AI"""
        
        # Prepare user data for AI
        user_data = {
            "name": request.name,
            "skills": request.skills,
            "experience": request.experience,
            "education": request.education,
            "interests": request.interests,
            "target_role": request.target_role
        }
        
        # Create AI prompt for CV generation
        prompt = self._create_cv_prompt(user_data)
        
        # Get AI response
        ai_response = self.gemini_client.generate_content(prompt)
        
        # Parse and structure the response
        cv_data = self._parse_ai_response(ai_response, user_data)
        
        return cv_data
    
    def _create_cv_prompt(self, user_data: Dict[str, Any]) -> str:
        """Create comprehensive prompt for CV generation"""
        
        prompt = f"""
        You are an expert career coach and CV writer. Generate a professional, structured CV based on the following user information:
        
        USER INFORMATION:
        Name: {user_data['name']}
        Skills: {', '.join(user_data['skills'])}
        Target Role: {user_data.get('target_role', 'Not specified')}
        Interests: {', '.join(user_data['interests'])}
        
        EXPERIENCE:
        {json.dumps(user_data['experience'], indent=2)}
        
        EDUCATION:
        {json.dumps(user_data['education'], indent=2)}
        
        INSTRUCTIONS:
        1. Create a professional, modern CV structure
        2. Enhance the experience descriptions with impact statements and achievements
        3. Suggest relevant skills that might be missing
        4. Organize content in a logical, easy-to-read format
        5. Include a professional summary
        6. Add sections for skills, experience, education, and interests
        
        OUTPUT FORMAT:
        Return a JSON object with the following structure:
        {{
            "personal_info": {{
                "name": "Full Name",
                "title": "Professional Title",
                "email": "email@example.com",
                "phone": "+1234567890",
                "location": "City, Country",
                "linkedin": "linkedin.com/in/username",
                "github": "github.com/username"
            }},
            "professional_summary": "2-3 sentence summary of qualifications and career goals",
            "skills": {{
                "technical": ["skill1", "skill2", "skill3"],
                "soft": ["communication", "leadership", "teamwork"],
                "certifications": ["cert1", "cert2"]
            }},
            "experience": [
                {{
                    "title": "Job Title",
                    "company": "Company Name",
                    "location": "City, State",
                    "start_date": "Jan 2020",
                    "end_date": "Present",
                    "description": "Enhanced job description with achievements and impact",
                    "achievements": ["achievement1", "achievement2", "achievement3"]
                }}
            ],
            "education": [
                {{
                    "degree": "Degree Name",
                    "institution": "University Name",
                    "location": "City, State",
                    "start_date": "Sep 2016",
                    "end_date": "May 2020",
                    "gpa": "3.8/4.0",
                    "relevant_coursework": ["course1", "course2"]
                }}
            ],
            "projects": [
                {{
                    "name": "Project Name",
                    "description": "Project description",
                    "technologies": ["tech1", "tech2"],
                    "achievements": ["achievement1", "achievement2"]
                }}
            ],
            "interests": ["interest1", "interest2", "interest3"]
        }}
        
        Make the CV impressive but realistic. Focus on achievements and impact rather than just responsibilities.
        """
        
        return prompt
    
    def _parse_ai_response(self, ai_response: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI response and ensure valid CV structure"""
        
        try:
            # Try to parse JSON from AI response
            cv_data = json.loads(ai_response)
            
            # Validate and enhance structure
            cv_data = self._validate_cv_structure(cv_data, user_data)
            
            return cv_data
            
        except json.JSONDecodeError:
            logger.warning("AI response not valid JSON, creating fallback structure")
            return self._create_fallback_cv_structure(user_data)
    
    def _validate_cv_structure(self, cv_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and enhance CV structure"""
        
        # Ensure required sections exist
        if "personal_info" not in cv_data:
            cv_data["personal_info"] = {
                "name": user_data["name"],
                "title": user_data.get("target_role", "Professional"),
                "email": "email@example.com",
                "phone": "+1234567890",
                "location": "City, Country"
            }
        
        if "professional_summary" not in cv_data:
            cv_data["professional_summary"] = f"Experienced {user_data.get('target_role', 'professional')} with expertise in {', '.join(user_data['skills'][:5])}"
        
        if "skills" not in cv_data:
            cv_data["skills"] = {
                "technical": user_data["skills"],
                "soft": ["Communication", "Teamwork", "Problem-solving"],
                "certifications": []
            }
        
        if "experience" not in cv_data:
            cv_data["experience"] = user_data["experience"]
        
        if "education" not in cv_data:
            cv_data["education"] = user_data["education"]
        
        if "interests" not in cv_data:
            cv_data["interests"] = user_data["interests"]
        
        return cv_data
    
    def _create_fallback_cv_structure(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create basic CV structure when AI fails"""
        
        return {
            "personal_info": {
                "name": user_data["name"],
                "title": user_data.get("target_role", "Professional"),
                "email": "email@example.com",
                "phone": "+1234567890",
                "location": "City, Country"
            },
            "professional_summary": f"Professional with experience in {', '.join(user_data['skills'][:3])}",
            "skills": {
                "technical": user_data["skills"],
                "soft": ["Communication", "Teamwork", "Problem-solving"],
                "certifications": []
            },
            "experience": user_data["experience"],
            "education": user_data["education"],
            "interests": user_data["interests"]
        }
    
    def _format_markdown_cv(self, cv_data: Dict[str, Any]) -> str:
        """Format CV as Markdown"""
        
        markdown = f"# {cv_data['personal_info']['name']}\n\n"
        
        # Contact info
        contact_info = []
        if cv_data['personal_info'].get('email'):
            contact_info.append(f"📧 {cv_data['personal_info']['email']}")
        if cv_data['personal_info'].get('phone'):
            contact_info.append(f"📱 {cv_data['personal_info']['phone']}")
        if cv_data['personal_info'].get('location'):
            contact_info.append(f"📍 {cv_data['personal_info']['location']}")
        
        if contact_info:
            markdown += " | ".join(contact_info) + "\n\n"
        
        # Professional summary
        if cv_data.get('professional_summary'):
            markdown += f"## Professional Summary\n\n{cv_data['professional_summary']}\n\n"
        
        # Skills
        if cv_data.get('skills'):
            markdown += "## Skills\n\n"
            
            if cv_data['skills'].get('technical'):
                markdown += f"**Technical:** {', '.join(cv_data['skills']['technical'])}\n\n"
            
            if cv_data['skills'].get('soft'):
                markdown += f"**Soft Skills:** {', '.join(cv_data['skills']['soft'])}\n\n"
            
            if cv_data['skills'].get('certifications'):
                markdown += f"**Certifications:** {', '.join(cv_data['skills']['certifications'])}\n\n"
        
        # Experience
        if cv_data.get('experience'):
            markdown += "## Professional Experience\n\n"
            
            for exp in cv_data['experience']:
                markdown += f"### {exp.get('title', 'Position')} at {exp.get('company', 'Company')}\n"
                markdown += f"*{exp.get('start_date', '')} - {exp.get('end_date', 'Present')} | {exp.get('location', '')}*\n\n"
                
                if exp.get('description'):
                    markdown += f"{exp['description']}\n\n"
                
                if exp.get('achievements'):
                    markdown += "**Key Achievements:**\n"
                    for achievement in exp['achievements']:
                        markdown += f"- {achievement}\n"
                    markdown += "\n"
        
        # Education
        if cv_data.get('education'):
            markdown += "## Education\n\n"
            
            for edu in cv_data['education']:
                markdown += f"### {edu.get('degree', 'Degree')} - {edu.get('institution', 'University')}\n"
                markdown += f"*{edu.get('start_date', '')} - {edu.get('end_date', '')} | {edu.get('location', '')}*\n\n"
                
                if edu.get('gpa'):
                    markdown += f"**GPA:** {edu['gpa']}\n\n"
        
        # Interests
        if cv_data.get('interests'):
            markdown += f"## Interests\n\n{', '.join(cv_data['interests'])}\n\n"
        
        return markdown
    
    def _format_text_cv(self, cv_data: Dict[str, Any]) -> str:
        """Format CV as plain text"""
        
        text = f"{cv_data['personal_info']['name']}\n"
        text += "=" * len(cv_data['personal_info']['name']) + "\n\n"
        
        # Contact info
        contact_info = []
        if cv_data['personal_info'].get('email'):
            contact_info.append(f"Email: {cv_data['personal_info']['email']}")
        if cv_data['personal_info'].get('phone'):
            contact_info.append(f"Phone: {cv_data['personal_info']['phone']}")
        if cv_data['personal_info'].get('location'):
            contact_info.append(f"Location: {cv_data['personal_info']['location']}")
        
        if contact_info:
            text += "\n".join(contact_info) + "\n\n"
        
        # Professional summary
        if cv_data.get('professional_summary'):
            text += f"PROFESSIONAL SUMMARY\n{cv_data['professional_summary']}\n\n"
        
        # Skills
        if cv_data.get('skills'):
            text += "SKILLS\n"
            
            if cv_data['skills'].get('technical'):
                text += f"Technical: {', '.join(cv_data['skills']['technical'])}\n"
            
            if cv_data['skills'].get('soft'):
                text += f"Soft Skills: {', '.join(cv_data['skills']['soft'])}\n"
            
            if cv_data['skills'].get('certifications'):
                text += f"Certifications: {', '.join(cv_data['skills']['certifications'])}\n"
            
            text += "\n"
        
        # Experience
        if cv_data.get('experience'):
            text += "PROFESSIONAL EXPERIENCE\n"
            
            for exp in cv_data['experience']:
                text += f"\n{exp.get('title', 'Position')} at {exp.get('company', 'Company')}\n"
                text += f"{exp.get('start_date', '')} - {exp.get('end_date', 'Present')} | {exp.get('location', '')}\n"
                
                if exp.get('description'):
                    text += f"{exp['description']}\n"
                
                if exp.get('achievements'):
                    text += "Key Achievements:\n"
                    for achievement in exp['achievements']:
                        text += f"  • {achievement}\n"
            
            text += "\n"
        
        # Education
        if cv_data.get('education'):
            text += "EDUCATION\n"
            
            for edu in cv_data['education']:
                text += f"\n{edu.get('degree', 'Degree')} - {edu.get('institution', 'University')}\n"
                text += f"{edu.get('start_date', '')} - {edu.get('end_date', '')} | {edu.get('location', '')}\n"
                
                if edu.get('gpa'):
                    text += f"GPA: {edu['gpa']}\n"
        
        return text
