/**
 * Demo AI Service - Frontend-only demo implementation
 * Provides realistic AI responses for demo purposes
 */

interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  suggestions?: string[];
}

interface CareerRecommendation {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  averageSalary: number;
  growthRate: number;
  matchScore: number;
}

interface ResumeAnalysis {
  skills: Array<{
    name: string;
    category: string;
    proficiency: number;
    yearsExperience: number;
  }>;
  experience: {
    years: number;
    level: string;
  };
  education: Array<{
    degree: string;
    field: string;
    institution: string;
  }>;
  recommendations: {
    careerPaths: CareerRecommendation[];
    skillGaps: Array<{
      skill: string;
      currentLevel: number;
      requiredLevel: number;
      gap: number;
      importance: string;
    }>;
    courses: Array<{
      title: string;
      provider: string;
      description: string;
      duration: string;
      difficulty: string;
      rating: number;
      price: number;
      url: string;
      skills: string[];
    }>;
  };
}

export const demoAiService = {
  // Simulate AI chat responses
  chat: async (message: string, userProfile?: any): Promise<ChatResponse> => {
    // Add artificial delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const lowerMessage = message.toLowerCase();
    
    // Generate contextual responses based on message content
    if (lowerMessage.includes('frontend') || lowerMessage.includes('backend')) {
      return {
        success: true,
        response: `Great question! Frontend development focuses on user interfaces and user experience using technologies like HTML, CSS, JavaScript, React, Vue, or Angular. Backend development handles server-side logic, databases, and APIs using technologies like Node.js, Python, Java, or C#.\n\nFrontend developers work with what users see and interact with, while backend developers build the underlying systems that power applications. Full-stack developers work with both!\n\nBased on your interest, I'd recommend exploring React for frontend or Node.js for backend as they're both in high demand.`,
        conversation_id: `demo_conv_${Date.now()}`,
        suggestions: [
          "What skills do I need for frontend development?",
          "Tell me about backend development",
          "What's the difference between full-stack and specialized roles?"
        ]
      };
    }

    if (lowerMessage.includes('skill') || lowerMessage.includes('skills')) {
      return {
        success: true,
        response: `Based on your profile, I can see you have a foundation in web development. To strengthen your skillset, consider focusing on:\n\n**Technical Skills:**\n- JavaScript/TypeScript (essential for modern web dev)\n- React or Vue.js (popular frontend frameworks)\n- Node.js or Python (backend development)\n- SQL/NoSQL databases\n\n**Soft Skills:**\n- Problem-solving and critical thinking\n- Communication and teamwork\n- Project management\n\nI'd recommend starting with one frontend framework and one backend technology to build full-stack capabilities. Would you like specific learning resources for any of these?`,
        conversation_id: `demo_conv_${Date.now()}`,
        suggestions: [
          "What's the best way to learn React?",
          "Should I focus on frontend or backend first?",
          "Tell me about database skills"
        ]
      };
    }

    if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
      return {
        success: true,
        response: `Your background aligns well with several high-growth career paths:\n\n**Top Recommendations:**
1. **Full Stack Developer** - Average salary: $95K-120K, 15% growth
2. **Frontend Developer** - Average salary: $85K-110K, 12% growth  
3. **Backend Developer** - Average salary: $90K-115K, 14% growth\n\n**Next Steps:**
- Build 2-3 portfolio projects showcasing your skills
- Get familiar with cloud platforms (AWS, Azure)
- Consider contributing to open-source projects\n\nThe job market is strong for developers with your skillset. Focus on building practical experience and you'll have excellent opportunities!`,
        conversation_id: `demo_conv_${Date.now()}`,
        suggestions: [
          "How do I build a strong portfolio?",
          "What certifications are valuable?",
          "Tell me about remote work opportunities"
        ]
      };
    }

    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      return {
        success: true,
        response: `Your resume should highlight your technical skills and practical experience. Here are key improvements:\n\n**Structure:**
- Clear summary at the top (2-3 sentences)
- Technical skills section with specific technologies
- Project experience with quantifiable results\n\n**Content Tips:**
- Use action verbs: "Built," "Developed," "Implemented"
- Include metrics: "Improved performance by 30%"
- List specific technologies used\n\n**What to Include:**
- GitHub profile with active projects
- LinkedIn profile
- Any certifications or online courses\n\nWould you like me to review specific sections of your resume or help you craft project descriptions?`,
        conversation_id: `demo_conv_${Date.now()}`,
        suggestions: [
          "Help me write a project description",
          "What technical skills should I highlight?",
          "How do I show impact on my resume?"
        ]
      };
    }

    // Default response
    return {
      success: true,
      response: `I'm here to help with your career development! I can assist with:\n\n🎯 **Career Guidance** - Explore different tech career paths\n📝 **Resume Help** - Improve your CV and cover letters\n💻 **Skill Development** - Identify skills to learn and grow\n🚀 **Interview Prep** - Practice common technical questions\n📊 **Industry Insights** - Understand job market trends\n\nWhat specific area would you like to focus on today? Feel free to ask about career paths, skill recommendations, or resume advice!`,
      conversation_id: `demo_conv_${Date.now()}`,
      suggestions: [
        "Tell me about career paths in tech",
        "What skills should I learn?",
        "How can I improve my resume?"
      ]
    };
  },

  // Simulate career recommendations
  getCareerRecommendations: async (): Promise<CareerRecommendation[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      {
        id: "1",
        title: "Full Stack Developer",
        description: "Build end-to-end web applications, handling both frontend and backend development. Perfect for developers who enjoy working with the complete technology stack.",
        requiredSkills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
        averageSalary: 95000,
        growthRate: 15,
        matchScore: 85
      },
      {
        id: "2", 
        title: "Frontend Developer",
        description: "Create responsive, interactive user interfaces and user experiences. Focus on what users see and interact with in web applications.",
        requiredSkills: ["React", "JavaScript", "HTML", "CSS", "TypeScript"],
        averageSalary: 85000,
        growthRate: 12,
        matchScore: 78
      },
      {
        id: "3",
        title: "Backend Developer", 
        description: "Design and implement server-side applications, APIs, and databases. Work on the underlying systems that power applications.",
        requiredSkills: ["Node.js", "Python", "SQL", "API Design", "Docker"],
        averageSalary: 90000,
        growthRate: 14,
        matchScore: 72
      }
    ];
  },

  // Simulate resume analysis
  analyzeResume: async (): Promise<ResumeAnalysis> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      skills: [
        { name: "JavaScript", category: "Programming", proficiency: 4, yearsExperience: 2 },
        { name: "React", category: "Frontend", proficiency: 3, yearsExperience: 1 },
        { name: "Node.js", category: "Backend", proficiency: 3, yearsExperience: 1 },
        { name: "HTML/CSS", category: "Frontend", proficiency: 4, yearsExperience: 2 },
        { name: "SQL", category: "Database", proficiency: 2, yearsExperience: 1 }
      ],
      experience: {
        years: 2,
        level: "Junior"
      },
      education: [
        { degree: "Bachelor of Science", field: "Computer Science", institution: "University" }
      ],
      recommendations: {
        careerPaths: [
          {
            id: "1",
            title: "Full Stack Developer",
            description: "Build end-to-end web applications",
            requiredSkills: ["JavaScript", "React", "Node.js", "SQL"],
            averageSalary: 95000,
            growthRate: 15,
            matchScore: 85
          }
        ],
        skillGaps: [
          { skill: "TypeScript", currentLevel: 1, requiredLevel: 3, gap: 2, importance: "high" },
          { skill: "Cloud Computing", currentLevel: 1, requiredLevel: 3, gap: 2, importance: "medium" },
          { skill: "Testing", currentLevel: 1, requiredLevel: 3, gap: 2, importance: "medium" }
        ],
        courses: [
          {
            title: "TypeScript Fundamentals",
            provider: "Udemy",
            description: "Learn TypeScript from scratch",
            duration: "10 hours",
            difficulty: "beginner",
            rating: 4.5,
            price: 49.99,
            url: "https://udemy.com/typescript",
            skills: ["TypeScript", "JavaScript"]
          }
        ]
      }
    };
  }
};
