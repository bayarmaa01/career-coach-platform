import * as pdfParse from 'pdf-parse';

export interface CVData {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration?: string;
    years?: number;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  rawText: string;
}

export class CVParser {
  private static readonly SKILL_KEYWORDS = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
    'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash', 'PowerShell',
    
    // Frontend Technologies
    'React', 'Vue', 'Angular', 'Next.js', 'Redux', 'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind',
    'Bootstrap', 'jQuery', 'Webpack', 'Vite', 'ESLint', 'Prettier', 'Storybook',
    
    // Backend Technologies
    'Node.js', 'Express', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring', 'Laravel',
    'Rails', 'ASP.NET', 'GraphQL', 'REST', 'API', 'Microservices',
    
    // Databases
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'Cassandra', 'DynamoDB', 'Oracle', 'SQLServer', 'SQLite',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'K8s', 'Terraform',
    'Ansible', 'Jenkins', 'CI/CD', 'GitLab', 'GitHub Actions', 'Vercel', 'Netlify',
    
    // Tools & Frameworks
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Figma',
    'Adobe Creative Suite', 'Microsoft Office', 'Excel', 'PowerPoint', 'Word',
    
    // Data & Analytics
    'Machine Learning', 'Data Science', 'Analytics', 'TensorFlow', 'PyTorch',
    'Scikit-learn', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Looker',
    
