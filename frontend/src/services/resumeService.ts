import api from './api';
import { Resume, ResumeAnalysis } from '../types';

export const resumeService = {
  uploadResume: async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          console.log(`Upload progress: ${progress}%`);
        },
        timeout: 30000, // 30 second timeout
      });
      
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Enhanced error handling
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        
        switch (status) {
          case 400:
            throw new Error(`Validation error: ${message}`);
          case 413:
            throw new Error('File too large. Maximum size is 10MB');
          case 500:
            throw new Error(`Server error: ${message}`);
          default:
            throw new Error(`Upload failed: ${message}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(`Upload error: ${error.message}`);
      }
    }
  },

  getUserResumes: async (): Promise<Resume[]> => {
    try {
      const response = await api.get('/resumes');
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Get resumes error:', error);
      throw new Error(`Failed to fetch resumes: ${error.message}`);
    }
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    try {
      await api.delete(`/resumes/${resumeId}`);
    } catch (error: any) {
      console.error('Delete resume error:', error);
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  },

  analyzeResume: async (resumeId: string): Promise<ResumeAnalysis> => {
    try {
      const response = await api.post(`/resumes/${resumeId}/analyze`);
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Analyze resume error:', error);
      throw new Error(`Failed to analyze resume: ${error.message}`);
    }
  },

  getResumeAnalysis: async (resumeId: string): Promise<ResumeAnalysis> => {
    try {
      const response = await api.get(`/resumes/${resumeId}/analysis`);
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Get analysis error:', error);
      throw new Error(`Failed to get analysis: ${error.message}`);
    }
  },

  // New method for polling analysis status
  getAnalysisStatus: async (resumeId: string): Promise<any> => {
    try {
      const response = await api.get(`/resumes/${resumeId}/analysis-status`);
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    } catch (error: any) {
      console.error('Get analysis status error:', error);
      throw new Error(`Failed to get analysis status: ${error.message}`);
    }
  },
};
