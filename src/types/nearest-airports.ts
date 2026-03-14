import type { Meta } from './common.js';

export type NearestAirportName = {
  languageCode: string;
  value: string;
};

export type NearestAirport = {
  airportCode: string;
  cityCode?: string;
  countryCode?: string;
  locationType?: 'Airport' | 'RailwayStation' | 'BusStation' | string;
  latitude?: number;
  longitude?: number;
  distanceValue?: number;
  distanceUom?: string;
  names: NearestAirportName[];
};

export type GetNearestAirportsParams = {
  latitude: number;
  longitude: number;
  lang?: string;
};

export type NearestAirportsResult = {
  items: NearestAirport[];
  meta: Meta;
};
