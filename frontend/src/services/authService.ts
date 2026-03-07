import api from './api';
import { User, LoginCredentials, RegisterData } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
};