import { OAuthTokenManager } from '../oauth/oauth-token-manager.js';
import { backoff, parseRetryAfter } from '../utils/retry.js';
import { sleep } from '../utils/time.js';
import { createLogger, generateRequestId } from '../utils/logger.js';
import type { LufthansaClientConfig } from '../types/common.js';
import type { Logger, LoggingConfig } from '../types/logger.js';
import { DEFAULT_LOGGING_CONFIG } from '../types/logger.js';

type QueryValue = string | number | boolean | undefined;

type RequestOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, QueryValue>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

export class ApiClient {
  private readonly config: Required<
    Omit<LufthansaClientConfig, 'oauth' | 'userAgent' | 'logging'>
  > &
    Pick<LufthansaClientConfig, 'oauth'> &
    Partial<Pick<LufthansaClientConfig, 'userAgent' | 'logging'>>;
  private readonly tokenManager: OAuthTokenManager;
  private readonly logger: Logger;
  private readonly loggingConfig: LoggingConfig;

  constructor(config: LufthansaClientConfig) {
    this.config = {
      baseUrl: 'https://api.lufthansa.com',
      apiVersion: 'v1',
      maxRetries: 3,
      timeoutMs: 10_000,
      ...config,
    };

    this.loggingConfig = {
      ...DEFAULT_LOGGING_CONFIG,
      ...config.logging,
    } as LoggingConfig;

    this.logger = createLogger(this.loggingConfig);
    this.tokenManager = new OAuthTokenManager(this.config.oauth, this.logger, this.loggingConfig);
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const requestId = generateRequestId();
    const startTime = Date.now();
    let attempt = 0;
    let refreshed = false;

    const url = this.buildUrl(path, options?.query);

    if (this.loggingConfig.logRequests) {
      this.logger.info('Starting HTTP request', {
        requestId,
        method,
        url,
        hasBody: body !== undefined,
      });
    }

    while (true) {
      const token = await this.tokenManager.getAccessToken();
      const attemptStartTime = Date.now();

      try {
        const response = await this.doFetch(method, path, token, body, options);
        const duration = Date.now() - attemptStartTime;

        if (this.loggingConfig.logResponses) {
          this.logger.info('Received HTTP response', {
            requestId,
            method,
            url,
            status: response.status,
            attempt: attempt + 1,
            duration,
          });
        }

        if (response.ok) {
          const totalDuration = Date.now() - startTime;

          if (this.loggingConfig.logResponses) {
            this.logger.debug('Request completed successfully', {
              requestId,
              method,
              url,
              status: response.status,
              totalAttempts: attempt + 1,
              totalDuration,
            });
          }

          if (response.status === 204) return undefined as T;
          return (await response.json()) as T;
        }

        if (response.status === 401 && !refreshed) {
          refreshed = true;

          if (this.loggingConfig.logRetries) {
            this.logger.info('Retrying after token refresh', {
              requestId,
              method,
              url,
              status: response.status,
              attempt: attempt + 1,
            });
          }

          await this.tokenManager.forceRefresh();
          continue;
        }

        // Handle 403 quota exceeded errors with retry
        if (response.status === 403 && attempt < this.config.maxRetries) {
          try {
            const errorBody = await response.clone().text();
            const isQuotaExceeded =
              errorBody.includes('Account Over Queries Per Second Limit') ||
              errorBody.includes('Account Over Rate Limit') ||
              errorBody.includes('Rate Limit Exceeded');

            if (isQuotaExceeded) {
              const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
              const backoffMs = retryAfter ?? backoff(attempt);

              if (this.loggingConfig.logRetries) {
                this.logger.warn('Rate limit exceeded, retrying with backoff', {
                  requestId,
                  method,
                  url,
                  status: response.status,
                  attempt: attempt + 1,
                  backoffMs,
                  retryAfter,
                  reason: 'quota_exceeded',
                });
              }

              await sleep(backoffMs);
              attempt++;
              continue;
            }
          } catch {
            // If we can't parse the body, don't retry - fall through to error handling
          }
        }

        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < this.config.maxRetries
        ) {
          const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
          const backoffMs = retryAfter ?? backoff(attempt);

          if (this.loggingConfig.logRetries) {
            this.logger.warn('Retrying after server error', {
              requestId,
              method,
              url,
              status: response.status,
              attempt: attempt + 1,
              backoffMs,
              retryAfter,
              reason: response.status === 429 ? 'rate_limit' : 'server_error',
            });
          }

          await sleep(backoffMs);
          attempt++;
          continue;
        }

        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => undefined);
        }

        const error = new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          errorBody,
        );

        if (this.loggingConfig.logErrors) {
          this.logger.error('Request failed with non-retryable error', {
            requestId,
            method,
            url,
            status: response.status,
            attempt: attempt + 1,
            totalDuration: Date.now() - startTime,
            errorBody,
          });
        }

        throw error;
      } catch (error) {
        if (error instanceof ApiError) {
          // Re-throw ApiErrors (already logged above)
          throw error;
        }

        // Handle network errors, timeouts, etc.
        if (this.loggingConfig.logErrors) {
          this.logger.error('Request failed with network error', {
            requestId,
            method,
            url,
            attempt: attempt + 1,
            error: error instanceof Error ? error.message : String(error),
            totalDuration: Date.now() - startTime,
          });
        }

        throw error;
      }
    }
  }

  private async doFetch(
    method: string,
    path: string,
    accessToken: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const headers = new Headers(options?.headers ?? {});
      headers.set('authorization', `Bearer ${accessToken}`);
      headers.set('accept', 'application/json');

      if (this.config.userAgent) {
        headers.set('user-agent', this.config.userAgent);
      }

      let payload: BodyInit | null = null;
      if (body !== undefined) {
        headers.set('content-type', 'application/json');
        payload = JSON.stringify(body);
      }

      const url = this.buildUrl(path, options?.query);

      const requestInit: RequestInit = {
        ...options,
        method,
        headers,
        body: payload,
        signal: controller.signal,
      };

      if (payload !== null) {
        requestInit.body = payload;
      }

      return fetch(url, requestInit);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const normalizedBase = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl
      : `${this.config.baseUrl}/`;
    const normalizedVersion = this.config.apiVersion.replace(/^\/+|\/+$/g, '');
    const normalizedPath = path.replace(/^\/+/, '');

    const baseWithVersion =
      normalizedVersion.length > 0 ? `${normalizedBase}${normalizedVersion}/` : normalizedBase;

    const url = new URL(normalizedPath, baseWithVersion);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
