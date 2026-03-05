import re
from typing import List, Dict, Any, Optional
from pathlib import Path
import os

from app.schemas.resume import Skill, Experience, Education

class SimpleResumeProcessor:
    """Simplified resume processor for Windows compatibility without heavy ML dependencies"""
    
    def __init__(self):
        # Common tech skills keywords
        self.tech_skills = {
            'Programming': ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin'],
            'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'webpack'],
            'Backend': ['node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'fastapi', 'nest.js'],
            'Database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite'],
            'Cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd'],
            'Mobile': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'xamarin'],
            'Data Science': ['machine learning', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn'],
            'DevOps': ['linux', 'git', 'github', 'gitlab', 'ci/cd', 'microservices', 'agile', 'scrum']
        }
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            print("pdfplumber not available. Using fallback text extraction.")
            return self._fallback_text_extraction(file_path)
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            import docx
            text = ""
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except ImportError:
            print("python-docx not available. Using fallback text extraction.")
            return self._fallback_text_extraction(file_path)
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            return ""
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            print(f"Error extracting TXT: {e}")
            return ""
    
    def _fallback_text_extraction(self, file_path: str) -> str:
        """Fallback text extraction when libraries aren't available"""
        return f"Resume file: {Path(file_path).name} (Text extraction not available)"
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        file_extension = Path(file_path).suffix.lower()
        
        if file_extension == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_extension in ['.doc', '.docx']:
            return self.extract_text_from_docx(file_path)
        elif file_extension == '.txt':
            return self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def extract_skills(self, text: str) -> List[Skill]:
        """Extract skills from resume text using keyword matching"""
        found_skills = []
        text_lower = text.lower()
        
        for category, skills in self.tech_skills.items():
            for skill in skills:
                # Count occurrences of skill
                count = len(re.findall(r'\b' + re.escape(skill) + r'\b', text_lower))
                if count > 0:
                    # Estimate proficiency based on mentions
                    proficiency = min(5, max(1, count))
                    
                    # Try to extract years of experience
                    years_exp = self._extract_years_of_experience(text_lower, skill)
                    
                    found_skills.append(Skill(
                        name=skill.title(),
                        category=category,
                        proficiency=proficiency,
                        years_experience=years_exp
                    ))
        
        return found_skills
    
    def _extract_years_of_experience(self, text: str, skill: str) -> Optional[int]:
        """Extract years of experience for a specific skill"""
        patterns = [
            rf'{skill}.*?(\d+)\s*years?',
            rf'(\d+)\s*years?.*?{skill}',
            rf'{skill}.*?(\d+)\s*\+?\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        return None
    
    def extract_experience(self, text: str) -> Experience:
        """Extract total years of experience"""
        # Look for patterns like "X years of experience"
        patterns = [
            r'(\d+)\s*\+?\s*years?\s*(?:of\s*)?experience',
            r'experience\s*:\s*(\d+)\s*\+?\s*years?',
            r'total\s*experience\s*:\s*(\d+)\s*\+?\s*years?'
        ]
        
        total_years = 0
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                years = int(match)
                if years > total_years:
                    total_years = years
        
        # Determine experience level
        if total_years >= 8:
            level = "Senior"
        elif total_years >= 4:
            level = "Mid-level"
        elif total_years >= 2:
            level = "Junior"
        else:
            level = "Entry-level"
        
        return Experience(years=total_years, level=level)
    
    def extract_education(self, text: str) -> List[Education]:
        """Extract education information"""
        education_patterns = [
            r'(bachelor|master|phd|doctorate|associate|b\.s\.|m\.s\.|ph\.d\.).*?in\s*([^.]+)',
            r'(university|college|institute).*?([^.]+)',
            r'degree\s*in\s*([^.]+)'
        ]
        
        education = []
        seen = set()
        
        for pattern in education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    degree, field = match
                else:
                    degree = "Degree"
                    field = match
                
                # Clean up text
                degree = degree.strip().title()
                field = field.strip().title()
                
                # Create a unique key to avoid duplicates
                key = f"{degree}_{field}"
                if key not in seen:
                    education.append(Education(
                        degree=degree,
                        field=field,
                        institution="University"  # Generic placeholder
                    ))
                    seen.add(key)
        
        return education[:3]  # Limit to top 3 education entries
    
    def process_resume(self, file_path: str) -> Dict[str, Any]:
        """Process resume and extract all information"""
        try:
            # Extract text
            text = self.extract_text(file_path)
            
            if not text.strip():
                raise ValueError("No text could be extracted from resume")
            
            # Extract information
            skills = self.extract_skills(text)
            experience = self.extract_experience(text)
            education = self.extract_education(text)
            
            return {
                "skills": [skill.dict() for skill in skills],
                "experience": experience.dict(),
                "education": [edu.dict() for edu in education],
                "raw_text": text
            }
            
        except Exception as e:
            print(f"Error processing resume: {e}")
            raise e
