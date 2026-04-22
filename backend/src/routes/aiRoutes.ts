/**
 * AI Routes - Defines all AI-related endpoints
 * Handles authentication and routes to AI controller
 */

import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Apply authentication to all AI routes
 */
router.use(authenticateToken);

/**
 * Rate limiting is handled globally in app.ts
 */

/**
 * @route POST /api/ai/generate-cv
 * @desc Generate a professional CV using AI
 * @access Private
 */
router.post('/generate-cv', aiController.generateCV);

/**
 * @route POST /api/ai/chat
 * @desc Chat with AI career assistant
 * @access Private
 */
router.post('/chat', aiController.chat);

/**
 * @route POST /api/ai/recommendations-lite
 * @desc Get smart recommendations without CV
 * @access Private
 */
router.post('/recommendations-lite', aiController.getRecommendations);

/**
 * @route POST /api/ai/improve-cv
 * @desc Improve existing CV using AI
 * @access Private
 */
router.post('/improve-cv', aiController.improveCV);

/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 * @access Private
 */
router.get('/health', aiController.healthCheck);

/**
 * @route GET /api/ai/metrics
 * @desc Get AI service metrics
 * @access Private
 */
router.get('/metrics', aiController.getMetrics);

export default router;
