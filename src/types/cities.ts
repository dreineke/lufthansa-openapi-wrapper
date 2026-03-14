import type { Meta } from './common.js';
import type { PagingParams } from './paging.js';

export type CityName = {
  languageCode: string;
  value: string;
};

export type City = {
  cityCode: string;
  countryCode?: string;
  utcOffset?: string;
  timeZoneId?: string;
  airportCodes: string[];
  names: CityName[];
};

export type ListCitiesParams = PagingParams;

export type GetCityParams = {
  lang?: string; // ISO 639-1, z. B. DE oder EN
};

export type CitiesPage = {
  items: City[];
  meta: Meta;
};
