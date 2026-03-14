import type { ApiClient } from '../http/api-client.js';
import type {
  Country,
  CountriesPage,
  GetCountryParams,
  ListCountriesParams,
} from '../types/countries.js';
import { toArray } from '../utils/arrays.js';
import { normalizeMeta, type RawLhMeta, type RawLhName } from '../utils/lh-meta.js';
import { validatePaging } from '../utils/paging.js';

type RawLhCountry = {
  CountryCode?: string;
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
};

type RawLhCountryResource = {
  CountryResource?: {
    Countries?: {
      Country?: RawLhCountry | RawLhCountry[];
    };
    Meta?: RawLhMeta;
  };
};

export class CountriesResource {
  constructor(private readonly http: ApiClient) {}

  async list(params: ListCountriesParams = {}): Promise<CountriesPage> {
    validatePaging(params);

    const response = await this.http.get<RawLhCountryResource>('/mds-references/countries', {
      query: {
        limit: params.limit,
        offset: params.offset,
      },
    });

    return this.normalizeResource(response);
  }

  async getByCode(countryCode: string, params: GetCountryParams = {}): Promise<Country | null> {
    const code = countryCode.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error('countryCode must be a 2-letter ISO 3166-1 country code');
    }

    const response = await this.http.get<RawLhCountryResource>(
      `/mds-references/countries/${encodeURIComponent(code)}`,
      {
        query: {
          lang: params.lang?.trim().toUpperCase(),
        },
      },
    );

    const page = this.normalizeResource(response);
    return page.items[0] ?? null;
  }

  async listAll(params: Omit<ListCountriesParams, 'offset'> = {}): Promise<Country[]> {
    const results: Country[] = [];
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

  private normalizeResource(raw: RawLhCountryResource): CountriesPage {
    const resource = raw.CountryResource;
    const countries = toArray(resource?.Countries?.Country).map((item: RawLhCountry) =>
      this.normalizeCountry(item),
    );
    const meta = normalizeMeta(resource?.Meta);

    return {
      items: countries,
      meta,
    };
  }

  private normalizeCountry(raw: RawLhCountry): Country {
    return {
      countryCode: raw.CountryCode ?? '',
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
