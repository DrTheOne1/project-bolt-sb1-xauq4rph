import { useCallback } from 'react';
import { logger } from '../utils/logger';

export function useLogger(componentName: string) {
  const logInfo = useCallback((message: string, data?: any) => {
    logger.info(message, data, componentName);
  }, [componentName]);

  const logWarning = useCallback((message: string, data?: any) => {
    logger.warn(message, data, componentName);
  }, [componentName]);

  const logError = useCallback((message: string, error?: Error, data?: any) => {
    logger.error(message, error, data, componentName);
  }, [componentName]);

  const logDebug = useCallback((message: string, data?: any) => {
    logger.debug(message, data, componentName);
  }, [componentName]);

  return {
    logInfo,
    logWarning,
    logError,
    logDebug
  };
} 