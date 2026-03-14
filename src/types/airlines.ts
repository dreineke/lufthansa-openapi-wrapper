import type { Meta } from './common.js';
import type { PagingParams } from './paging.js';

export type AirlineName = {
  languageCode: string;
  value: string;
};

export type Airline = {
  airlineId: string;
  airlineIdIcao?: string;
  names: AirlineName[];
};

export type ListAirlinesParams = PagingParams;

export type AirlinesPage = {
  items: Airline[];
  meta: Meta;
};
