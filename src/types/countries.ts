import type { Meta } from './common.js';
import type { PagingParams } from './paging.js';

export type CountryName = {
  languageCode: string;
  value: string;
};

export type Country = {
  countryCode: string;
  names: CountryName[];
};

export type ListCountriesParams = PagingParams;

export type GetCountryParams = {
  lang?: string; // ISO 639-1, z. B. DE oder EN
};

export type CountriesPage = {
  items: Country[];
  meta: Meta;
};
