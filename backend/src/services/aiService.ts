/**
 * AI Service - Integration with AI Service for career coaching features
 * Handles all AI-related API calls to the Python FastAPI service
 */

import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';

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
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://ai-service:5100';
    this.timeout = 30000; // 30 seconds timeout
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    method: 'POST' = 'POST'
  ): Promise<AxiosResponse<T>> {
    try {
      const config = {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.post(`${this.baseURL}${endpoint}`, data, config);
      return response;
    } catch (error: any) {
      logger.error(`AI Service request failed: ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is currently unavailable. Please try again later.');
      }

      if (error.response?.status === 429) {
        throw new Error('Too many requests to AI service. Please try again later.');
      }

      if (error.response?.status >= 500) {
        throw new Error('AI service is experiencing issues. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Generate CV using AI
   */
  async generateCV(request: CVBuilderRequest): Promise<CVBuilderResponse> {
    try {
      logger.info('Generating CV with AI service', { name: request.name });

      const response = await this.makeRequest<CVBuilderResponse>('/generate-cv', request);
      
      logger.info('CV generation completed', { success: response.data.success });
      return response.data;
    } catch (error: any) {
      logger.error('CV generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Chat with AI career assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      logger.info('Sending chat message to AI service', { 
        messageLength: request.message.length,
        conversationId: request.conversation_id 
      });

      const response = await this.makeRequest<ChatResponse>('/chat', request);
      
      logger.info('Chat response received', { 
        success: response.data.success,
        conversationId: response.data.conversation_id 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Chat request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get smart recommendations without CV
   */
  async getRecommendations(request: RecommendationsRequest): Promise<RecommendationsResponse> {
    try {
      logger.info('Generating smart recommendations', {
        skillsCount: request.skills.length,
        interestsCount: request.interests.length,
        targetRole: request.target_role
      });

      const response = await this.makeRequest<RecommendationsResponse>('/recommendations-lite', request);
      
      logger.info('Recommendations generated', { 
        success: response.data.success,
        careerPathsCount: response.data.career_paths?.length || 0
      });
      return response.data;
    } catch (error: any) {
      logger.error('Recommendations generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Improve existing CV
   */
  async improveCV(request: CVImproverRequest): Promise<CVImproverResponse> {
    try {
      logger.info('Improving CV with AI service', {
        cvLength: request.cv_text.length,
        targetRole: request.target_role
      });

      const response = await this.makeRequest<CVImproverResponse>('/improve-cv', request);
      
      logger.info('CV improvement completed', { 
        success: response.data.success,
        improvementsCount: response.data.improvements_made?.length || 0
      });
      return response.data;
    } catch (error: any) {
      logger.error('CV improvement failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/health', {}, 'POST');
      return response.status === 200;
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
      const response = await axios.get(`${this.baseURL}/metrics`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get AI service metrics', { error: error.message });
      return null;
    }
  }
}

export default new AIService();
