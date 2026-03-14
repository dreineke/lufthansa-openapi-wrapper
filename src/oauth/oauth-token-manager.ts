import type { LufthansaOAuthConfig } from '../types/common.js';
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
  private token: StoredToken | null = null;
  private refreshInFlight: Promise<string> | null = null;

  constructor(config: LufthansaOAuthConfig) {
    this.config = {
      tokenUrl: 'https://api.lufthansa.com/v1/oauth/token',
      ...config,
    };
  }

  /**
   * Returns a usable access token and coalesces concurrent refresh attempts.
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenUsable()) {
      return this.token!.accessToken;
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
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
      return this.refreshInFlight;
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

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Lufthansa token fetch failed: ${response.status} ${response.statusText} ${text}`,
      );
    }

    const json = (await response.json()) as TokenResponse;

    if (!json.access_token) {
      throw new Error('Lufthansa token response misses access_token');
    }

    this.token = {
      accessToken: json.access_token,
      expiresAtMs: Date.now() + (json.expires_in ?? 300) * 1000,
    };

    return this.token.accessToken;
  }
}
