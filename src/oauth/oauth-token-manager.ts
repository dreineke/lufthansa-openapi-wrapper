import type { LufthansaOAuthConfig } from '../types/common.js';
import type { Logger, LoggingConfig } from '../types/logger.js';
import { nowUnixMs } from '../utils/time.js';

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type StoredToken = {
  accessToken: string;
  expiresAtMs: number;
};

/**
 * Manages OAuth access tokens, including expiry checks and optional refresh flow.
 */
export class OAuthTokenManager {
  private readonly config: Required<LufthansaOAuthConfig>;
  private readonly logger: Logger;
  private readonly loggingConfig: LoggingConfig;
  private token: StoredToken | null = null;
  private refreshInFlight: Promise<string> | null = null;

  constructor(config: LufthansaOAuthConfig, logger: Logger, loggingConfig: LoggingConfig) {
    this.config = {
      tokenUrl: 'https://api.lufthansa.com/v1/oauth/token',
      ...config,
    };
    this.logger = logger;
    this.loggingConfig = loggingConfig;
  }

  /**
   * Returns a usable access token and coalesces concurrent refresh attempts.
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenUsable()) {
      if (this.loggingConfig.logTokenOps) {
        this.logger.debug('Using cached access token', {
          expiresAtMs: this.token!.expiresAtMs,
          timeToExpiryMs: this.token!.expiresAtMs - nowUnixMs(),
        });
      }
      return this.token!.accessToken;
    }

    if (this.refreshInFlight) {
      if (this.loggingConfig.logTokenOps) {
        this.logger.debug('Waiting for in-flight token refresh');
      }
      return this.refreshInFlight;
    }

    if (this.loggingConfig.logTokenOps) {
      this.logger.info('Fetching new access token');
    }

    this.refreshInFlight = this.fetchToken().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  /**
   * Forces a network roundtrip to obtain a new access token.
   */
  async forceRefresh(): Promise<string> {
    if (this.refreshInFlight) {
      if (this.loggingConfig.logTokenOps) {
        this.logger.debug('Waiting for in-flight forced token refresh');
      }
      return this.refreshInFlight;
    }

    if (this.loggingConfig.logTokenOps) {
      this.logger.info('Forcing token refresh');
    }

    this.refreshInFlight = this.fetchToken().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private isTokenUsable(): boolean {
    if (!this.token) return false;

    const safetyWindowMs = 30_000;
    return this.token.expiresAtMs - safetyWindowMs > nowUnixMs();
  }

  private async fetchToken(force = false): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
    });

    const startTime = Date.now();

    if (this.loggingConfig.logTokenOps) {
      this.logger.debug('Requesting OAuth token', {
        tokenUrl: this.config.tokenUrl,
        clientId: this.config.clientId,
      });
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text().catch(() => '');

      if (this.loggingConfig.logTokenOps) {
        this.logger.error('OAuth token fetch failed', {
          tokenUrl: this.config.tokenUrl,
          status: response.status,
          statusText: response.statusText,
          duration,
          errorBody: text,
        });
      }

      throw new Error(
        `Lufthansa token fetch failed: ${response.status} ${response.statusText} ${text}`,
      );
    }

    const json = (await response.json()) as TokenResponse;

    if (!json.access_token) {
      if (this.loggingConfig.logTokenOps) {
        this.logger.error('OAuth token response missing access_token', {
          tokenUrl: this.config.tokenUrl,
          response: json,
          duration,
        });
      }

      throw new Error('Lufthansa token response misses access_token');
    }

    const expiresInSeconds = json.expires_in ?? 300;
    const expiresAtMs = Date.now() + expiresInSeconds * 1000;

    this.token = {
      accessToken: json.access_token,
      expiresAtMs,
    };

    if (this.loggingConfig.logTokenOps) {
      this.logger.info('OAuth token fetched successfully', {
        tokenUrl: this.config.tokenUrl,
        expiresInSeconds,
        expiresAtMs,
        duration,
      });
    }

    return this.token.accessToken;
  }
}
