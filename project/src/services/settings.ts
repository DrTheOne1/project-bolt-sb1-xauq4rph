import { logger } from '../utils/logger';
import { api } from './api';

export interface Settings {
  language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
}

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  try {
    const { data } = await api.put<Settings>('/settings', settings);
    logger.info('Settings updated successfully', settings);
    return data;
  } catch (error) {
    logger.error('Failed to update settings', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const { data } = await api.get<Settings>('/settings');
    logger.info('Settings fetched successfully');
    return data;
  } catch (error) {
    logger.error('Failed to fetch settings', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}; 