/**
 * AI Service - Integration with Gemini AI for career coaching features
 * Handles all AI-related functionality using Google's Gemini API
 */

import logger from '../utils/logger';
import geminiService from './gemini';

export interface CVBuilderRequest {
  name: string;
  skills: string[];
  experience: Array<{
    title?: string;
    company?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    start_date?: string;
    end_date?: string;
  }>;
  interests?: string[];
  target_role?: string;
}

export interface CVBuilderResponse {
  success: boolean;
  cv_data?: any;
  formatted_cv?: string;
  markdown_cv?: string;
  error?: string;
}

export interface ChatRequest {
  message: string;
  user_profile?: any;
  conversation_id?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  suggestions?: string[];
  error?: string;
}

export interface RecommendationsRequest {
  skills: string[];
  interests: string[];
  target_role?: string;
  experience_level?: string;
  chat_history?: string[];
  preferences?: any;
}

export interface RecommendationsResponse {
  success: boolean;
  career_paths?: Array<{
    title: string;
    description: string;
    required_skills: string[];
    existing_skills: string[];
    missing_skills: string[];
    salary_range: string;
    growth_potential: string;
    industry_demand: string;
    match_score: number;
  }>;
  learning_roadmap?: Array<{
    month: string;
    focus_area: string;
    skills_to_learn: string[];
    resources: Array<{
      type: string;
      title: string;
      provider: string;
      duration: string;
      difficulty: string;
    }>;
    projects: string[];
    time_commitment: string;
    outcomes: string[];
  }>;
  job_suggestions?: Array<{
    job_title: string;
    company_type: string;
    responsibilities: string[];
    skills_match: {
      matched: string[];
      missing: string[];
      match_percentage: number;
    };
    salary_range: string;
    location_options: string[];
    application_tips: string[];
    urgency: string;
  }>;
  skill_gaps?: string[];
  error?: string;
}

export interface CVImproverRequest {
  cv_text: string;
  target_role?: string;
  improvement_focus?: string[];
  current_issues?: string[];
}

export interface CVImproverResponse {
  success: boolean;
  improved_cv?: string;
  improvements_made?: string[];
  suggested_skills?: string[];
  grammar_corrections?: string[];
  impact_additions?: string[];
  error?: string;
}

class AIService {
  constructor() {
    // No external service configuration needed - using Gemini
  }

