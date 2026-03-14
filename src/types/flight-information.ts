import type { Carrier, OperationsMeta } from './operations.js';
import type { PagingParams } from './paging.js';

export type FlightInformationTimestamp = {
  date?: string;
  time?: string;
  dateTime?: string;
};

export type FlightInformationTerminal = {
  name?: string;
  gate?: string;
};

export type FlightInformationStatus = {
  code?: string;
  description?: string;
};

export type FlightInformationPoint = {
  airportCode?: string;
  scheduled?: FlightInformationTimestamp;
  estimated?: FlightInformationTimestamp;
  actual?: FlightInformationTimestamp;
  terminal?: FlightInformationTerminal;
  status?: FlightInformationStatus;
};

export type FlightInformationItem = {
  departure: FlightInformationPoint;
  arrival: FlightInformationPoint;
  marketingCarriers: Carrier[];
  operatingCarrier?: Carrier;
  aircraftCode?: string;
  status?: FlightInformationStatus;
};

export type FlightInformationResult = {
  items: FlightInformationItem[];
  meta: OperationsMeta;
};

export type GetCustomerFlightInformationByFlightParams = {
  flightNumber: string;
  date: string;
};

export type GetCustomerFlightInformationByRouteParams = PagingParams & {
  origin: string;
  destination: string;
  date: string;
};

export type GetCustomerFlightInformationByAirportParams = PagingParams & {
  airportCode: string;
  fromDateTime: string;
};
