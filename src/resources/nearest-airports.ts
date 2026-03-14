import { normalizeMeta, type RawLhMeta } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import type { ApiClient } from '../http/api-client.js';
import type {
  NearestAirport,
  NearestAirportsResult,
  GetNearestAirportsParams,
} from '../types/nearest-airports.js';

type RawLhName = {
  '@LanguageCode'?: string;
  $?: string;
};

type RawLhNearestAirport = {
  AirportCode?: string;
  CityCode?: string;
  CountryCode?: string;
  LocationType?: string;
  Position?: {
    Coordinate?: {
      Latitude?: number | string;
      Longitude?: number | string;
    };
  };
  Names?: {
    Name?: RawLhName | RawLhName[];
  };
  Distance?: {
    Value?: number | string;
    UOM?: string;
  };
};

type RawLhNearestAirportResource = {
  NearestAirportResource?: {
    Airports?: {
      Airport?: RawLhNearestAirport | RawLhNearestAirport[];
    };
    Meta?: RawLhMeta;
  };
};

export class NearestAirportsResource {
  constructor(private readonly http: ApiClient) {}

  async get(params: GetNearestAirportsParams): Promise<NearestAirportsResult> {
    this.validateCoordinates(params.latitude, params.longitude);

    const latitude = this.formatCoordinate(params.latitude);
    const longitude = this.formatCoordinate(params.longitude);

    const response = await this.http.get<RawLhNearestAirportResource>(
      `/references/airports/nearest/${latitude},${longitude}`,
      {
        query: {
          lang: params.lang?.trim().toUpperCase(),
        },
      },
    );

    return this.normalizeResource(response);
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('latitude must be between -90 and 90');
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('longitude must be between -180 and 180');
    }
  }

  private formatCoordinate(value: number): string {
    return value.toFixed(3);
  }

  private normalizeResource(raw: RawLhNearestAirportResource): NearestAirportsResult {
    const resource = raw.NearestAirportResource;

    return {
      items: toArray(resource?.Airports?.Airport).map((item) => this.normalizeAirport(item)),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeAirport(raw: RawLhNearestAirport): NearestAirport {
    const latitude = raw.Position?.Coordinate?.Latitude;
    const longitude = raw.Position?.Coordinate?.Longitude;
    const distanceValue = raw.Distance?.Value;

    return {
      airportCode: raw.AirportCode ?? '',
      ...(raw.CityCode !== undefined ? { cityCode: raw.CityCode } : {}),
      ...(raw.CountryCode !== undefined ? { countryCode: raw.CountryCode } : {}),
      ...(raw.LocationType !== undefined ? { locationType: raw.LocationType } : {}),
      ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
      ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
      ...(distanceValue !== undefined ? { distanceValue: Number(distanceValue) } : {}),
      ...(raw.Distance?.UOM !== undefined ? { distanceUom: raw.Distance.UOM } : {}),
      names: toArray(raw.Names?.Name).map((name) => ({
        languageCode: name['@LanguageCode'] ?? '',
        value: name['$'] ?? '',
      })),
    };
  }
}
