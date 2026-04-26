import { CVData, CVParser } from './cvParser';

export interface DemoAIResponse {
  type: 'resume_analysis' | 'career_recommendations' | 'skill_gap' | 'course_recommendations' | 'chat';
  data: any;
}

export class DemoAI {
  private static readonly RESPONSE_VARIATIONS = {
    greetings: [
      "Based on your CV analysis, ",
      "Looking at your background, ",
      "From your resume, I can see that ",
      "Your profile shows that ",
      "Considering your experience, "
    ],
    transitions: [
      "Additionally, ",
      "Furthermore, ",
      "It's worth noting that ",
      "I also notice that ",
      "Another key point is "
    ],
    conclusions: [
      "This positions you well for ",
      "This opens up opportunities in ",
      "You're well-suited for ",
      "This aligns with roles like ",
      "This background supports careers in "
    ]
  };

  private static readonly CAREER_PATHS = {
    'Frontend': [
      { title: 'Frontend Developer', matchSkills: ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS'] },
      { title: 'Full Stack Developer', matchSkills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS'] },
      { title: 'UI/UX Developer', matchSkills: ['React', 'Vue', 'Figma', 'HTML', 'CSS', 'JavaScript'] },
      { title: 'Frontend Architect', matchSkills: ['React', 'Angular', 'TypeScript', 'Webpack', 'JavaScript'] }
    ],
    'Backend': [
      { title: 'Backend Developer', matchSkills: ['Node.js', 'Python', 'Java', 'SQL', 'API', 'REST'] },
      { title: 'Full Stack Developer', matchSkills: ['Node.js', 'React', 'JavaScript', 'SQL', 'API'] },
      { title: 'API Developer', matchSkills: ['REST', 'GraphQL', 'Node.js', 'Python', 'API'] },
      { title: 'Backend Architect', matchSkills: ['Node.js', 'Microservices', 'SQL', 'NoSQL', 'Architecture'] }
    ],
    'Data': [
      { title: 'Data Scientist', matchSkills: ['Python', 'Machine Learning', 'R', 'Statistics', 'SQL'] },
      { title: 'Data Analyst', matchSkills: ['SQL', 'Python', 'Analytics', 'Excel', 'Tableau'] },
      { title: 'ML Engineer', matchSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL'] }
    ],
    'DevOps': [
      { title: 'DevOps Engineer', matchSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'] },
      { title: 'Cloud Engineer', matchSkills: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes'] },
      { title: 'Site Reliability Engineer', matchSkills: ['Kubernetes', 'Linux', 'Python', 'Monitoring', 'AWS'] }
    ]
  };

  private static readonly COURSE_DATABASE = [
    // Frontend Courses
    {
      title: 'Advanced React Patterns',
      provider: 'Udemy',
      description: 'Master advanced React patterns and performance optimization',
      duration: '8 hours',
      difficulty: 'advanced',
      rating: 4.7,
      price: 89.99,
      url: 'https://udemy.com/advanced-react',
      skills: ['React', 'JavaScript', 'Performance']
    },
    {
      title: 'Complete Vue Developer',
      provider: 'Udemy',
      description: 'Build modern web applications with Vue 3',
      duration: '12 hours',
      difficulty: 'intermediate',
      rating: 4.6,
      price: 79.99,
      url: 'https://udemy.com/vue-developer',
      skills: ['Vue', 'JavaScript', 'Frontend']
    },
    
    // Backend Courses
    {
      title: 'Node.js Microservices',
      provider: 'Coursera',
      description: 'Build scalable microservices with Node.js',
      duration: '6 weeks',
      difficulty: 'advanced',
      rating: 4.5,
      price: 49.99,
      url: 'https://coursera.org/node-microservices',
      skills: ['Node.js', 'Microservices', 'Backend']
    },
    {
      title: 'Python Django Masterclass',
      provider: 'Udemy',
      description: 'Build production-ready Django applications',
      duration: '15 hours',
      difficulty: 'intermediate',
      rating: 4.8,
      price: 94.99,
      url: 'https://udemy.com/django-masterclass',
      skills: ['Python', 'Django', 'Backend']
    },

    // Data Courses
    {
      title: 'Machine Learning A-Z',
      provider: 'Udemy',
      description: 'Complete machine learning bootcamp',
      duration: '44 hours',
      difficulty: 'intermediate',
      rating: 4.7,
      price: 89.99,
      url: 'https://udemy.com/machine-learning',
      skills: ['Machine Learning', 'Python', 'Data Science']
    },

    // DevOps Courses
    {
      title: 'Docker & Kubernetes Complete Guide',
      provider: 'Udemy',
      description: 'Master containerization and orchestration',
      duration: '24 hours',
      difficulty: 'intermediate',
      rating: 4.6,
      price: 84.99,
      url: 'https://udemy.com/docker-kubernetes',
      skills: ['Docker', 'Kubernetes', 'DevOps']
    },
    {
      title: 'AWS Solutions Architect',
      provider: 'AWS Training',
      description: 'Prepare for AWS certification',
      duration: '40 hours',
      difficulty: 'advanced',
      rating: 4.7,
      price: 149.99,
      url: 'https://aws.training/architect',
      skills: ['AWS', 'Cloud', 'DevOps']
    }
  ];

  static async generateResponse(prompt: string, cvData: CVData): Promise<string> {
    // Add human-like delay
    await this.simulateProcessingDelay();
    
    console.log('🤖 DEMO AI generating response based on CV content...');
    
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('analyze resume') || lowerPrompt.includes('analyze the following resume')) {
      return this.generateResumeAnalysis(cvData);
    }
    
    if (lowerPrompt.includes('career recommendations') || lowerPrompt.includes('career paths')) {
      return this.generateCareerRecommendations(cvData);
    }
    
    if (lowerPrompt.includes('skill gap')) {
      return this.generateSkillGapAnalysis(cvData, prompt);
    }
    
    if (lowerPrompt.includes('recommend courses') || lowerPrompt.includes('course recommendations')) {
      return this.generateCourseRecommendations(cvData);
    }
    
    // Default chat response
    return this.generateChatResponse(prompt, cvData);
  }

  private static async simulateProcessingDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 500) + 300; // 300-800ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private static generateResumeAnalysis(cvData: CVData): string {
    const totalYears = cvData.experience.reduce((sum, exp) => sum + (exp.years || 0), 0);
    const experienceLevel = CVParser.getExperienceLevel(totalYears);
    const skillCategories = CVParser.getSkillCategories(cvData.skills);
    
    const greeting = this.getRandomElement(this.RESPONSE_VARIATIONS.greetings);
    const conclusion = this.getRandomElement(this.RESPONSE_VARIATIONS.conclusions);
    
    const analysis = {
      skills: cvData.skills.map(skill => ({
        name: skill,
        category: this.getSkillCategory(skill),
        proficiency: this.calculateProficiency(skill, cvData),
        yearsExperience: Math.floor(Math.random() * 3) + 1
      })),
      experience: {
        years: totalYears,
        level: experienceLevel
      },
      education: cvData.education.length > 0 ? cvData.education : [{
        degree: "Bachelor's Degree",
        field: this.inferFieldFromSkills(cvData.skills),
        institution: "University"
      }],
      recommendations: {
        careerPaths: this.generateCareerPaths(cvData.skills, totalYears),
        skillGaps: this.generateSkillGaps(cvData.skills),
        courses: this.relevantCourses(cvData.skills).slice(0, 3)
      }
    };

    return JSON.stringify(analysis, null, 2);
  }

  private static generateCareerRecommendations(cvData: CVData): string {
    const totalYears = cvData.experience.reduce((sum, exp) => sum + (exp.years || 0), 0);
    const careerPaths = this.generateCareerPaths(cvData.skills, totalYears);
    
    const recommendations = careerPaths.map((path, index) => ({
      id: `career_${index + 1}`,
      title: path.title,
      description: this.generateCareerDescription(path.title, cvData.skills),
      requiredSkills: path.requiredSkills,
      averageSalary: this.calculateSalary(path.title, totalYears),
      growthRate: Math.floor(Math.random() * 15) + 8,
      matchScore: path.matchScore
    }));

    return JSON.stringify(recommendations, null, 2);
  }

  private static generateSkillGapAnalysis(cvData: CVData, prompt: string): string {
    // Extract target role from prompt
    const targetRoleMatch = prompt.match(/target role[:\s]+([A-Za-z\s]+)/i);
    const targetRole = targetRoleMatch ? targetRoleMatch[1].trim() : 'Software Developer';
    
    const requiredSkills = this.getRequiredSkillsForRole(targetRole);
    const skillGaps = requiredSkills.map(skill => {
      const hasSkill = cvData.skills.some(cvSkill => 
        cvSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cvSkill.toLowerCase())
      );
      
      return {
        skill: skill,
        currentLevel: hasSkill ? Math.floor(Math.random() * 2) + 3 : 1,
        requiredLevel: 4,
        gap: hasSkill ? 1 : 3,
        importance: this.getImportance(skill, targetRole)
      };
    });

    return JSON.stringify(skillGaps, null, 2);
  }

  private static generateCourseRecommendations(cvData: CVData): string {
    const relevantCourses = this.relevantCourses(cvData.skills);
    
    const recommendations = relevantCourses.slice(0, 5).map((course, index) => ({
      id: `course_${index + 1}`,
      ...course
    }));

    return JSON.stringify(recommendations, null, 2);
  }

  private static generateChatResponse(prompt: string, cvData: CVData): string {
    const lowerPrompt = prompt.toLowerCase();
    const greeting = this.getRandomElement(this.RESPONSE_VARIATIONS.greetings);
    
    // Personalized responses based on CV content
    if (lowerPrompt.includes('skill') || lowerPrompt.includes('skills')) {
      const topSkills = cvData.skills.slice(0, 3).join(', ');
      return `${greeting}you have a strong foundation in ${topSkills}. To enhance your profile further, consider learning complementary technologies. For example, if you know React, learning Node.js would make you a full-stack developer. If you have Python skills, exploring data science libraries like pandas or machine learning frameworks could open new career opportunities.`;
    }
    
    if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
      const experienceYears = cvData.experience.reduce((sum, exp) => sum + (exp.years || 0), 0);
      return `${greeting}with ${experienceYears} years of experience, your resume should highlight quantifiable achievements. Instead of just listing responsibilities, include metrics like "increased performance by 30%" or "reduced bugs by 50%". Your skills in ${cvData.skills.slice(0, 2).join(' and ')} are valuable - make sure they're prominently displayed in your technical skills section.`;
    }
    
    if (lowerPrompt.includes('career') || lowerPrompt.includes('job')) {
      const careerPaths = this.generateCareerPaths(cvData.skills, 2);
      const topPath = careerPaths[0];
      return `${greeting}your skills align well with ${topPath.title} positions. With your background in ${cvData.skills.slice(0, 3).join(', ')}, you're positioned for growth in this field. The market demand for these roles is strong, and professionals with your skillset typically see good career progression. Consider focusing on ${topPath.requiredSkills.slice(0, 2).join(' and ')} to further strengthen your profile.`;
    }
    
    if (lowerPrompt.includes('interview')) {
      return `${greeting}prepare for interviews by practicing explanations of projects that showcase your ${cvData.skills.slice(0, 2).join(' and ')} skills. Be ready to discuss specific challenges you've overcome and the impact of your work. Research common interview questions for your target roles and practice the STAR method (Situation, Task, Action, Result) for behavioral questions.`;
    }
    
    return `${greeting}I can help you with career guidance based on your background in ${cvData.skills.slice(0, 3).join(', ')}. Whether you're looking to improve your resume, prepare for interviews, or explore new career paths, I can provide personalized advice. What specific aspect would you like to focus on?`;
  }