    // Soft Skills
    'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum',
    'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management'
  ];

  private static readonly EXPERIENCE_PATTERNS = [
    /(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
    /(\d+)\s*[-+]\s*(\d+)\s*(?:years?|yrs?)/i,
    /(?:experience|worked|served)\s+(?:for|over|more than)\s+(\d+)\s*(?:years?|yrs?)/i
  ];

  private static readonly EDUCATION_KEYWORDS = [
    'Bachelor', 'Master', 'PhD', 'Doctorate', 'Associate', 'Diploma', 'Certificate',
    'University', 'College', 'Institute', 'School', 'Academy',
    'Computer Science', 'Engineering', 'Information Technology', 'Business',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'
  ];

  static async extractFromPDF(buffer: Buffer): Promise<CVData> {
    try {
      const pdfData = await pdfParse(buffer);
      return this.parseText(pdfData.text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  static parseText(text: string): CVData {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    return {
      skills: this.extractSkills(cleanText),
      experience: this.extractExperience(cleanText),
      education: this.extractEducation(cleanText),
      rawText: cleanText
    };
  }

  private static extractSkills(text: string): string[] {
    const foundSkills = new Set<string>();
    const lowerText = text.toLowerCase();

    this.SKILL_KEYWORDS.forEach(skill => {
      // Check for exact word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(skill);
      }
    });

    // Also look for skills section and extract custom skills
    const skillsSection = text.match(/(?:skills|technical skills|technologies|competencies)[\s:]*([^]*?)(?=\n\n|\n[A-Z]|\n[0-9]|\n[a-z]\.|\n•|\n-|$)/i);
    if (skillsSection) {
      const sectionText = skillsSection[1];
      // Extract comma-separated skills and bullet points
      const customSkills = sectionText
        .split(/[,•\n-]/)
        .map(skill => skill.trim().replace(/^[:\s]+/, ''))
        .filter(skill => skill.length > 2 && skill.length < 50);
      
      customSkills.forEach(skill => {
        if (skill && !skill.match(/\d+/)) { // Exclude pure numbers
          foundSkills.add(skill);
        }
      });
    }

    return Array.from(foundSkills).sort();
  }

  private static extractExperience(text: string): Array<{title: string, company: string, duration?: string, years?: number}> {
    const experiences: Array<{title: string, company: string, duration?: string, years?: number}> = [];
    
    // Look for experience section
    const experienceSection = text.match(/(?:experience|work experience|professional experience|employment)[\s:]*([^]*?)(?=\n\n|\n[A-Z]|\n[0-9]|\n[a-z]\.|\nEDUCATION|\nSKILLS|\nEDUCATION|$)/i);
    
    if (experienceSection) {
      const sectionText = experienceSection[1];
      
      // Extract job entries using common patterns
      const jobEntries = sectionText.split(/\n(?=[A-Z][^a-z]*|[A-Z][a-z]+ [A-Z])/);
      
      jobEntries.forEach(entry => {
        const titleMatch = entry.match(/(?:Software Engineer|Developer|Manager|Director|Analyst|Consultant|Specialist|Lead|Senior|Junior|Intern)/i);
        const companyMatch = entry.match(/(?:at|@)\s+([A-Z][A-Za-z\s&]+?)(?:[,|\n]|$)/i);
        const durationMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
        const yearsMatch = entry.match(/(\d+)\s*(?:years?|yrs?)/i);
        
        if (titleMatch) {
          experiences.push({
            title: titleMatch[0],
            company: companyMatch ? companyMatch[1].trim() : 'Company',
            duration: durationMatch ? `${durationMatch[1]} - ${durationMatch[2]}` : undefined,
            years: yearsMatch ? parseInt(yearsMatch[1]) : undefined
          });
        }
      });
    }

    // Calculate total years from text if no specific entries found
    if (experiences.length === 0) {
      const totalYears = this.extractTotalYears(text);
      if (totalYears > 0) {
        experiences.push({
          title: 'Professional',
          company: 'Various',
          years: totalYears
        });
      }
    }

    return experiences;
  }

  private static extractTotalYears(text: string): number {
    for (const pattern of this.EXPERIENCE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return 0;
  }

  private static extractEducation(text: string): Array<{degree: string, institution: string, year?: string}> {
    const education: Array<{degree: string, institution: string, year?: string}> = [];
    
    // Look for education section
    const educationSection = text.match(/(?:education|academic|qualification|degree)[\s:]*([^]*?)(?=\n\n|\n[A-Z]|\n[0-9]|\n[a-z]\.|\nEXPERIENCE|\nSKILLS|$)/i);
    
    if (educationSection) {
      const sectionText = educationSection[1];
      
      // Extract degree information
      const degreeMatch = sectionText.match(/(?:Bachelor|Master|PhD|Doctorate|Associate|Diploma|Certificate)[^,|\n]*/i);
      const institutionMatch = sectionText.match(/(?:University|College|Institute|School)[^,|\n]*/i);
      const yearMatch = sectionText.match(/\b(19|20)\d{2}\b/);
      
      if (degreeMatch || institutionMatch) {
        education.push({
          degree: degreeMatch ? degreeMatch[0].trim() : 'Degree',
          institution: institutionMatch ? institutionMatch[0].trim() : 'Institution',
          year: yearMatch ? yearMatch[0] : undefined
        });
      }
    }

    return education;
  }

  static getExperienceLevel(years: number): string {
    if (years < 1) return 'Entry-level';
    if (years < 3) return 'Junior';
    if (years < 5) return 'Mid-level';
    if (years < 8) return 'Senior';
    return 'Lead/Principal';
  }

  static getSkillCategories(skills: string[]): { [category: string]: string[] } {
    const categories: { [category: string]: string[] } = {
      'Programming': [],
      'Frontend': [],
      'Backend': [],
      'Database': [],
      'Cloud/DevOps': [],
      'Tools': [],
      'Data/Analytics': [],
      'Soft Skills': []
    };

    const categoryMap: { [key: string]: string } = {
      // Programming Languages
      'JavaScript': 'Programming', 'TypeScript': 'Programming', 'Python': 'Programming',
      'Java': 'Programming', 'C#': 'Programming', 'C++': 'Programming', 'Go': 'Programming',
      'Rust': 'Programming', 'PHP': 'Programming', 'Ruby': 'Programming', 'Swift': 'Programming',
      'Kotlin': 'Programming', 'Scala': 'Programming', 'R': 'Programming', 'MATLAB': 'Programming',
      
      // Frontend
      'React': 'Frontend', 'Vue': 'Frontend', 'Angular': 'Frontend', 'Next.js': 'Frontend',
      'Redux': 'Frontend', 'HTML': 'Frontend', 'CSS': 'Frontend', 'SASS': 'Frontend',
      'LESS': 'Frontend', 'Tailwind': 'Frontend', 'Bootstrap': 'Frontend', 'jQuery': 'Frontend',
      
      // Backend
      'Node.js': 'Backend', 'Express': 'Backend', 'NestJS': 'Backend', 'FastAPI': 'Backend',
      'Django': 'Backend', 'Flask': 'Backend', 'Spring': 'Backend', 'Laravel': 'Backend',
      'Rails': 'Backend', 'ASP.NET': 'Backend', 'GraphQL': 'Backend', 'REST': 'Backend',
      
      // Database
      'SQL': 'Database', 'NoSQL': 'Database', 'MongoDB': 'Database', 'PostgreSQL': 'Database',
      'MySQL': 'Database', 'Redis': 'Database', 'Elasticsearch': 'Database',
      
      // Cloud/DevOps
      'AWS': 'Cloud/DevOps', 'Azure': 'Cloud/DevOps', 'Google Cloud': 'Cloud/DevOps',
      'GCP': 'Cloud/DevOps', 'Docker': 'Cloud/DevOps', 'Kubernetes': 'Cloud/DevOps',
      'K8s': 'Cloud/DevOps', 'Terraform': 'Cloud/DevOps', 'Ansible': 'Cloud/DevOps',
      'Jenkins': 'Cloud/DevOps', 'CI/CD': 'Cloud/DevOps',
      
      // Tools
      'Git': 'Tools', 'GitHub': 'Tools', 'GitLab': 'Tools', 'Jira': 'Tools',
      
      // Data/Analytics
      'Machine Learning': 'Data/Analytics', 'Data Science': 'Data/Analytics',
      'Analytics': 'Data/Analytics', 'TensorFlow': 'Data/Analytics',
      
      // Soft Skills
      'Leadership': 'Soft Skills', 'Communication': 'Soft Skills',
      'Project Management': 'Soft Skills', 'Agile': 'Soft Skills', 'Scrum': 'Soft Skills'
    };

    skills.forEach(skill => {
      const category = categoryMap[skill] || 'Tools';
      if (categories[category]) {
        categories[category].push(skill);
      }
    });

    return categories;
  }
}
