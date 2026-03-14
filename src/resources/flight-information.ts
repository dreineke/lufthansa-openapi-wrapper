import { normalizeMeta, type RawLhMeta } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validateDate, validateDateTime } from '../utils/date.js';
import { validateFlightNumber, validateIataAirportCode } from '../utils/fligth.js';
import { validatePaging } from '../utils/paging.js';
import type { ApiClient } from '../http/api-client.js';
import type { Carrier } from '../types/operations.js';
import type {
  FlightInformationItem,
  FlightInformationPoint,
  FlightInformationResult,
  FlightInformationTimestamp,
  GetCustomerFlightInformationByAirportParams,
  GetCustomerFlightInformationByFlightParams,
  GetCustomerFlightInformationByRouteParams,
} from '../types/flight-information.js';

type RawLhStatus = {
  Code?: string;
  Description?: string;
};

type RawLhCarrier = {
  AirlineID?: string;
  FlightNumber?: string | number;
};

type RawLhTerminal = {
  Name?: string;
  Gate?: string;
};

type RawLhTimestamp = {
  Date?: string;
  Time?: string;
  DateTime?: string;
};

type RawLhPoint = {
  AirportCode?: string;
  Scheduled?: RawLhTimestamp;
  Estimated?: RawLhTimestamp;
  Actual?: RawLhTimestamp;
  Terminal?: RawLhTerminal;
  Status?: RawLhStatus;
};

type RawLhFlight = {
  Departure?: RawLhPoint;
  Arrival?: RawLhPoint;
  MarketingCarrierList?: {
    MarketingCarrier?: RawLhCarrier | RawLhCarrier[];
  };
  OperatingCarrier?: RawLhCarrier;
  Equipment?: {
    AircraftCode?: string;
  };
  Status?: RawLhStatus;
};

type RawLhFlightInformationResource = {
  FlightInformation?: {
    Flights?: {
      Flight?: RawLhFlight | RawLhFlight[];
    };
    Meta?: RawLhMeta;
  };
};

export class CustomerFlightInformationResource {
  constructor(private readonly http: ApiClient) {}

  async getByFlight(
    params: GetCustomerFlightInformationByFlightParams,
  ): Promise<FlightInformationResult> {
    const flightNumber = validateFlightNumber(params.flightNumber);
    const date = validateDate(params.date);

    const response = await this.http.get<RawLhFlightInformationResource>(
      `/operations/customerflightinformation/${encodeURIComponent(flightNumber)}/${date}`,
    );

    return this.normalizeResource(response);
  }

  async getByRoute(
    params: GetCustomerFlightInformationByRouteParams,
  ): Promise<FlightInformationResult> {
    validatePaging(params);

    const origin = validateIataAirportCode(params.origin, 'origin');
    const destination = validateIataAirportCode(params.destination, 'destination');
    const date = validateDate(params.date);

    const response = await this.http.get<RawLhFlightInformationResource>(
      `/operations/customerflightinformation/route/${origin}/${destination}/${date}`,
      {
        query: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  async getArrivals(
    params: GetCustomerFlightInformationByAirportParams,
  ): Promise<FlightInformationResult> {
    validatePaging(params);

    const airportCode = validateIataAirportCode(params.airportCode);
    const fromDateTime = validateDateTime(params.fromDateTime);

    const response = await this.http.get<RawLhFlightInformationResource>(
      `/operations/customerflightinformation/arrivals/${airportCode}/${fromDateTime}`,
      {
        query: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  async getDepartures(
    params: GetCustomerFlightInformationByAirportParams,
  ): Promise<FlightInformationResult> {
    validatePaging(params);

    const airportCode = validateIataAirportCode(params.airportCode);
    const fromDateTime = validateDateTime(params.fromDateTime);

    const response = await this.http.get<RawLhFlightInformationResource>(
      `/operations/customerflightinformation/departures/${airportCode}/${fromDateTime}`,
      {
        query: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  private normalizeResource(raw: RawLhFlightInformationResource): FlightInformationResult {
    const resource = raw.FlightInformation;

    return {
      items: toArray(resource?.Flights?.Flight).map((flight) => this.normalizeFlight(flight)),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeFlight(raw: RawLhFlight): FlightInformationItem {
    return {
      departure: this.normalizePoint(raw.Departure),
      arrival: this.normalizePoint(raw.Arrival),
      marketingCarriers: toArray(raw.MarketingCarrierList?.MarketingCarrier).map((carrier) =>
        this.normalizeCarrier(carrier),
      ),
      ...(raw.OperatingCarrier && {
        operatingCarrier: this.normalizeCarrier(raw.OperatingCarrier),
      }),
      ...(raw.Equipment?.AircraftCode && { aircraftCode: raw.Equipment.AircraftCode }),
      ...(raw.Status && {
        status: {
          ...(raw.Status.Code !== undefined && { code: raw.Status.Code }),
          ...(raw.Status.Description !== undefined && { description: raw.Status.Description }),
        },
      }),
    };
  }

  private normalizePoint(raw?: RawLhPoint): FlightInformationPoint {
    return {
      ...(raw?.AirportCode && { airportCode: raw.AirportCode }),
      ...(raw?.Scheduled && { scheduled: this.normalizeTimestamp(raw.Scheduled) }),
      ...(raw?.Estimated && { estimated: this.normalizeTimestamp(raw.Estimated) }),
      ...(raw?.Actual && { actual: this.normalizeTimestamp(raw.Actual) }),
      ...(raw?.Terminal && {
        terminal: {
          ...(raw.Terminal.Name !== undefined && { name: raw.Terminal.Name }),
          ...(raw.Terminal.Gate !== undefined && { gate: raw.Terminal.Gate }),
        },
      }),
      ...(raw?.Status && {
        status: {
          ...(raw.Status.Code !== undefined && { code: raw.Status.Code }),
          ...(raw.Status.Description !== undefined && { description: raw.Status.Description }),
        },
      }),
    };
  }

  private normalizeTimestamp(raw: RawLhTimestamp): FlightInformationTimestamp {
    return {
      ...(raw.Date !== undefined ? { date: raw.Date } : {}),
      ...(raw.Time !== undefined ? { time: raw.Time } : {}),
      ...(raw.DateTime !== undefined ? { dateTime: raw.DateTime } : {}),
    };
  }

  private normalizeCarrier(raw: RawLhCarrier): Carrier {
    return {
      airlineId: raw.AirlineID ?? '',
      flightNumber: raw.FlightNumber !== undefined ? String(raw.FlightNumber) : '',
    };
  }
}