  private static generateCareerPaths(skills: string[], years: number): any[] {
    const paths: any[] = [];
    
    // Determine primary skill category
    const skillCategories = CVParser.getSkillCategories(skills);
    const primaryCategory = this.getPrimaryCategory(skillCategories);
    
    const relevantPaths = this.CAREER_PATHS[primaryCategory as keyof typeof this.CAREER_PATHS] || 
                          this.CAREER_PATHS['Frontend'];
    
    relevantPaths.forEach(path => {
      const matchScore = this.calculateMatchScore(skills, path.matchSkills);
      if (matchScore > 0.3) {
        paths.push({
          title: path.title,
          description: this.generateCareerDescription(path.title, skills),
          requiredSkills: path.matchSkills,
          averageSalary: this.calculateSalary(path.title, years),
          growthRate: Math.floor(Math.random() * 15) + 8,
          matchScore: matchScore
        });
      }
    });
    
    return paths.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  private static generateCareerDescription(title: string, skills: string[]): string {
    const descriptions: { [key: string]: string } = {
      'Frontend Developer': `Build responsive, interactive user interfaces using modern frameworks. Your skills in ${skills.slice(0, 2).join(' and ')} provide a solid foundation for this role.`,
      'Full Stack Developer': `Develop end-to-end web applications, handling both frontend and backend. Your ${skills.length}+ skills position you well for this versatile role.`,
      'Backend Developer': `Design and implement server-side applications, APIs, and databases. Your technical background supports the complex problem-solving required.`,
      'Data Scientist': `Analyze complex data sets to extract insights and build predictive models. Your analytical skills are valuable in this growing field.`,
      'DevOps Engineer': `Automate and optimize software development and deployment processes. Your technical foundation supports the infrastructure and automation focus.`
    };
    
    return descriptions[title] || `Leverage your technical skills to build innovative solutions and drive business value.`;
  }

  private static generateSkillGaps(skills: string[]): any[] {
    const commonGaps = ['TypeScript', 'Cloud Computing', 'Testing', 'Security', 'Agile/Scrum'];
    const gaps = commonGaps.filter(gap => 
      !skills.some(skill => 
        skill.toLowerCase().includes(gap.toLowerCase()) ||
        gap.toLowerCase().includes(skill.toLowerCase())
      )
    ).slice(0, 3);
    
    return gaps.map(gap => ({
      skill: gap,
      currentLevel: 1,
      requiredLevel: 3,
      gap: 2,
      importance: Math.random() > 0.5 ? 'high' : 'medium'
    }));
  }

  private static relevantCourses(skills: string[]): any[] {
    return this.COURSE_DATABASE.filter(course => 
      course.skills.some(courseSkill => 
        skills.some(userSkill => 
          userSkill.toLowerCase().includes(courseSkill.toLowerCase()) ||
          courseSkill.toLowerCase().includes(userSkill.toLowerCase())
        )
      )
    ).sort(() => Math.random() - 0.5);
  }

  private static calculateMatchScore(userSkills: string[], requiredSkills: string[]): number {
    if (userSkills.length === 0) return 0.3;
    
    const matchingSkills = userSkills.filter(skill => 
      requiredSkills.some(req => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return Math.min(matchingSkills.length / requiredSkills.length, 1.0);
  }

  private static calculateSalary(title: string, years: number): number {
    const baseSalaries: { [key: string]: number } = {
      'Frontend Developer': 85000,
      'Full Stack Developer': 95000,
      'Backend Developer': 90000,
      'Data Scientist': 110000,
      'DevOps Engineer': 105000,
      'UI/UX Developer': 80000,
      'Frontend Architect': 120000,
      'API Developer': 95000,
      'Backend Architect': 125000,
      'Data Analyst': 75000,
      'ML Engineer': 120000,
      'Cloud Engineer': 115000,
      'Site Reliability Engineer': 110000
    };
    
    const base = baseSalaries[title] || 85000;
    const experienceMultiplier = 1 + (years * 0.08); // 8% per year
    return Math.floor(base * experienceMultiplier);
  }

  private static getSkillCategory(skill: string): string {
    const categories = CVParser.getSkillCategories([skill]);
    return Object.keys(categories).find(key => categories[key].length > 0) || 'Other';
  }

  private static calculateProficiency(skill: string, cvData: CVData): number {
    // Simulate proficiency based on skill popularity and CV content
    const baseProficiency = Math.floor(Math.random() * 2) + 3; // 3-4
    return Math.min(baseProficiency, 5);
  }

  private static inferFieldFromSkills(skills: string[]): string {
    if (skills.some(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('data'))) {
      return 'Computer Science / Data Science';
    }
    if (skills.some(s => s.toLowerCase().includes('web') || s.toLowerCase().includes('react'))) {
      return 'Computer Science / Web Development';
    }
    return 'Computer Science';
  }

  private static getPrimaryCategory(categories: { [category: string]: string[] }): string {
    let maxCount = 0;
    let primaryCategory = 'Frontend';
    
    Object.entries(categories).forEach(([category, skills]) => {
      if (skills.length > maxCount) {
        maxCount = skills.length;
        primaryCategory = category;
      }
    });
    
    return primaryCategory;
  }

  private static getRequiredSkillsForRole(role: string): string[] {
    const roleSkills: { [key: string]: string[] } = {
      'Software Developer': ['JavaScript', 'React', 'Node.js', 'Git', 'SQL'],
      'Frontend Developer': ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
      'Backend Developer': ['Node.js', 'Python', 'SQL', 'API', 'Docker'],
      'Full Stack Developer': ['React', 'Node.js', 'JavaScript', 'SQL', 'Git'],
      'Data Scientist': ['Python', 'Machine Learning', 'Statistics', 'SQL', 'R']
    };
    
    return roleSkills[role] || roleSkills['Software Developer'];
  }

  private static getImportance(skill: string, role: string): string {
    const highImportanceSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'];
    return highImportanceSkills.includes(skill) ? 'high' : 'medium';
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
