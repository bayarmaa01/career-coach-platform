"""
CV Improver - AI-powered CV enhancement service
Improves existing CVs with better formatting, grammar, and impact statements
"""

import logging
import json
import time
import re
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel, Field
from .gemini_client import GeminiClient
from .fallback_handler import FallbackHandler
from .metrics import AIMetrics

logger = logging.getLogger(__name__)

class CVImproverRequest(BaseModel):
    """Request model for CV improvement"""
    cv_text: str = Field(..., description="Current CV text content")
    target_role: Optional[str] = Field(None, description="Target job role")
    improvement_focus: Optional[List[str]] = Field(None, description="Areas to focus on")
    current_issues: Optional[List[str]] = Field(None, description="Known issues with current CV")

class CVImproverResponse(BaseModel):
    """Response model for CV improvement"""
    success: bool
    improved_cv: Optional[str] = None
    improvements_made: Optional[List[str]] = None
    suggested_skills: Optional[List[str]] = None
    grammar_corrections: Optional[List[str]] = None
    impact_additions: Optional[List[str]] = None
    error: Optional[str] = None

class CVImprover:
    """CV Improver Service"""
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.fallback_handler = FallbackHandler()
        self.metrics = AIMetrics()
    
    def improve_cv(self, request: CVImproverRequest) -> CVImproverResponse:
        """Improve CV content using AI"""
        start_time = time.time()
        
        try:
            logger.info(f"Improving CV for target role: {request.target_role or 'Not specified'}")
            
            # Analyze and improve CV
            improved_cv = self._generate_improved_cv(request)
            improvements_made = self._identify_improvements(request.cv_text, improved_cv)
            suggested_skills = self._suggest_missing_skills(request)
            grammar_corrections = self._identify_grammar_fixes(request.cv_text, improved_cv)
            impact_additions = self._identify_impact_additions(request.cv_text, improved_cv)
            
            # Record success metrics
            self.metrics.record_ai_request("improve_cv", "success", time.time() - start_time)
            
            logger.info("CV improvement completed successfully")
            
            return CVImproverResponse(
                success=True,
                improved_cv=improved_cv,
                improvements_made=improvements_made,
                suggested_skills=suggested_skills,
                grammar_corrections=grammar_corrections,
                impact_additions=impact_additions
            )
            
        except Exception as e:
            logger.error(f"CV improvement failed: {str(e)}")
            
            # Record failure metrics
            self.metrics.record_ai_request("improve_cv", "error", time.time() - start_time)
            
            # Try fallback
            try:
                fallback_response = self.fallback_handler.cv_improver_fallback(request)
                return CVImproverResponse(
                    success=True,
                    improved_cv=fallback_response["improved_cv"],
                    improvements_made=fallback_response["improvements_made"],
                    suggested_skills=fallback_response["suggested_skills"],
                    grammar_corrections=fallback_response["grammar_corrections"],
                    impact_additions=fallback_response["impact_additions"],
                    error="Used fallback mode due to AI service unavailability"
                )
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                return CVImproverResponse(
                    success=False,
                    error=f"CV improvement failed: {str(e)}"
                )
    
    def _generate_improved_cv(self, request: CVImproverRequest) -> str:
        """Generate improved CV using AI"""
        
        # Create comprehensive prompt for CV improvement
        prompt = self._create_cv_improvement_prompt(request)
        
        # Get AI response
        ai_response = self.gemini_client.generate_content(prompt)
        
        return ai_response
    
    def _create_cv_improvement_prompt(self, request: CVImproverRequest) -> str:
        """Create prompt for CV improvement"""
        
        prompt = f"""
        You are an expert CV writer and career coach. Improve the following CV to make it more professional, impactful, and effective.
        
        CURRENT CV:
        {request.cv_text}
        
        TARGET ROLE: {request.target_role or 'Not specified'}
        
        """
        
        if request.improvement_focus:
            prompt += f"FOCUS AREAS: {', '.join(request.improvement_focus)}\n"
        
        if request.current_issues:
            prompt += f"KNOWN ISSUES: {', '.join(request.current_issues)}\n"
        
        prompt += """
        IMPROVEMENT TASKS:
        1. Fix grammar, spelling, and punctuation errors
        2. Enhance bullet points to show impact and achievements
        3. Add action verbs and quantifiable results
        4. Improve formatting and structure
        5. Suggest missing relevant skills
        6. Optimize for ATS (Applicant Tracking Systems)
        7. Add professional summary if missing
        8. Ensure consistent formatting and style
        
        GUIDELINES:
        - Keep the original information and experience intact
        - Enhance descriptions with specific achievements and metrics
        - Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
        - Add quantifiable results where possible (increased by X%, reduced by Y%, saved Z hours)
        - Ensure professional tone and language
        - Maintain proper CV structure and flow
        - Add relevant keywords for the target role
        
        OUTPUT:
        Provide the complete improved CV with proper formatting.
        Focus on making it more impressive while remaining truthful to the original experience.
        """
        
        return prompt
    
    def _identify_improvements(self, original_cv: str, improved_cv: str) -> List[str]:
        """Identify specific improvements made"""
        
        improvements = []
        
        # Check for grammar improvements
        if len(improved_cv) > len(original_cv) * 1.1:
            improvements.append("Enhanced descriptions with more detail")
        
        # Check for action verbs
        action_verbs = ['led', 'developed', 'implemented', 'achieved', 'created', 'managed', 'improved', 'reduced', 'increased']
        original_action_count = sum(1 for verb in action_verbs if verb in original_cv.lower())
        improved_action_count = sum(1 for verb in action_verbs if verb in improved_cv.lower())
        
        if improved_action_count > original_action_count:
            improvements.append("Added more action verbs for impact")
        
        # Check for quantifiable results
        if any(char.isdigit() and ('%' in improved_cv or '$' in improved_cv or 'increased' in improved_cv.lower() or 'reduced' in improved_cv.lower()) for char in improved_cv):
            improvements.append("Added quantifiable achievements and metrics")
        
        # Check for formatting improvements
        if '###' in improved_cv or '##' in improved_cv:
            improvements.append("Improved formatting and structure")
        
        # Check for professional summary
        if 'summary' in improved_cv.lower() and 'summary' not in original_cv.lower():
            improvements.append("Added professional summary")
        
        if not improvements:
            improvements.append("General CV enhancement and refinement")
        
        return improvements
    
    def _suggest_missing_skills(self, request: CVImproverRequest) -> List[str]:
        """Suggest missing skills based on target role"""
        
        if not request.target_role:
            return []
        
        prompt = f"""
        Based on the target role "{request.target_role}" and the current CV, suggest 5-7 relevant skills that might be missing.
        
        CURRENT CV:
        {request.cv_text[:500]}...
        
        TARGET ROLE: {request.target_role}
        
        Suggest skills that would make the candidate stronger for this role.
        Focus on both technical and soft skills.
        
        OUTPUT FORMAT:
        Return a JSON array of skills:
        ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
        """
        
        try:
            ai_response = self.gemini_client.generate_content(prompt)
            skills = json.loads(ai_response)
            return skills
        except Exception as e:
            logger.error(f"Skill suggestion failed: {str(e)}")
            return ["Communication skills", "Project management", "Technical writing"]
    
    def _identify_grammar_fixes(self, original_cv: str, improved_cv: str) -> List[str]:
        """Identify grammar corrections made"""
        
        corrections = []
        
        # Simple grammar checks
        common_errors = [
            (' i ', ' I '),  # Capitalize standalone 'i'
            ('dont', "don't"),
            ('wont', "won't"),
            ('cant', "can't"),
            ('didnt', "didn't"),
            ('doesnt', "doesn't"),
            ('isnt', "isn't"),
            ('arent', "aren't"),
        ]
        
        for error, correction in common_errors:
            if error in original_cv.lower() and correction not in improved_cv:
                corrections.append(f"Fixed capitalization and contractions")
        
        # Check for sentence structure
        if improved_cv.count('.') > original_cv.count('.'):
            corrections.append("Improved sentence structure")
        
        # Check for punctuation
        if improved_cv.count(',') > original_cv.count(','):
            corrections.append("Added proper punctuation")
        
        if not corrections:
            corrections.append("Grammar and punctuation review")
        
        return corrections[:3]  # Limit to top 3 corrections
    
    def _identify_impact_additions(self, original_cv: str, improved_cv: str) -> List[str]:
        """Identify impact statements added"""
        
        impact_additions = []
        
        # Look for impact indicators
        impact_patterns = [
            r'\d+%.*?(?:increase|decrease|reduction|growth)',
            r'\$\d+.*?(?:saved|generated|managed|budget)',
            r'\d+.*?(?:hours|days|weeks).*?(?:saved|reduced)',
            r'(?:increased|decreased|reduced|improved|enhanced|optimized).*?\d+%',
            r'(?:led|managed|directed|supervised).*?\d+.*?(?:people|team|members)',
        ]
        
        for pattern in impact_patterns:
            matches = re.findall(pattern, improved_cv, re.IGNORECASE)
            if matches:
                impact_additions.append(f"Added quantifiable impact: {matches[0][:50]}...")
        
        # Check for action verbs with results
        action_results = re.findall(r'(?:achieved|accomplished|delivered|completed|successfully).*?[.!?]', improved_cv, re.IGNORECASE)
        if action_results:
            impact_additions.append("Added achievement-focused statements")
        
        if not impact_additions:
            impact_additions.append("Enhanced descriptions with impact focus")
        
        return impact_additions[:3]  # Limit to top 3 additions
