// A simple production-ready logger with different log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {
    // Set log level from environment variable if available
    if (process.env.LOG_LEVEL) {
      this.logLevel = process.env.LOG_LEVEL as LogLevel;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, data);
      // In production, write structured logs
    if (process.env.NODE_ENV === 'production') {
      // Add request ID if available
      const requestId = process.env.REQUEST_ID || '';
      const structuredLog = {
        ...logEntry,
        app: 'hydrolog',
        version: process.env.npm_package_version || '0.1.0',
        requestId,
        environment: process.env.NODE_ENV,
      };
      
      // Write to stdout for Docker logging
      console.log(JSON.stringify(structuredLog));
    } else {
      // In development, pretty print
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      console.log(
        `${colors[level]}[${logEntry.level.toUpperCase()}]\x1b[0m`,
        `${logEntry.timestamp}:`,
        logEntry.message,
        logEntry.data ? logEntry.data : ''
      );
    }
  }

  public debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = Logger.getInstance();
