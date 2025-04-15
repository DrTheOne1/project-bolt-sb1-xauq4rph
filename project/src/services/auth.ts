import { logger } from '../utils/logger';
import { api } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    is_admin?: boolean;
  };
}

export const login = async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    logger.info('User logged in successfully');
    return data;
  } catch (error) {
    logger.error('Login failed', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
};

export const register = async ({ email, password }: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
    localStorage.setItem('token', data.token);
    logger.info('User registered successfully');
    return data;
  } catch (error) {
    logger.error('Registration failed', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  logger.info('User logged out');
};

export const getCurrentUser = async (): Promise<AuthResponse['user'] | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const { data } = await api.get<AuthResponse>('/auth/me');
    return data.user;
  } catch (error) {
    logger.error('Failed to get current user', error instanceof Error ? error : new Error('Unknown error'));
    return null;
  }
}; 