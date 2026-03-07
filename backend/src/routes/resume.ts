import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';
import pool from '../config/database';
import axios from 'axios';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, path, size, mimetype } = req.file;
    const userId = (req as any).user.id;

    const result = await pool.query(
      'INSERT INTO resumes (user_id, file_name, original_name, file_path, file_size, mime_type, status, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, filename, originalname, path, size, mimetype, 'uploaded', new Date()]
    );

    const resume = result.rows[0];

    try {
      await axios.post(`${process.env.AI_SERVICE_URL}/analyze-resume`, {
        resumeId: resume.id,
        filePath: path
      });
      
      await pool.query(
        'UPDATE resumes SET status = $1 WHERE id = $2',
        ['processing', resume.id]
      );
    } catch (aiError) {
      console.error('AI Service error:', aiError);
      await pool.query(
        'UPDATE resumes SET status = $1 WHERE id = $2',
        ['failed', resume.id]
      );
    }

    res.status(201).json({
      id: resume.id,
      fileName: resume.original_name,
      uploadedAt: resume.uploaded_at,
      status: resume.status
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
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

    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Resume not found' });
    }

    await pool.query('DELETE FROM resumes WHERE id = $1', [resumeId]);

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Resume not found' });
    }

    const resume = result.rows[0];

    if (resume.status !== 'completed') {
      return res.status(400).json({ message: 'Resume analysis not completed' });
    }

    try {
      const analysisResponse = await axios.get(`${process.env.AI_SERVICE_URL}/analysis/${resumeId}`);
      
      await pool.query(
        'UPDATE resumes SET analysis_data = $1 WHERE id = $2',
        [JSON.stringify(analysisResponse.data), resumeId]
      );

      res.json(analysisResponse.data);
    } catch (aiError) {
      console.error('AI Analysis error:', aiError);
      res.status(500).json({ message: 'Analysis service unavailable' });
    }
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
