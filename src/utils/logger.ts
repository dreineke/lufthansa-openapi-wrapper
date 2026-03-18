import type { Logger, LogLevel, LogContext, LoggingConfig } from '../types/logger.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ConsoleLogger implements Logger {
  constructor(private readonly minLevel: LogLevel = 'info') {}

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${this.formatMessage(message, context)}`);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${this.formatMessage(message, context)}`);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${this.formatMessage(message, context)}`);
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${this.formatMessage(message, context)}`);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message;

    const contextStr = Object.entries(context)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    return contextStr ? `${message} [${contextStr}]` : message;
  }
}

export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

export function createLogger(config?: Partial<LoggingConfig>): Logger {
  if (!config?.enabled) {
    return new NoOpLogger();
  }

  if (config.logger) {
    return config.logger;
  }

  return new ConsoleLogger(config.level);
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
