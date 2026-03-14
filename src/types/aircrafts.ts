import type { Meta } from './common.js';
import type { PagingParams } from './paging.js';

export type AircraftName = {
  languageCode: string;
  value: string;
};

export type Aircraft = {
  aircraftCode: string;
  airlineEquipCode?: string;
  names: AircraftName[];
};

export type ListAircraftParams = PagingParams;

export type AircraftPage = {
  items: Aircraft[];
  meta: Meta;
};
