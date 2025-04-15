import { toast } from 'react-hot-toast';

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  error?: Error;
  data?: any;
  userId?: string;
}

// Logger class
class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {
    // Initialize logger
    this.setupGlobalErrorHandler();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupGlobalErrorHandler(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.error('Unhandled error', error || new Error(message as string), {
        source,
        lineno,
        colno
      });
    };

    window.onunhandledrejection = (event) => {
      this.error('Unhandled promise rejection', event.reason);
    };
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    return `[${level}] ${message}${data ? `\nData: ${JSON.stringify(data, null, 2)}` : ''}`;
  }

  private addLog(entry: LogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === LogLevel.ERROR ? 'error' :
                           entry.level === LogLevel.WARN ? 'warn' :
                           entry.level === LogLevel.DEBUG ? 'debug' : 'log';
      console[consoleMethod](this.formatMessage(entry.level, entry.message, entry.data));
    }
  }

  public info(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
      component,
      userId
    });
  }

  public warn(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
      component,
      userId
    });
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
      },
    });
  }

  public error(message: string, error?: Error, data?: any, component?: string, userId?: string): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error,
      data,
      component,
      userId
    });
    toast.error(message);
  }

  public debug(message: string, data?: any, component?: string, userId?: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        data,
        component,
        userId
      });
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.ERROR);
  }

  public getWarningLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.WARN);
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 