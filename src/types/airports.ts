import type { Meta } from './common.js';
import type { PagingParams } from './paging.js';

export type AirportName = {
  languageCode: string;
  value: string;
};

export type Airport = {
  airportCode: string;
  cityCode?: string;
  countryCode?: string;
  locationType?: 'Airport' | 'RailwayStation' | 'BusStation' | string;
  utcOffset?: string;
  timeZoneId?: string;
  latitude?: number;
  longitude?: number;
  names: AirportName[];
};

export type AirportsGroup = 'MilesAndMore' | 'LHOperated' | 'AllAirports';

export type ListAirportsParams = PagingParams & {
  lhOperated?: boolean; // maps to LHoperated=1
  group?: AirportsGroup;
};

export type GetAirportParams = {
  lang?: string; // ISO 639-1, e.g. DE or EN
};

export type AirportsPage = {
  items: Airport[];
  meta: Meta;
};
