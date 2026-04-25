import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';
import pool from '../config/database';
import aiService from '../services/aiService';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    // Enhanced validation
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const { originalname, filename, path, size, mimetype } = req.file;
    const authReq = req as any;
    const userId = authReq.user?.id;

    // Additional validation
    if (!originalname || !filename || !path) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file data',
        code: 'INVALID_FILE_DATA'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    if (size > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    console.log(`Processing resume upload: ${originalname} (${size} bytes) for user ${userId}`);

    const result = await pool.query(
      'INSERT INTO resumes (user_id, file_name, original_name, file_path, file_size, mime_type, status, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, filename, originalname, path, size, mimetype, 'uploaded', new Date()]
    );

    const resume = result.rows[0];
    console.log(`Resume inserted with ID: ${resume.id}`);

    // AI Service Integration with better error handling
    try {
      // Read the uploaded file to extract text content
      const fs = require('fs').promises;
      const fileContent = await fs.readFile(path, 'utf8');
      
      // Use integrated AI service for resume analysis
      const analysis = await aiService.analyzeResume(fileContent);
      await pool.query(
        'UPDATE resumes SET status = $1, analysis_data = $2, content_text = $3 WHERE id = $4',
        ['completed', JSON.stringify(analysis), fileContent, resume.id]
      );

      return res.status(201).json({
        success: true,
        data: {
          id: resume.id,
          fileName: resume.original_name,
          uploadedAt: resume.uploaded_at,
          status: 'completed',
          analysis: analysis
        }
      });
      
    } catch (aiError: any) {
      console.error('AI Service error:', aiError.message);
      
      await pool.query(
        'UPDATE resumes SET status = $1 WHERE id = $2',
        ['failed', resume.id]
      );

      // Return more detailed error information
      return res.status(201).json({
        success: true,
        data: {
          id: resume.id,
          fileName: resume.original_name,
          uploadedAt: resume.uploaded_at,
          status: 'ai_service_failed'
        },
        warning: 'AI service unavailable, resume uploaded but not analyzed'
      });
    }
  } catch (error: any) {
    console.error('Upload error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during upload',
      code: 'UPLOAD_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log(`Getting resumes for user: ${userId}`);
    
    const result = await pool.query(
      'SELECT id, original_name, status, uploaded_at, processed_at FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );

    const resumes = result.rows.map(row => ({
      id: row.id,
      fileName: row.original_name,
      status: row.status,
      uploadedAt: row.uploaded_at,
      processedAt: row.processed_at
    }));

    console.log(`Found ${resumes.length} resumes for user ${userId}`);

    res.json({
      success: true,
      data: resumes
    });
  } catch (error: any) {
    console.error('Get resumes error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = (req as any).user.id;

    const result = await pool.query(
      'SELECT id FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Resume not found' 
      });
    }

    await pool.query('DELETE FROM resumes WHERE id = $1', [resumeId]);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete resume error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

router.get('/:id/analysis-status', authenticateToken, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = (req as any).user.id;

    // Verify resume belongs to user
    const result = await pool.query(
      'SELECT id, status FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
        code: 'RESUME_NOT_FOUND'
      });
    }

    const resume = result.rows[0];

    // Check if we have analysis data
    if (resume.status === 'completed' && resume.analysis_data) {
      return res.json({
        success: true,
        data: {
          status: 'completed',
          analysis: resume.analysis_data
        }
      });
    }

    // If not completed, check AI service
    try {
      // Use integrated AI service for analysis status
      const analysis = await aiService.getAnalysisStatus(resumeId);
      
      return res.json({
        success: true,
        data: {
          status: analysis.status,
          message: analysis.message,
          progress: analysis.progress || 0
        }
      });
    } catch (aiError: any) {
      console.error('AI service status check error:', aiError.message);
      
      return res.json({
        success: true,
        data: {
          status: resume.status
        }
      });
    }
  } catch (error) {
    console.error('Analysis status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'ANALYSIS_STATUS_ERROR'
    });
  }
});

router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = (req as any).user.id;

    const result = await pool.query(
      'SELECT id, status FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Resume not found' 
      });
    }

    const resume = result.rows[0];

    if (resume.status !== 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Resume analysis not completed' 
      });
    }

    try {
      // Use integrated AI service for analysis data
      const analysisData = await aiService.getAnalysis(resumeId);

      res.json({
        success: true,
        data: analysisData
      });
    } catch (aiError: any) {
      console.error('AI Analysis error:', aiError);
      res.status(500).json({ 
        success: false,
        message: 'Analysis service unavailable' 
      });
    }
  } catch (error) {
    console.error('Analyze resume error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

export default router;
