import api from './api';
import { Resume, ResumeAnalysis } from '../types';

export const resumeService = {
  uploadResume: async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('resume', file);
    
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
    });
    
    return response.data;
  },

  getUserResumes: async (): Promise<Resume[]> => {
    const response = await api.get('/resumes');
    return response.data;
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    await api.delete(`/resumes/${resumeId}`);
  },

  analyzeResume: async (resumeId: string): Promise<ResumeAnalysis> => {
    const response = await api.post(`/resumes/${resumeId}/analyze`);
    return response.data;
  },

  getResumeAnalysis: async (resumeId: string): Promise<ResumeAnalysis> => {
    const response = await api.get(`/resumes/${resumeId}/analysis`);
    return response.data;
  },
};
