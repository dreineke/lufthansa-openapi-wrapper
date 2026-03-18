import type { LoggingConfig } from './logger.js';

export type LufthansaOAuthConfig = {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
};

export type LufthansaClientConfig = {
  baseUrl?: string;
  apiVersion?: string;
  oauth: LufthansaOAuthConfig;
  timeoutMs?: number;
  maxRetries?: number;
  userAgent?: string;
  logging?: Partial<LoggingConfig>;
};

export type Link = {
  href: string;
  rel: string;
};

export type Meta = {
  version?: string;
  links?: Link[];
};
