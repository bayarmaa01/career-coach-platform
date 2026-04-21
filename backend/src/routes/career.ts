import express from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import axios from 'axios';
import geminiService from '../services/gemini';

const router = express.Router();

router.get('/recommendations/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user.id;

    const resumeCheck = await pool.query(
      'SELECT id, content_text FROM resumes WHERE id = $1 AND user_id = $2 AND status = $3',
      [resumeId, userId, 'completed']
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or not processed' });
    }

    const resume = resumeCheck.rows[0];

    try {
      const recommendations = await geminiService.generateCareerRecommendations(resume.content_text || '');
      res.json(recommendations);
    } catch (aiError) {
      console.error('Career recommendations error:', aiError);
      
      const mockRecommendations = [
        {
          id: '1',
          title: 'Senior Software Engineer',
          description: 'Lead development of complex software systems and mentor junior developers',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'System Design'],
          averageSalary: 120000,
          growthRate: 15,
          matchScore: 85
        },
        {
          id: '2',
          title: 'Full Stack Developer',
          description: 'Develop both frontend and backend applications',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'Database'],
          averageSalary: 95000,
          growthRate: 12,
          matchScore: 78
        },
        {
          id: '3',
          title: 'DevOps Engineer',
          description: 'Manage deployment pipelines and infrastructure',
          requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud'],
          averageSalary: 110000,
          growthRate: 18,
          matchScore: 65
        }
      ];

      res.json(mockRecommendations);
    }
  } catch (error) {
    console.error('Get career recommendations error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/skill-gap/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user.id;

    const resumeCheck = await pool.query(
      'SELECT id, content_text FROM resumes WHERE id = $1 AND user_id = $2 AND status = $3',
      [resumeId, userId, 'completed']
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or not processed' });
    }

    const resume = resumeCheck.rows[0];
    const targetRole = req.query.targetRole as string || 'Senior Software Engineer';

    try {
      const skillGaps = await geminiService.analyzeSkillGap(resume.content_text || '', targetRole);
      res.json(skillGaps);
    } catch (aiError) {
      console.error('Skill gap analysis error:', aiError);
      
      const mockSkillGaps = [
        {
          skill: 'Kubernetes',
          currentLevel: 2,
          requiredLevel: 5,
          gap: 3,
          importance: 'high'
        },
        {
          skill: 'System Design',
          currentLevel: 3,
          requiredLevel: 5,
          gap: 2,
          importance: 'high'
        },
        {
          skill: 'AWS',
          currentLevel: 2,
          requiredLevel: 4,
          gap: 2,
          importance: 'medium'
        },
        {
          skill: 'GraphQL',
          currentLevel: 1,
          requiredLevel: 3,
          gap: 2,
          importance: 'low'
        },
        {
          skill: 'TypeScript',
          currentLevel: 3,
          requiredLevel: 4,
          gap: 1,
          importance: 'medium'
        }
      ];

      res.json(mockSkillGaps);
    }
  } catch (error) {
    console.error('Get skill gap error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/courses/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user.id;

    const resumeCheck = await pool.query(
      'SELECT id, content_text FROM resumes WHERE id = $1 AND user_id = $2 AND status = $3',
      [resumeId, userId, 'completed']
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or not processed' });
    }

    const resume = resumeCheck.rows[0];

    try {
      // First get skill gaps for this resume
      const skillGaps = await geminiService.analyzeSkillGap(resume.content_text || '', 'Senior Software Engineer');
      const courses = await geminiService.recommendCourses(resume.content_text || '', skillGaps);
      res.json(courses);
    } catch (aiError) {
      console.error('Course recommendations error:', aiError);
      
      const mockCourses = [
        {
          id: '1',
          title: 'Kubernetes for Developers',
          provider: 'Udemy',
          description: 'Learn Kubernetes from scratch with hands-on projects',
          duration: '20 hours',
          difficulty: 'intermediate',
          rating: 4.5,
          price: 89.99,
          url: 'https://udemy.com/kubernetes-course',
          skills: ['Kubernetes', 'Docker', 'Containers']
        },
        {
          id: '2',
          title: 'System Design Interview',
          provider: 'Coursera',
          description: 'Master system design concepts for technical interviews',
          duration: '15 hours',
          difficulty: 'advanced',
          rating: 4.7,
          price: 79.99,
          url: 'https://coursera.com/system-design',
          skills: ['System Design', 'Architecture', 'Scalability']
        },
        {
          id: '3',
          title: 'AWS Cloud Practitioner',
          provider: 'A Cloud Guru',
          description: 'Complete AWS certification preparation course',
          duration: '30 hours',
          difficulty: 'beginner',
          rating: 4.6,
          price: 99.99,
          url: 'https://acloud.guru/aws-practitioner',
          skills: ['AWS', 'Cloud Computing', 'DevOps']
        }
      ];

      res.json(mockCourses);
    }
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analysis/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user.id;

    const resumeCheck = await pool.query(
      'SELECT id, analysis_data, content_text FROM resumes WHERE id = $1 AND user_id = $2 AND status = $3',
      [resumeId, userId, 'completed']
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or not processed' });
    }

    const resume = resumeCheck.rows[0];

    if (resume.analysis_data) {
      return res.json(JSON.parse(resume.analysis_data));
    }

    try {
      const analysis = await geminiService.analyzeResume(resume.content_text || '');
      
      await pool.query(
        'UPDATE resumes SET analysis_data = $1 WHERE id = $2',
        [JSON.stringify(analysis), resumeId]
      );

      res.json(analysis);
    } catch (aiError) {
      console.error('Resume analysis error:', aiError);
      
      const mockAnalysis = {
        skills: [
          { name: 'JavaScript', category: 'Programming', proficiency: 4, yearsExperience: 3 },
          { name: 'React', category: 'Frontend', proficiency: 4, yearsExperience: 2 },
          { name: 'Node.js', category: 'Backend', proficiency: 3, yearsExperience: 2 },
          { name: 'Python', category: 'Programming', proficiency: 3, yearsExperience: 1 }
        ],
        experience: {
          years: 3,
          level: 'Mid-level'
        },
        education: [
          { degree: 'Bachelor of Science', field: 'Computer Science', institution: 'University' }
        ],
        recommendations: {
          careerPaths: [],
          skillGaps: [],
          courses: []
        }
      };

      res.json(mockAnalysis);
    }
  } catch (error) {
    console.error('Get analysis error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
