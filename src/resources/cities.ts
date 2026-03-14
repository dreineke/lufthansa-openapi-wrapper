import { normalizeMeta, type RawLhMetaLink, type RawLhName } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validatePaging } from '../utils/paging.js';
import type { ApiClient } from '../http/api-client.js';
import type { City, CitiesPage, GetCityParams, ListCitiesParams } from '../types/cities.js';

type RawLhCity = {
  CityCode?: string;
  CountryCode?: string;
  UtcOffset?: string;
  TimeZoneId?: string;
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
  Airports?: {
    AirportCode?: string | string[];
  };
};

type RawLhCityResource = {
  CityResource?: {
    Cities?: {
      City?: RawLhCity | RawLhCity[];
    };
    Meta?: {
      '@Version'?: string;
      Link?: RawLhMetaLink | RawLhMetaLink[];
    };
  };
};

export class CitiesResource {
  constructor(private readonly http: ApiClient) {}

  async list(params: ListCitiesParams = {}): Promise<CitiesPage> {
    validatePaging(params);

    const response = await this.http.get<RawLhCityResource>('/mds-references/cities', {
      query: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    return this.normalizeResource(response);
  }

  async getByCode(cityCode: string, params: GetCityParams = {}): Promise<City | null> {
    const code = cityCode.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(code)) {
      throw new Error('cityCode must be a 3-letter IATA city code');
    }

    const response = await this.http.get<RawLhCityResource>(
      `/mds-references/cities/${encodeURIComponent(code)}`,
      {
        query: {
          lang: params.lang?.trim().toUpperCase(),
        },
      },
    );

    const page = this.normalizeResource(response);
    return page.items[0] ?? null;
  }

  async listAll(params: Omit<ListCitiesParams, 'offset'> = {}): Promise<City[]> {
    const results: City[] = [];
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

  private normalizeResource(raw: RawLhCityResource): CitiesPage {
    const resource = raw.CityResource;
    const cities = toArray(resource?.Cities?.City).map((item) => this.normalizeCity(item));
    const meta = normalizeMeta(resource?.Meta);

    return {
      items: cities,
      meta,
    };
  }

  private normalizeCity(raw: RawLhCity): City {
    return {
      cityCode: raw.CityCode ?? '',
      ...(raw.CountryCode !== undefined ? { countryCode: raw.CountryCode } : {}),
      ...(raw.UtcOffset !== undefined ? { utcOffset: raw.UtcOffset } : {}),
      ...(raw.TimeZoneId !== undefined ? { timeZoneId: raw.TimeZoneId } : {}),
      airportCodes: toArray(raw.Airports?.AirportCode).filter(
        (code): code is string => typeof code === 'string' && code.length > 0,
      ),
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
