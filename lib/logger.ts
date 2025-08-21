/**
 * Structured Logger Utility for Open Lovable
 * Provides consistent logging across the application with different levels and formatting
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    
    // Allow environment override
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level].padEnd(5);
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    
    return `${entry.timestamp} ${levelName} ${contextStr} ${entry.message}${metadataStr}`;
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      metadata,
      timestamp: new Date().toISOString()
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
      case LogLevel.TRACE:
        if (this.isDevelopment) {
          console.log(formattedMessage);
        }
        break;
    }
  }

  error(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  trace(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context, metadata);
  }

  // Utility methods for common logging patterns
  apiCall(method: string, endpoint: string, metadata?: Record<string, any>): void {
    this.debug(`${method} ${endpoint}`, 'API', metadata);
  }

  apiResponse(endpoint: string, status: number, duration?: number, metadata?: Record<string, any>): void {
    const meta = { status, ...(duration && { duration: `${duration}ms` }), ...metadata };
    this.debug(`Response ${status}`, endpoint, meta);
  }

  apiError(endpoint: string, error: Error, metadata?: Record<string, any>): void {
    this.error(`${error.message}`, endpoint, { stack: error.stack, ...metadata });
  }

  performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.debug(`${operation} completed`, 'PERF', { duration: `${duration}ms`, ...metadata });
  }

  sandbox(action: string, sandboxId: string, metadata?: Record<string, any>): void {
    this.debug(action, `sandbox-${sandboxId}`, metadata);
  }

  package(action: string, packageName: string, metadata?: Record<string, any>): void {
    this.debug(`${action}: ${packageName}`, 'PKG', metadata);
  }

  file(action: string, filePath: string, metadata?: Record<string, any>): void {
    this.debug(`${action}: ${filePath}`, 'FILE', metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  error: (msg: string, context?: string, meta?: Record<string, any>) => logger.error(msg, context, meta),
  warn: (msg: string, context?: string, meta?: Record<string, any>) => logger.warn(msg, context, meta),
  info: (msg: string, context?: string, meta?: Record<string, any>) => logger.info(msg, context, meta),
  debug: (msg: string, context?: string, meta?: Record<string, any>) => logger.debug(msg, context, meta),
  trace: (msg: string, context?: string, meta?: Record<string, any>) => logger.trace(msg, context, meta),
  
  // Specialized loggers
  api: logger.apiCall.bind(logger),
  apiResponse: logger.apiResponse.bind(logger),
  apiError: logger.apiError.bind(logger),
  performance: logger.performance.bind(logger),
  sandbox: logger.sandbox.bind(logger),
  package: logger.package.bind(logger),
  file: logger.file.bind(logger)
};

export default logger;