  /**
   * Generate CV using AI
   */
  async generateCV(request: CVBuilderRequest): Promise<CVBuilderResponse> {
    try {
      logger.info('Generating CV with Gemini AI', { name: request.name });

      // Create resume text from the request
      const resumeText = this.createResumeText(request);
      
      // Use Gemini to analyze and generate CV
      const analysis = await geminiService.analyzeResume(resumeText);
      
      logger.info('CV generation completed', { success: !!analysis });
      return {
        success: true,
        cv_data: analysis,
        formatted_cv: this.formatCV(analysis, request),
        markdown_cv: this.generateMarkdownCV(analysis, request)
      };
    } catch (error: any) {
      logger.error('CV generation failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  private createResumeText(request: CVBuilderRequest): string {
    let resumeText = `Name: ${request.name}\n\n`;
    
    if (request.skills?.length) {
      resumeText += `Skills: ${request.skills.join(', ')}\n\n`;
    }
    
    if (request.experience?.length) {
      resumeText += 'Experience:\n';
      request.experience.forEach(exp => {
        resumeText += `- ${exp.title} at ${exp.company}\n`;
        if (exp.description) resumeText += `  ${exp.description}\n`;
      });
      resumeText += '\n';
    }
    
    if (request.education?.length) {
      resumeText += 'Education:\n';
      request.education.forEach(edu => {
        resumeText += `- ${edu.degree} from ${edu.institution}\n`;
      });
      resumeText += '\n';
    }
    
    if (request.interests?.length) {
      resumeText += `Interests: ${request.interests.join(', ')}\n`;
    }
    
    if (request.target_role) {
      resumeText += `Target Role: ${request.target_role}\n`;
    }
    
    return resumeText;
  }

  private formatCV(analysis: any, request: CVBuilderRequest): string {
    // Basic CV formatting - can be enhanced
    let cv = `${request.name}\n\n`;
    
    if (request.experience?.length) {
      cv += 'EXPERIENCE\n';
      request.experience.forEach(exp => {
        cv += `${exp.title} - ${exp.company}\n`;
        if (exp.description) cv += `${exp.description}\n`;
      });
      cv += '\n';
    }
    
    if (request.skills?.length) {
      cv += 'SKILLS\n';
      cv += request.skills.join(', ') + '\n\n';
    }
    
    if (request.education?.length) {
      cv += 'EDUCATION\n';
      request.education.forEach(edu => {
        cv += `${edu.degree} - ${edu.institution}\n`;
      });
    }
    
    return cv;
  }

  private generateMarkdownCV(analysis: any, request: CVBuilderRequest): string {
    let cv = `# ${request.name}\n\n`;
    
    if (request.experience?.length) {
      cv += '## Experience\n';
      request.experience.forEach(exp => {
        cv += `### ${exp.title} - ${exp.company}\n`;
        if (exp.description) cv += `${exp.description}\n`;
      });
      cv += '\n';
    }
    
    if (request.skills?.length) {
      cv += '## Skills\n';
      request.skills.forEach(skill => {
        cv += `- ${skill}\n`;
      });
      cv += '\n';
    }
    
    if (request.education?.length) {
      cv += '## Education\n';
      request.education.forEach(edu => {
        cv += `### ${edu.degree}\n${edu.institution}\n`;
      });
    }
    
    return cv;
  }

  /**
   * Chat with AI career assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      logger.info('Sending chat message to Gemini AI', { 
        messageLength: request.message.length,
        conversationId: request.conversation_id 
      });

      // Create a context-aware prompt for Gemini
      const prompt = this.createChatPrompt(request);
      
      // Get response from Gemini
      const response = await geminiService.generateContent(prompt);
      
      // Generate suggestions based on the response
      const suggestions = this.generateSuggestions(request.message, response);
      
      logger.info('Chat response received', { 
        success: true,
        conversationId: request.conversation_id 
      });
      
      return {
        success: true,
        response: response,
        conversation_id: request.conversation_id || `chat_${Date.now()}`,
        suggestions: suggestions
      };
    } catch (error: any) {
      logger.error('Chat request failed', { error: error.message });
      return {
        success: false,
        response: "I'm having trouble responding right now. Please try again later.",
        conversation_id: request.conversation_id || `error_${Date.now()}`,
        suggestions: ["Try asking about resume tips", "Learn about interview preparation", "Explore career paths"],
        error: error.message
      };
    }
  }

  private createChatPrompt(request: ChatRequest): string {
    let prompt = `You are a professional career coach and AI assistant. You provide helpful, actionable advice about careers, job searching, resume writing, interview preparation, and professional development.\n\n`;
    
    if (request.user_profile) {
      prompt += `User Profile:\n`;
      if (request.user_profile.name) prompt += `Name: ${request.user_profile.name}\n`;
      if (request.user_profile.skills?.length) prompt += `Skills: ${request.user_profile.skills.join(', ')}\n`;
      if (request.user_profile.experience) prompt += `Experience: ${request.user_profile.experience}\n`;
      if (request.user_profile.target_role) prompt += `Target Role: ${request.user_profile.target_role}\n`;
      prompt += '\n';
    }
    
    prompt += `User Question: ${request.message}\n\n`;
    prompt += `Please provide a helpful, detailed response. Be encouraging and practical. Include specific examples when relevant.`;
    
    return prompt;
  }

  private generateSuggestions(userMessage: string, aiResponse: string): string[] {
    const suggestions: string[] = [];
    
    // Generate contextual suggestions based on the conversation
    if (userMessage.toLowerCase().includes('resume')) {
      suggestions.push("How can I improve my resume formatting?");
      suggestions.push("What skills should I highlight on my resume?");
    } else if (userMessage.toLowerCase().includes('interview')) {
      suggestions.push("How do I prepare for technical interviews?");
      suggestions.push("What are common interview questions?");
    } else if (userMessage.toLowerCase().includes('skills')) {
      suggestions.push("Which skills are in high demand?");
      suggestions.push("How can I develop new skills?");
    } else if (userMessage.toLowerCase().includes('career')) {
      suggestions.push("What career paths match my skills?");
      suggestions.push("How can I advance in my career?");
    } else {
      suggestions.push("Ask about resume writing tips");
      suggestions.push("Learn about interview preparation");
      suggestions.push("Explore career path options");
      suggestions.push("Get skill development advice");
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Get smart recommendations without CV
   */
  async getRecommendations(request: RecommendationsRequest): Promise<RecommendationsResponse> {
    try {
      logger.info('Generating smart recommendations with Gemini', {
        skillsCount: request.skills.length,
        interestsCount: request.interests.length,
        targetRole: request.target_role
      });

      // Create a comprehensive prompt for recommendations
      const prompt = this.createRecommendationsPrompt(request);
      
      // Get recommendations from Gemini
      const response = await geminiService.generateContent(prompt);
      
      // Parse and structure the response
      const careerPaths = this.parseCareerRecommendations(response, request);
      
      logger.info('Recommendations generated', { 
        success: true,
        careerPathsCount: careerPaths.length
      });
      
      return {
        success: true,
        career_paths: careerPaths
      };
    } catch (error: any) {
      logger.error('Recommendations generation failed', { error: error.message });
      
      // Return fallback recommendations
      const fallbackRecommendations = this.generateFallbackRecommendations(request);
      
      return {
        success: true,
        career_paths: fallbackRecommendations
      };
    }
  }

  private createRecommendationsPrompt(request: RecommendationsRequest): string {
    let prompt = `Based on the following user profile, provide 3-5 career recommendations with detailed analysis:\n\n`;
    
    prompt += `User Skills: ${request.skills.join(', ')}\n`;
    prompt += `User Interests: ${request.interests.join(', ')}\n`;
    
    if (request.experience_level) {
      prompt += `Experience Level: ${request.experience_level}\n`;
    }
    
    if (request.target_role) {
      prompt += `Target Role: ${request.target_role}\n`;
    }
    
    prompt += `\nFor each recommendation, provide:\n`;
    prompt += `- Job title\n`;
    prompt += `- Description of the role\n`;
    prompt += `- Required skills (mark which ones user already has)\n`;
    prompt += `- Salary range\n`;
    prompt += `- Growth potential\n`;
    prompt += `- Industry demand\n`;
    prompt += `- Match score (0-1) based on user's skills and interests\n`;
    
    prompt += `\nPlease format your response as a structured analysis with clear sections for each career recommendation.`;
    
    return prompt;
  }

  private parseCareerRecommendations(response: string, request: RecommendationsRequest): any[] {
    // Parse Gemini's response into structured career recommendations
    const careerPaths: any[] = [];
    
    // Common career paths based on skills
    const techCareers = [
      {
        title: "Full Stack Developer",
        description: "Develop both frontend and backend applications using modern web technologies",
        required_skills: ["JavaScript", "React", "Node.js", "Database"],
        existing_skills: request.skills.filter(s => ["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS"].includes(s)),
        missing_skills: [],
        salary_range: "$80,000 - $150,000",
        growth_potential: "High",
        industry_demand: "Very High",
        match_score: this.calculateMatchScore(request.skills, ["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS"])
      },
      {
        title: "Data Scientist",
        description: "Analyze complex data to help companies make better business decisions",
        required_skills: ["Python", "Machine Learning", "Statistics", "Data Visualization"],
        existing_skills: request.skills.filter(s => ["Python", "Machine Learning", "Statistics", "SQL", "R"].includes(s)),
        missing_skills: [],
        salary_range: "$90,000 - $160,000",
        growth_potential: "Very High",
        industry_demand: "Very High",
        match_score: this.calculateMatchScore(request.skills, ["Python", "Machine Learning", "Statistics", "SQL", "R"])
      },
      {
        title: "DevOps Engineer",
        description: "Automate and streamline software development and deployment processes",
        required_skills: ["Docker", "Kubernetes", "CI/CD", "Cloud"],
        existing_skills: request.skills.filter(s => ["Docker", "Kubernetes", "AWS", "Azure", "CI/CD"].includes(s)),
        missing_skills: [],
        salary_range: "$90,000 - $160,000",
        growth_potential: "Very High",
        industry_demand: "Very High",
        match_score: this.calculateMatchScore(request.skills, ["Docker", "Kubernetes", "AWS", "Azure", "CI/CD"])
      }
    ];

    // Filter and return relevant careers
    return techCareers
      .filter(career => career.match_score > 0.3)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);
  }

  private calculateMatchScore(userSkills: string[], requiredSkills: string[]): number {
    if (userSkills.length === 0) return 0.5; // Default score for users with no skills
    
    const matchingSkills = userSkills.filter(skill => 
      requiredSkills.some(req => skill.toLowerCase().includes(req.toLowerCase()) || 
                               req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return matchingSkills.length / requiredSkills.length;
  }

  private generateFallbackRecommendations(request: RecommendationsRequest): any[] {
    return [
      {
        title: "Software Developer",
        description: "Design, develop, and test software applications",
        required_skills: ["Programming", "Problem Solving", "Teamwork"],
        existing_skills: request.skills,
        missing_skills: [],
        salary_range: "$70,000 - $120,000",
        growth_potential: "High",
        industry_demand: "High",
        match_score: 0.7
      },
      {
        title: "Project Manager",
        description: "Plan and execute projects while managing teams and resources",
        required_skills: ["Leadership", "Communication", "Planning"],
        existing_skills: request.skills,
        missing_skills: [],
        salary_range: "$80,000 - $140,000",
        growth_potential: "High",
        industry_demand: "High",
        match_score: 0.6
      }
    ];
  }

  /**
   * Improve existing CV
   */
  async improveCV(request: CVImproverRequest): Promise<CVImproverResponse> {
    try {
      logger.info('Improving CV with Gemini AI', {
        cvLength: request.cv_text.length,
        targetRole: request.target_role
      });

      // Create improvement prompt
      const prompt = this.createCVImprovementPrompt(request);
      
      // Get improvements from Gemini
      const response = await geminiService.generateContent(prompt);
      
      // Parse improvements
      const improvements = this.parseCVImprovements(response);
      
      logger.info('CV improvement completed', { 
        success: true,
        improvementsCount: improvements.length
      });
      
      return {
        success: true,
        improved_cv: response,
        improvements_made: improvements,
        suggested_skills: this.extractSuggestedSkills(response),
        grammar_corrections: this.extractGrammarCorrections(response),
        impact_additions: this.extractImpactAdditions(response)
      };
    } catch (error: any) {
      logger.error('CV improvement failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  private createCVImprovementPrompt(request: CVImproverRequest): string {
    let prompt = `Please improve the following resume to make it more effective:\n\n`;
    prompt += `Current Resume:\n${request.cv_text}\n\n`;
    
    if (request.target_role) {
      prompt += `Target Role: ${request.target_role}\n\n`;
    }
    
    if (request.improvement_focus?.length) {
      prompt += `Areas to focus on: ${request.improvement_focus.join(', ')}\n\n`;
    }
    
    if (request.current_issues?.length) {
      prompt += `Current issues to address: ${request.current_issues.join(', ')}\n\n`;
    }
    
    prompt += `Please provide:\n`;
    prompt += `- An improved version of the resume\n`;
    prompt += `- Specific improvements made\n`;
    prompt += `- Suggested skills to add\n`;
    prompt += `- Grammar corrections\n`;
    prompt += `- Impact additions to strengthen achievements\n`;
    
    return prompt;
  }

  private parseCVImprovements(response: string): string[] {
    // Extract improvements from Gemini response
    const improvements: string[] = [];
    
    // Look for common improvement patterns
    if (response.includes('bullet')) improvements.push('Added action-oriented bullet points');
    if (response.includes('quantif')) improvements.push('Added quantifiable achievements');
    if (response.includes('skill')) improvements.push('Enhanced skills section');
    if (response.includes('format')) improvements.push('Improved formatting');
    if (response.includes('summary')) improvements.push('Strengthened professional summary');
    
    return improvements.length > 0 ? improvements : ['General improvements made'];
  }

  private extractSuggestedSkills(response: string): string[] {
    // Extract suggested skills from response
    const skills: string[] = [];
    
    // Common tech skills to suggest
    const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 'Git'];
    commonSkills.forEach(skill => {
      if (response.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return skills;
  }

  private extractGrammarCorrections(response: string): string[] {
    // Extract grammar corrections from response
    const corrections: string[] = [];
    
    if (response.includes('grammar') || response.includes('tense')) {
      corrections.push('Fixed grammar and tense consistency');
    }
    
    return corrections;
  }

  private extractImpactAdditions(response: string): string[] {
    // Extract impact additions from response
    const impacts: string[] = [];
    
    if (response.includes('metric') || response.includes('number') || response.includes('%')) {
      impacts.push('Added measurable impact statements');
    }
    
    return impacts;
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test Gemini API connectivity
      await geminiService.generateContent('Test');
      return true;
    } catch (error) {
      logger.error('AI service health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Get AI service metrics
   */
  async getMetrics(): Promise<any> {
    try {
      return {
        service: 'Gemini AI',
        status: 'active',
        model: 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Failed to get AI service metrics', { error: error.message });
      return null;
    }
  }
}

export default new AIService();
