import { normalizeMeta, type RawLhMeta } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validateDate, validateDateTime } from '../utils/date.js';
import { validateFlightNumber, validateIataAirportCode } from '../utils/fligth.js';
import { validatePaging } from '../utils/paging.js';
import type { ApiClient } from '../http/api-client.js';
import type { Carrier } from '../types/operations.js';
import type {
  FlightStatusItem,
  FlightStatusPoint,
  FlightStatusResult,
  GetFlightStatusByAirportParams,
  GetFlightStatusByFlightParams,
  GetFlightStatusByRouteParams,
} from '../types/flight-status.js';

type RawLhStatusCode = {
  Code?: string;
  Definition?: string;
};

type RawLhCarrier = {
  AirlineID?: string;
  FlightNumber?: string | number;
};

type RawLhTerminal = {
  Name?: string;
  Gate?: string;
};

type RawLhDateTimeNode = {
  DateTime?: string;
};

type RawLhFlightPoint = {
  AirportCode?: string;
  ScheduledTimeLocal?: RawLhDateTimeNode;
  ScheduledTimeUTC?: RawLhDateTimeNode;
  EstimatedTimeLocal?: RawLhDateTimeNode;
  EstimatedTimeUTC?: RawLhDateTimeNode;
  ActualTimeLocal?: RawLhDateTimeNode;
  ActualTimeUTC?: RawLhDateTimeNode;
  TimeStatus?: RawLhStatusCode;
  Terminal?: RawLhTerminal;
};

type RawLhFlight = {
  Departure?: RawLhFlightPoint;
  Arrival?: RawLhFlightPoint;
  MarketingCarrier?: RawLhCarrier;
  OperatingCarrier?: RawLhCarrier;
  Equipment?: {
    AircraftCode?: string;
  };
  FlightStatus?: RawLhStatusCode;
};

type RawLhFlightStatusResource = {
  FlightStatusResource?: {
    Flights?: {
      Flight?: RawLhFlight | RawLhFlight[];
    };
    Meta?: RawLhMeta;
  };
};

export class FlightStatusResource {
  constructor(private readonly http: ApiClient) {}

  async getByFlight(params: GetFlightStatusByFlightParams): Promise<FlightStatusResult> {
    const flightNumber = validateFlightNumber(params.flightNumber);
    const date = validateDate(params.date);

    const response = await this.http.get<RawLhFlightStatusResource>(
      `/operations/flightstatus/${encodeURIComponent(flightNumber)}/${date}`,
    );

    return this.normalizeResource(response);
  }

  async getByRoute(params: GetFlightStatusByRouteParams): Promise<FlightStatusResult> {
    validatePaging(params);

    const origin = validateIataAirportCode(params.origin, 'origin');
    const destination = validateIataAirportCode(params.destination, 'destination');
    const date = validateDate(params.date);

    const response = await this.http.get<RawLhFlightStatusResource>(
      `/operations/flightstatus/route/${origin}/${destination}/${date}`,
      {
        query: {
          serviceType: params.serviceType,
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  async getArrivals(params: GetFlightStatusByAirportParams): Promise<FlightStatusResult> {
    validatePaging(params);

    const airportCode = validateIataAirportCode(params.airportCode);
    const fromDateTime = validateDateTime(params.fromDateTime);

    const response = await this.http.get<RawLhFlightStatusResource>(
      `/operations/flightstatus/arrivals/${airportCode}/${fromDateTime}`,
      {
        query: {
          serviceType: params.serviceType,
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  async getDepartures(params: GetFlightStatusByAirportParams): Promise<FlightStatusResult> {
    validatePaging(params);

    const airportCode = validateIataAirportCode(params.airportCode);
    const fromDateTime = validateDateTime(params.fromDateTime);

    const response = await this.http.get<RawLhFlightStatusResource>(
      `/operations/flightstatus/departures/${airportCode}/${fromDateTime}`,
      {
        query: {
          serviceType: params.serviceType,
          limit: params.limit,
          offset: params.offset,
        },
      },
    );

    return this.normalizeResource(response);
  }

  private normalizeResource(raw: RawLhFlightStatusResource): FlightStatusResult {
    const resource = raw.FlightStatusResource;

    return {
      items: toArray(resource?.Flights?.Flight).map((flight) => this.normalizeFlight(flight)),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeFlight(raw: RawLhFlight): FlightStatusItem {
    const marketingCarrier = raw.MarketingCarrier
      ? this.normalizeCarrier(raw.MarketingCarrier)
      : undefined;
    const operatingCarrier = raw.OperatingCarrier
      ? this.normalizeCarrier(raw.OperatingCarrier)
      : undefined;
    const aircraftCode = raw.Equipment?.AircraftCode;
    const status = this.normalizeStatus(raw.FlightStatus);

    return {
      departure: this.normalizePoint(raw.Departure),
      arrival: this.normalizePoint(raw.Arrival),
      ...(marketingCarrier !== undefined ? { marketingCarrier } : {}),
      ...(operatingCarrier !== undefined ? { operatingCarrier } : {}),
      ...(aircraftCode !== undefined ? { aircraftCode } : {}),
      ...(status !== undefined ? { status } : {}),
    };
  }

  private normalizePoint(raw?: RawLhFlightPoint): FlightStatusPoint {
    const airportCode = raw?.AirportCode;
    const scheduledLocal = raw?.ScheduledTimeLocal?.DateTime;
    const scheduledUtc = raw?.ScheduledTimeUTC?.DateTime;
    const estimatedLocal = raw?.EstimatedTimeLocal?.DateTime;
    const estimatedUtc = raw?.EstimatedTimeUTC?.DateTime;
    const actualLocal = raw?.ActualTimeLocal?.DateTime;
    const actualUtc = raw?.ActualTimeUTC?.DateTime;
    const timeStatus = this.normalizeStatus(raw?.TimeStatus);
    const terminal = this.normalizeTerminal(raw?.Terminal);

    return {
      ...(airportCode !== undefined ? { airportCode } : {}),
      ...(scheduledLocal !== undefined ? { scheduledLocal } : {}),
      ...(scheduledUtc !== undefined ? { scheduledUtc } : {}),
      ...(estimatedLocal !== undefined ? { estimatedLocal } : {}),
      ...(estimatedUtc !== undefined ? { estimatedUtc } : {}),
      ...(actualLocal !== undefined ? { actualLocal } : {}),
      ...(actualUtc !== undefined ? { actualUtc } : {}),
      ...(timeStatus !== undefined ? { timeStatus } : {}),
      ...(terminal !== undefined ? { terminal } : {}),
    };
  }

  private normalizeStatus(raw?: RawLhStatusCode): FlightStatusItem['status'] {
    const code = raw?.Code;
    const description = raw?.Definition;

    if (code === undefined && description === undefined) {
      return undefined;
    }

    return {
      ...(code !== undefined ? { code } : {}),
      ...(description !== undefined ? { description } : {}),
    };
  }

  private normalizeTerminal(raw?: RawLhTerminal): FlightStatusPoint['terminal'] {
    const name = raw?.Name;
    const gate = raw?.Gate;

    if (name === undefined && gate === undefined) {
      return undefined;
    }

    return {
      ...(name !== undefined ? { name } : {}),
      ...(gate !== undefined ? { gate } : {}),
    };
  }

  private normalizeCarrier(raw: RawLhCarrier): Carrier {
    return {
      airlineId: raw.AirlineID ?? '',
      flightNumber: raw.FlightNumber !== undefined ? String(raw.FlightNumber) : '',
    };
  }
}
