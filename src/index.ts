export * from './client.js';

// Export logger types and utilities for custom logger implementations
export type { Logger, LogLevel, LogContext, LoggingConfig } from './types/logger.js';
export { ConsoleLogger, NoOpLogger } from './utils/logger.js';

// Core Configuration Types
export type { LufthansaClientConfig, LufthansaOAuthConfig, Link } from './types/common.js';

// Paging
export type { PagingParams } from './types/paging.js';

// Common API Types
export type {
  ServiceType,
  Carrier,
  TerminalInfo,
  StatusInfo,
  AirportEventPoint,
  OperationsMeta,
} from './types/operations.js';

// Aircraft Types
export type {
  Aircraft,
  AircraftName,
  ListAircraftParams,
  AircraftPage,
} from './types/aircrafts.js';

// Airline Types
export type { Airline, AirlineName, ListAirlinesParams, AirlinesPage } from './types/airlines.js';

// Airport Types
export type {
  Airport,
  AirportName,
  AirportsGroup,
  ListAirportsParams,
  GetAirportParams,
  AirportsPage,
} from './types/airports.js';

// City Types
export type {
  City,
  CityName,
  ListCitiesParams,
  GetCityParams,
  CitiesPage,
} from './types/cities.js';

// Country Types
export type {
  Country,
  CountryName,
  ListCountriesParams,
  GetCountryParams,
  CountriesPage,
} from './types/countries.js';

// Flight Schedule Types
export type {
  ScheduleCompartment,
  ScheduleEquipment,
  ScheduleTerminal,
  SchedulePoint,
  ScheduledLeg,
  ScheduledJourney,
  FlightSchedulesResult,
  GetFlightSchedulesParams,
} from './types/flight-schedule.js';

// Flight Status Types
export type {
  FlightStatusTimeValue,
  FlightStatusTimeStatus,
  FlightStatusTerminal,
  FlightStatusPoint,
  FlightStatusItem,
  FlightStatusResult,
  GetFlightStatusByFlightParams,
  GetFlightStatusByRouteParams,
  GetFlightStatusByAirportParams,
} from './types/flight-status.js';

// Flight Information Types
export type {
  FlightInformationTimestamp,
  FlightInformationTerminal,
  FlightInformationStatus,
  FlightInformationPoint,
  FlightInformationItem,
  FlightInformationResult,
  GetCustomerFlightInformationByFlightParams,
  GetCustomerFlightInformationByRouteParams,
  GetCustomerFlightInformationByAirportParams,
} from './types/flight-information.js';

// Nearest Airports Types
export type {
  NearestAirport,
  NearestAirportName,
  GetNearestAirportsParams,
  NearestAirportsResult,
} from './types/nearest-airports.js';
