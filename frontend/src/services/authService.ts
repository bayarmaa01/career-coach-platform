import api from './api';
import { User, LoginCredentials, RegisterData } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      // Handle both response formats: {data: {user, token}} or {user, token}
      const data = (response as any).data || response;
      localStorage.setItem('token', data.token);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post('/api/auth/register', data);
      // Handle both response formats: {data: {user, token}} or {user, token}
      const authData = (response as any).data || response;
      localStorage.setItem('token', authData.token);
      return authData;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/api/auth/me');
      // Handle both response formats: {data: user} or user
      const user = (response as any).data || response;
      return user;
    } catch (error: any) {
      console.error('Get current user error:', error);
      throw new Error(`Failed to get user: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      const response = await api.post('/api/auth/refresh');
      // Handle both response formats: {data: {token}} or {token}
      const data = (response as any).data || response;
      return data;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  },
};