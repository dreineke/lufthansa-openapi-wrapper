import type { Meta } from './common.js';

export type ServiceType = 'passenger' | 'cargo' | 'all';

export type Carrier = {
  airlineId: string;
  flightNumber: string;
};

export type TerminalInfo = {
  name?: string;
  gate?: string;
};

export type StatusInfo = {
  code?: string;
  description?: string;
};

export type AirportEventPoint = {
  airportCode?: string;
  terminal?: TerminalInfo;
};

export type OperationsMeta = Meta;
