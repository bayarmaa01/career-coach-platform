/**
 * AI Controller - Handles AI-related endpoints
 * Routes requests to AI service and handles responses
 */

import { Request, Response } from 'express';
import aiService from '../services/aiService';
import logger from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

export class AIController {
  /**
   * Generate CV using AI
   */
  async generateCV(req: Request, res: Response) {
    try {
      const { name, skills, experience, education, interests, target_role } = req.body;

      // Validate required fields
      if (!name || !skills || !experience || !education) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, skills, experience, education'
        });
      }

      logger.info('CV generation request', { 
        userId: (req as any).user?.id,
        name,
        skillsCount: skills.length
      });

      const response = await aiService.generateCV({
        name,
        skills,
        experience,
        education,
        interests: interests || [],
        target_role
      });

      res.json(response);
    } catch (error: any) {
      logger.error('CV generation controller error', { 
        error: error.message,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate CV'
      });
    }
  }

  /**
   * Chat with AI career assistant
   */
  async chat(req: Request, res: Response) {
    try {
      const { message, user_profile, conversation_id } = req.body;

      // Validate required fields
      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      logger.info('Chat request', { 
        userId: (req as any).user?.id,
        messageLength: message.length,
        conversationId: conversation_id
      });

      const response = await aiService.chat({
        message,
        user_profile: user_profile || {},
        conversation_id
      });

      res.json(response);
    } catch (error: any) {
      console.error("AI CHAT ERROR:", error.response?.data || error.message);
      logger.error('Chat controller error', { 
        error: error.message,
        response: error.response?.data,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process chat request'
      });
    }
  }

  /**
   * Get smart recommendations without CV
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      const { skills, interests, target_role, experience_level, chat_history, preferences } = req.body;

      // Validate required fields
      if (!skills || !interests) {
        return res.status(400).json({
          success: false,
          error: 'Skills and interests are required'
        });
      }

      logger.info('Recommendations request', { 
        userId: (req as any).user?.id,
        skillsCount: skills.length,
        interestsCount: interests.length,
        targetRole: target_role
      });

      const response = await aiService.getRecommendations({
        skills,
        interests,
        target_role,
        experience_level,
        chat_history: chat_history || [],
        preferences
      });

      res.json(response);
    } catch (error: any) {
      console.error("AI RECOMMENDATIONS ERROR:", error.response?.data || error.message);
      logger.error('Recommendations controller error', { 
        error: error.message,
        response: error.response?.data,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate recommendations'
      });
    }
  }

  /**
   * Improve existing CV
   */
  async improveCV(req: Request, res: Response) {
    try {
      const { cv_text, target_role, improvement_focus, current_issues } = req.body;

      // Validate required fields
      if (!cv_text) {
        return res.status(400).json({
          success: false,
          error: 'CV text is required'
        });
      }

      logger.info('CV improvement request', { 
        userId: (req as any).user?.id,
        cvLength: cv_text.length,
        targetRole: target_role
      });

      const response = await aiService.improveCV({
        cv_text,
        target_role,
        improvement_focus,
        current_issues
      });

      res.json(response);
    } catch (error: any) {
      logger.error('CV improvement controller error', { 
        error: error.message,
        userId: (req as any).user?.id
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to improve CV'
      });
    }
  }

  /**
   * Get AI service health status
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const isHealthy = await aiService.healthCheck();
      
      res.json({
        success: true,
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('AI health check error', { error: error.message });
      
      res.status(500).json({
        success: false,
        healthy: false,
        error: error.message
      });
    }
  }

  /**
   * Get AI service metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await aiService.getMetrics();
      
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('AI metrics error', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new AIController();
