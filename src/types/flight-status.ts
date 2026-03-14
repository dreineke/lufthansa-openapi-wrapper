import type { Carrier, OperationsMeta, ServiceType } from './operations.js';
import type { PagingParams } from './paging.js';

export type FlightStatusTimeValue = {
  dateTime?: string;
};

export type FlightStatusTimeStatus = {
  code?: string;
  description?: string;
};

export type FlightStatusTerminal = {
  name?: string;
  gate?: string;
};

export type FlightStatusPoint = {
  airportCode?: string;
  scheduledLocal?: string;
  scheduledUtc?: string;
  estimatedLocal?: string;
  estimatedUtc?: string;
  actualLocal?: string;
  actualUtc?: string;
  timeStatus?: FlightStatusTimeStatus;
  terminal?: FlightStatusTerminal;
};

export type FlightStatusItem = {
  departure: FlightStatusPoint;
  arrival: FlightStatusPoint;
  marketingCarrier?: Carrier;
  operatingCarrier?: Carrier;
  aircraftCode?: string;
  status?: FlightStatusTimeStatus;
};

export type FlightStatusResult = {
  items: FlightStatusItem[];
  meta: OperationsMeta;
};

export type GetFlightStatusByFlightParams = {
  flightNumber: string;
  date: string;
};

export type GetFlightStatusByRouteParams = PagingParams & {
  origin: string;
  destination: string;
  date: string;
  serviceType?: ServiceType;
};

export type GetFlightStatusByAirportParams = PagingParams & {
  airportCode: string;
  fromDateTime: string;
  serviceType?: ServiceType;
};
