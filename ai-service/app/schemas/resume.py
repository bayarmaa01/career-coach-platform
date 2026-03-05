from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Skill(BaseModel):
    name: str
    category: str
    proficiency: int
    years_experience: Optional[int] = None

class Experience(BaseModel):
    years: int
    level: str

class Education(BaseModel):
    degree: str
    field: str
    institution: str

class SkillGap(BaseModel):
    skill: str
    current_level: int
    required_level: int
    gap: int
    importance: str  # 'high', 'medium', 'low'

class CareerPath(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[str]
    average_salary: int
    growth_rate: int
    match_score: int

class Course(BaseModel):
    id: str
    title: str
    provider: str
    description: str
    duration: str
    difficulty: str  # 'beginner', 'intermediate', 'advanced'
    rating: float
    price: float
    url: str
    skills: List[str]

class Recommendation(BaseModel):
    career_paths: List[CareerPath]
    skill_gaps: List[SkillGap]
    courses: List[Course]

class ResumeAnalysis(BaseModel):
    skills: List[Skill]
    experience: Experience
    education: List[Education]
    recommendations: Recommendation

class ResumeAnalysisRequest(BaseModel):
    resume_id: str
    file_path: str

class ResumeAnalysisResponse(BaseModel):
    resume_id: str
    status: str
    analysis: Optional[ResumeAnalysis] = None
    message: Optional[str] = None
