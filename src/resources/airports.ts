import type {
  Airport,
  AirportsPage,
  GetAirportParams,
  ListAirportsParams,
} from '../types/airports.js';
import { normalizeMeta, type RawLhMeta, type RawLhName } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validatePaging } from '../utils/paging.js';
import type { ApiClient } from '../http/api-client.js';

type RawLhAirport = {
  AirportCode?: string;
  CityCode?: string;
  CountryCode?: string;
  LocationType?: string;
  UtcOffset?: string;
  TimeZoneId?: string;
  Position?: {
    Coordinate?: {
      Latitude?: number | string;
      Longitude?: number | string;
    };
  };
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
};

type RawLhAirportResource = {
  AirportResource?: {
    Airports?: {
      Airport?: RawLhAirport | RawLhAirport[];
    };
    Meta?: RawLhMeta;
  };
};

export class AirportsResource {
  constructor(private readonly http: ApiClient) {}

  async list(params: ListAirportsParams = {}): Promise<AirportsPage> {
    validatePaging(params);

    const response = await this.http.get<RawLhAirportResource>('/mds-references/airports', {
      query: {
        limit: params.limit,
        offset: params.offset,
        LHoperated: params.lhOperated ? 1 : undefined,
        group: params.group,
      },
    });

    return this.normalizeResource(response);
  }

  async getByCode(airportCode: string, params: GetAirportParams = {}): Promise<Airport | null> {
    const code = airportCode.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(code)) {
      throw new Error('airportCode must be a 3-letter IATA code');
    }

    const response = await this.http.get<RawLhAirportResource>(
      `/mds-references/airports/${encodeURIComponent(code)}`,
      {
        query: {
          lang: params.lang?.toUpperCase(),
        },
      },
    );

    const page = this.normalizeResource(response);
    return page.items[0] ?? null;
  }

  async listAll(params: Omit<ListAirportsParams, 'offset'> = {}): Promise<Airport[]> {
    const results: Airport[] = [];
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

  private normalizeResource(raw: RawLhAirportResource): AirportsPage {
    const resource = raw.AirportResource;
    const airports = toArray(resource?.Airports?.Airport).map((item: RawLhAirport) =>
      this.normalizeAirport(item),
    );
    const meta = normalizeMeta(resource?.Meta);

    return {
      items: airports,
      meta,
    };
  }

  private normalizeAirport(raw: RawLhAirport): Airport {
    const latitude = raw.Position?.Coordinate?.Latitude;
    const longitude = raw.Position?.Coordinate?.Longitude;

    return {
      airportCode: raw.AirportCode ?? '',
      ...(raw.CityCode !== undefined ? { cityCode: raw.CityCode } : {}),
      ...(raw.CountryCode !== undefined ? { countryCode: raw.CountryCode } : {}),
      ...(raw.LocationType !== undefined ? { locationType: raw.LocationType } : {}),
      ...(raw.UtcOffset !== undefined ? { utcOffset: raw.UtcOffset } : {}),
      ...(raw.TimeZoneId !== undefined ? { timeZoneId: raw.TimeZoneId } : {}),
      ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
      ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
