import { normalizeMeta, type RawLhMeta, type RawLhName } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validatePaging } from '../utils/paging.js';
import type { Aircraft, AircraftPage, ListAircraftParams } from '../types/aircrafts.js';
import type { ApiClient } from '../http/api-client.js';

type RawLhAircraftSummary = {
  AircraftCode?: string;
  AirlineEquipCode?: string;
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
};

type RawLhAircraftResource = {
  AircraftResource?: {
    AircraftSummaries?: {
      AircraftSummary?: RawLhAircraftSummary | RawLhAircraftSummary[];
    };
    Meta?: RawLhMeta;
  };
};

export class AircraftResource {
  constructor(private readonly http: ApiClient) {}

  async list(params: ListAircraftParams = {}): Promise<AircraftPage> {
    validatePaging(params);

    const response = await this.http.get<RawLhAircraftResource>('/mds-references/aircraft', {
      query: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    return this.normalizeResource(response);
  }

  async getByCode(aircraftCode: string): Promise<Aircraft | null> {
    const code = aircraftCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{3}$/.test(code)) {
      throw new Error('aircraftCode must be a 3-character IATA equipment code');
    }

    const response = await this.http.get<RawLhAircraftResource>(
      `/mds-references/aircraft/${encodeURIComponent(code)}`,
    );

    const page = this.normalizeResource(response);
    return page.items[0] ?? null;
  }

  async listAll(params: Omit<ListAircraftParams, 'offset'> = {}): Promise<Aircraft[]> {
    const results: Aircraft[] = [];
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

  private normalizeResource(raw: RawLhAircraftResource): AircraftPage {
    const resource = raw.AircraftResource;

    return {
      items: toArray(resource?.AircraftSummaries?.AircraftSummary).map((item) =>
        this.normalizeAircraft(item),
      ),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeAircraft(raw: RawLhAircraftSummary): Aircraft {
    return {
      aircraftCode: raw.AircraftCode ?? '',
      ...(raw.AirlineEquipCode !== undefined ? { airlineEquipCode: raw.AirlineEquipCode } : {}),
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
