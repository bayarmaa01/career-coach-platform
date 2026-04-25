import api from './api';
import { CareerPath, SkillGap, Course, ResumeAnalysis } from '../types';

export const careerService = {
  getCareerRecommendations: async (resumeId: string): Promise<CareerPath[]> => {
    const response = await api.get(`/api/career/recommendations/${resumeId}`);
    return response.data;
  },

  getSkillGapAnalysis: async (resumeId: string): Promise<SkillGap[]> => {
    const response = await api.get(`/api/career/skill-gap/${resumeId}`);
    return response.data;
  },

  getCourseRecommendations: async (resumeId: string): Promise<Course[]> => {
    const response = await api.get(`/api/career/courses/${resumeId}`);
    return response.data;
  },

  getResumeAnalysis: async (resumeId: string): Promise<ResumeAnalysis> => {
    const response = await api.get(`/api/career/analysis/${resumeId}`);
    return response.data;
  },

  getAllCareerPaths: async (): Promise<CareerPath[]> => {
    const response = await api.get('/api/career/paths');
    return response.data;
  },

  searchCareerPaths: async (query: string): Promise<CareerPath[]> => {
    const response = await api.get(`/api/career/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
