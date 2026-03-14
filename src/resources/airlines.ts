import { normalizeMeta, type RawLhMetaLink, type RawLhName } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validatePaging } from '../utils/paging.js';
import type { Airline, AirlinesPage, ListAirlinesParams } from '../types/airlines.js';
import type { ApiClient } from '../http/api-client.js';

type RawLhAirline = {
  AirlineID?: string;
  AirlineID_ICAO?: string;
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
};

type RawLhAirlineResource = {
  AirlineResource?: {
    Airlines?: {
      Airline?: RawLhAirline | RawLhAirline[];
    };
    Meta?: {
      '@Version'?: string;
      Link?: RawLhMetaLink | RawLhMetaLink[];
    };
  };
};

export class AirlinesResource {
  constructor(private readonly http: ApiClient) {}

  async list(params: ListAirlinesParams = {}): Promise<AirlinesPage> {
    validatePaging(params);

    const response = await this.http.get<RawLhAirlineResource>('/mds-references/airlines', {
      query: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    return this.normalizeResource(response);
  }

  async getByCode(airlineCode: string): Promise<Airline | null> {
    const code = airlineCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{2}$/.test(code)) {
      throw new Error('airlineCode must be a 2-character IATA airline code');
    }

    const response = await this.http.get<RawLhAirlineResource>(
      `/mds-references/airlines/${encodeURIComponent(code)}`,
    );

    const page = this.normalizeResource(response);
    return page.items[0] ?? null;
  }

  async listAll(params: Omit<ListAirlinesParams, 'offset'> = {}): Promise<Airline[]> {
    const results: Airline[] = [];
    const limit = params.limit ?? 100;
    let offset = 0;

    while (true) {
      const page = await this.list({ ...params, limit, offset });
      results.push(...page.items);

      if (page.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return results;
  }

  private normalizeResource(raw: RawLhAirlineResource): AirlinesPage {
    const resource = raw.AirlineResource;

    return {
      items: toArray(resource?.Airlines?.Airline).map((item) => this.normalizeAirline(item)),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeAirline(raw: RawLhAirline): Airline {
    return {
      airlineId: raw.AirlineID ?? '',
      ...(raw.AirlineID_ICAO !== undefined ? { airlineIdIcao: raw.AirlineID_ICAO } : {}),
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
