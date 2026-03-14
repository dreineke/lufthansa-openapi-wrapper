import { OAuthTokenManager } from '../oauth/oauth-token-manager.js';
import { backoff, parseRetryAfter } from '../utils/retry.js';
import { sleep } from '../utils/time.js';
import type { LufthansaClientConfig } from '../types/common.js';

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
  private readonly config: Required<Omit<LufthansaClientConfig, 'oauth' | 'userAgent'>> &
    Pick<LufthansaClientConfig, 'oauth'> &
    Partial<Pick<LufthansaClientConfig, 'userAgent'>>;
  private readonly tokenManager: OAuthTokenManager;

  constructor(config: LufthansaClientConfig) {
    this.config = {
      baseUrl: 'https://api.lufthansa.com',
      apiVersion: 'v1',
      maxRetries: 3,
      timeoutMs: 10_000,
      ...config,
    };
    this.tokenManager = new OAuthTokenManager(this.config.oauth);
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
    let attempt = 0;
    let refreshed = false;

    while (true) {
      const token = await this.tokenManager.getAccessToken();
      const response = await this.doFetch(method, path, token, body, options);

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      }

      if (response.status === 401 && !refreshed) {
        refreshed = true;
        await this.tokenManager.forceRefresh();
        continue;
      }

      if ((response.status === 429 || response.status >= 500) && attempt < this.config.maxRetries) {
        const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
        await sleep(retryAfter ?? backoff(attempt));
        attempt++;
        continue;
      }

      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text().catch(() => undefined);
      }

      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        errorBody,
      );
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
