import { AircraftResource } from './resources/aircrafts.js';
import { AirlinesResource } from './resources/airlines.js';
import { AirportsResource } from './resources/airports.js';
import { ApiClient } from './http/api-client.js';
import { CitiesResource } from './resources/cities.js';
import { CountriesResource } from './resources/countries.js';
import { CustomerFlightInformationResource } from './resources/flight-information.js';
import { FlightSchedulesResource } from './resources/flight-schedule.js';
import { FlightStatusResource } from './resources/flight-status.js';
import { NearestAirportsResource } from './resources/nearest-airports.js';
import type { LufthansaClientConfig } from './types/common.js';

export class LufthansaApiClient {
  public readonly aircrafts: AircraftResource;
  public readonly airlines: AirlinesResource;
  public readonly airports: AirportsResource;
  public readonly cities: CitiesResource;
  public readonly countries: CountriesResource;
  public readonly customerFlightInformation: CustomerFlightInformationResource;
  public readonly flightSchedule: FlightSchedulesResource;
  public readonly flightStatus: FlightStatusResource;
  public readonly nearestAirport: NearestAirportsResource;

  private readonly http: ApiClient;

  constructor(config: LufthansaClientConfig) {
    this.http = new ApiClient(config);
    this.aircrafts = new AircraftResource(this.http);
    this.airlines = new AirlinesResource(this.http);
    this.airports = new AirportsResource(this.http);
    this.cities = new CitiesResource(this.http);
    this.countries = new CountriesResource(this.http);
    this.customerFlightInformation = new CustomerFlightInformationResource(this.http);
    this.flightSchedule = new FlightSchedulesResource(this.http);
    this.flightStatus = new FlightStatusResource(this.http);
    this.nearestAirport = new NearestAirportsResource(this.http);
  }
}
