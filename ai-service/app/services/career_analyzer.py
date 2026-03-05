from typing import List, Dict, Any
from app.schemas.resume import Skill, SkillGap, CareerPath, Course, Recommendation
import random

class CareerAnalyzer:
    def __init__(self):
        # Career paths database
        self.career_paths_db = [
            {
                "id": "1",
                "title": "Senior Software Engineer",
                "description": "Lead development of complex software systems and mentor junior developers",
                "required_skills": ["JavaScript", "React", "Node.js", "System Design", "AWS"],
                "average_salary": 120000,
                "growth_rate": 15
            },
            {
                "id": "2", 
                "title": "Full Stack Developer",
                "description": "Develop both frontend and backend applications",
                "required_skills": ["JavaScript", "React", "Node.js", "Database", "Git"],
                "average_salary": 95000,
                "growth_rate": 12
            },
            {
                "id": "3",
                "title": "DevOps Engineer",
                "description": "Manage deployment pipelines and infrastructure",
                "required_skills": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
                "average_salary": 110000,
                "growth_rate": 18
            },
            {
                "id": "4",
                "title": "Data Scientist",
                "description": "Analyze complex data and build machine learning models",
                "required_skills": ["Python", "Machine Learning", "Statistics", "SQL", "TensorFlow"],
                "average_salary": 115000,
                "growth_rate": 20
            },
            {
                "id": "5",
                "title": "Product Manager",
                "description": "Lead product strategy and development",
                "required_skills": ["Product Strategy", "Agile", "Communication", "Analytics", "Leadership"],
                "average_salary": 105000,
                "growth_rate": 14
            }
        ]
        
        # Courses database
        self.courses_db = [
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
            },
            {
                "id": "3",
                "title": "AWS Cloud Practitioner",
                "provider": "A Cloud Guru",
                "description": "Complete AWS certification preparation course",
                "duration": "30 hours", 
                "difficulty": "beginner",
                "rating": 4.6,
                "price": 99.99,
                "url": "https://acloud.guru/aws-practitioner",
                "skills": ["AWS", "Cloud Computing", "DevOps"]
            },
            {
                "id": "4",
                "title": "Machine Learning A-Z",
                "provider": "Udemy",
                "description": "Comprehensive machine learning course",
                "duration": "40 hours",
                "difficulty": "intermediate",
                "rating": 4.4,
                "price": 94.99,
                "url": "https://udemy.com/machine-learning",
                "skills": ["Machine Learning", "Python", "TensorFlow", "Data Science"]
            }
        ]
    
    def calculate_skill_match(self, user_skills: List[Skill], required_skills: List[str]) -> float:
        """Calculate percentage of required skills that user has"""
        user_skill_names = [skill.name.lower() for skill in user_skills]
        required_skill_names = [skill.lower() for skill in required_skills]
        
        matches = sum(1 for skill in required_skill_names if skill in user_skill_names)
        return (matches / len(required_skills)) * 100 if required_skills else 0
    
    def get_career_recommendations(self, user_skills: List[Skill], experience_years: int) -> List[CareerPath]:
        """Get career path recommendations based on user skills"""
        recommendations = []
        
        for career in self.career_paths_db:
            # Calculate match score based on skills
            skill_match = self.calculate_skill_match(user_skills, career["required_skills"])
            
            # Adjust score based on experience level
            experience_bonus = min(20, experience_years * 2)
            
            # Calculate final match score
            match_score = min(100, skill_match + experience_bonus + random.uniform(-5, 5))
            
            recommendations.append(CareerPath(
                id=career["id"],
                title=career["title"],
                description=career["description"],
                required_skills=career["required_skills"],
                average_salary=career["average_salary"],
                growth_rate=career["growth_rate"],
                match_score=round(match_score, 1)
            ))
        
        # Sort by match score and return top recommendations
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:3]
    
    def analyze_skill_gaps(self, user_skills: List[Skill], target_career: CareerPath) -> List[SkillGap]:
        """Analyze skill gaps for a target career path"""
        gaps = []
        user_skill_names = [skill.name.lower() for skill in user_skills]
        
        for required_skill in target_career.required_skills:
            # Find if user has this skill
            user_skill = next(
                (skill for skill in user_skills if skill.name.lower() == required_skill.lower()),
                None
            )
            
            if user_skill:
                current_level = user_skill.proficiency
                required_level = 4  # Target proficiency level
                gap = max(0, required_level - current_level)
                
                if gap > 0:
                    importance = "high" if required_skill in ["System Design", "AWS", "Kubernetes"] else "medium"
            else:
                current_level = 0
                required_level = 4
                gap = 4
                importance = "high" if required_skill in ["System Design", "AWS", "Kubernetes"] else "medium"
            
            gaps.append(SkillGap(
                skill=required_skill,
                current_level=current_level,
                required_level=required_level,
                gap=gap,
                importance=importance
            ))
        
        # Sort by importance and gap size
        gaps.sort(key=lambda x: (x.importance != "high", -x.gap))
        return gaps[:5]  # Return top 5 skill gaps
    
    def get_course_recommendations(self, skill_gaps: List[SkillGap]) -> List[Course]:
        """Get course recommendations based on skill gaps"""
        recommendations = []
        gap_skills = [gap.skill.lower() for gap in skill_gaps]
        
        for course in self.courses_db:
            # Check if course covers any of the gap skills
            course_skills_lower = [skill.lower() for skill in course["skills"]]
            overlap = set(gap_skills) & set(course_skills_lower)
            
            if overlap:
                # Calculate relevance score
                relevance_score = len(overlap) / len(course["skills"])
                
                recommendations.append(Course(
                    id=course["id"],
                    title=course["title"],
                    provider=course["provider"],
                    description=course["description"],
                    duration=course["duration"],
                    difficulty=course["difficulty"],
                    rating=course["rating"],
                    price=course["price"],
                    url=course["url"],
                    skills=course["skills"]
                ))
        
        # Sort by rating and relevance
        recommendations.sort(key=lambda x: (x.rating, len(x.skills)), reverse=True)
        return recommendations[:3]
    
    def generate_recommendations(self, user_skills: List[Skill], experience_years: int) -> Recommendation:
        """Generate comprehensive career recommendations"""
        # Get career path recommendations
        career_paths = self.get_career_recommendations(user_skills, experience_years)
        
        # Analyze skill gaps for top career path
        target_career = career_paths[0] if career_paths else None
        skill_gaps = []
        if target_career:
            skill_gaps = self.analyze_skill_gaps(user_skills, target_career)
        
        # Get course recommendations
        courses = self.get_course_recommendations(skill_gaps)
        
        return Recommendation(
            career_paths=career_paths,
            skill_gaps=skill_gaps,
            courses=courses
        )
