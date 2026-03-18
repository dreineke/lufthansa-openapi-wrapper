export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  requestId?: string;
  method?: string;
  url?: string;
  attempt?: number;
  status?: number;
  duration?: number;
  [key: string]: unknown;
};

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export type LoggingConfig = {
  enabled: boolean;
  level: LogLevel;
  logger: Logger;
  // Log request details (method, URL, query params)
  logRequests?: boolean;
  // Log response details (status, timing)
  logResponses?: boolean;
  // Log retry attempts with backoff details
  logRetries?: boolean;
  // Log token management operations
  logTokenOps?: boolean;
  // Log error details
  logErrors?: boolean;
};

export const DEFAULT_LOGGING_CONFIG: Partial<LoggingConfig> = {
  enabled: false,
  level: 'info',
  logRequests: true,
  logResponses: true,
  logRetries: true,
  logTokenOps: false,
  logErrors: true,
};
