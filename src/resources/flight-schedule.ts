import { normalizeMeta, type RawLhMeta } from '../utils/lh-meta.js';
import { toArray } from '../utils/arrays.js';
import { validateDateTime } from '../utils/date.js';
import { validateIataAirportCode } from '../utils/fligth.js';
import type { ApiClient } from '../http/api-client.js';
import type { Carrier } from '../types/operations.js';
import type {
  FlightSchedulesResult,
  GetFlightSchedulesParams,
  ScheduledJourney,
  ScheduledLeg,
  ScheduleEquipment,
} from '../types/flight-schedule.js';

type RawLhTerminal = {
  Name?: string;
};

type RawLhDateTimeNode = {
  DateTime?: string;
};

type RawLhPoint = {
  AirportCode?: string;
  ScheduledTimeLocal?: RawLhDateTimeNode;
  Terminal?: RawLhTerminal;
};

type RawLhCarrier = {
  AirlineID?: string;
  FlightNumber?: string | number;
};

type RawLhCompartment = {
  ClassCode?: string;
  ClassDesc?: string;
  FlyNet?: boolean | string;
  SeatPower?: boolean | string;
  Usb?: boolean | string;
  LiveTv?: boolean | string;
};

type RawLhEquipment = {
  AircraftCode?: string;
  OnBoardEquipment?: {
    InflightEntertainment?: boolean | string;
    Compartment?: RawLhCompartment | RawLhCompartment[];
  };
};

type RawLhFlight = {
  Departure?: RawLhPoint;
  Arrival?: RawLhPoint;
  MarketingCarrier?: RawLhCarrier;
  OperatingCarrier?: RawLhCarrier;
  Equipment?: RawLhEquipment;
  Details?: {
    Stops?: {
      StopQuantity?: string | number;
    };
    DaysOfOperation?: string;
    DatePeriod?: {
      Effective?: string;
      Expiration?: string;
    };
  };
};

type RawLhSchedule = {
  TotalJourney?: {
    Duration?: string;
  };
  Flight?: RawLhFlight | RawLhFlight[];
};

type RawLhScheduleResource = {
  ScheduleResource?: {
    Schedule?: RawLhSchedule | RawLhSchedule[];
    Meta?: RawLhMeta;
  };
};

export class FlightSchedulesResource {
  constructor(private readonly http: ApiClient) {}

  async get(params: GetFlightSchedulesParams): Promise<FlightSchedulesResult> {
    const origin = validateIataAirportCode(params.origin, 'origin');
    const destination = validateIataAirportCode(params.destination, 'destination');
    const fromDateTime = this.validateScheduleDateTime(params.fromDateTime);

    const response = await this.http.get<RawLhScheduleResource>(
      `/operations/schedules/${origin}/${destination}/${fromDateTime}`,
      {
        query: {
          directFlights: params.directFlights,
        },
      },
    );

    return this.normalizeResource(response);
  }

  private validateScheduleDateTime(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    return validateDateTime(value, 'fromDateTime');
  }

  private normalizeResource(raw: RawLhScheduleResource): FlightSchedulesResult {
    const resource = raw.ScheduleResource;

    return {
      items: toArray(resource?.Schedule).map((schedule) => this.normalizeSchedule(schedule)),
      meta: normalizeMeta(resource?.Meta),
    };
  }

  private normalizeSchedule(raw: RawLhSchedule): ScheduledJourney {
    const result: ScheduledJourney = {
      flights: toArray(raw.Flight).map((flight) => this.normalizeFlight(flight)),
    };

    if (raw.TotalJourney?.Duration) {
      result.totalDuration = raw.TotalJourney.Duration;
    }

    return result;
  }

  private normalizeFlight(raw: RawLhFlight): ScheduledLeg {
    const result: ScheduledLeg = {
      departure: this.normalizePoint(raw.Departure),
      arrival: this.normalizePoint(raw.Arrival),
    };

    if (raw.MarketingCarrier) {
      result.marketingCarrier = this.normalizeCarrier(raw.MarketingCarrier);
    }

    if (raw.OperatingCarrier) {
      result.operatingCarrier = this.normalizeCarrier(raw.OperatingCarrier);
    }

    if (raw.Equipment) {
      result.equipment = this.normalizeEquipment(raw.Equipment);
    }

    if (raw.Details?.Stops?.StopQuantity !== undefined) {
      result.stopQuantity = Number(raw.Details.Stops.StopQuantity);
    }

    if (raw.Details?.DaysOfOperation) {
      result.daysOfOperation = raw.Details.DaysOfOperation;
    }

    if (raw.Details?.DatePeriod?.Effective) {
      result.effectiveDate = raw.Details.DatePeriod.Effective;
    }

    if (raw.Details?.DatePeriod?.Expiration) {
      result.expirationDate = raw.Details.DatePeriod.Expiration;
    }

    return result;
  }

  private normalizeEquipment(raw: RawLhEquipment): ScheduleEquipment {
    const result: ScheduleEquipment = {
      compartments: toArray(raw.OnBoardEquipment?.Compartment).map((item) =>
        this.normalizeCompartment(item),
      ),
    };

    if (raw.AircraftCode) {
      result.aircraftCode = raw.AircraftCode;
    }

    if (raw.OnBoardEquipment?.InflightEntertainment !== undefined) {
      result.inflightEntertainment = this.toBoolean(raw.OnBoardEquipment.InflightEntertainment);
    }

    return result;
  }

  private normalizeCarrier(raw: RawLhCarrier): Carrier {
    return {
      airlineId: raw.AirlineID ?? '',
      flightNumber: raw.FlightNumber !== undefined ? String(raw.FlightNumber) : '',
    };
  }

  private normalizePoint(raw?: RawLhPoint): {
    airportCode?: string;
    scheduledDateTime?: string;
    terminal?: { name?: string };
  } {
    const result: {
      airportCode?: string;
      scheduledDateTime?: string;
      terminal?: { name?: string };
    } = {};

    if (raw?.AirportCode) {
      result.airportCode = raw.AirportCode;
    }

    if (raw?.ScheduledTimeLocal?.DateTime) {
      result.scheduledDateTime = raw.ScheduledTimeLocal.DateTime;
    }

    if (raw?.Terminal?.Name) {
      result.terminal = { name: raw.Terminal.Name };
    }

    return result;
  }

  private normalizeCompartment(item: RawLhCompartment): {
    classCode?: string;
    classDescription?: string;
    flyNet?: boolean;
    seatPower?: boolean;
    usb?: boolean;
    liveTv?: boolean;
  } {
    const result: {
      classCode?: string;
      classDescription?: string;
      flyNet?: boolean;
      seatPower?: boolean;
      usb?: boolean;
      liveTv?: boolean;
    } = {};

    if (item.ClassCode) {
      result.classCode = item.ClassCode;
    }

    if (item.ClassDesc) {
      result.classDescription = item.ClassDesc;
    }

    if (item.FlyNet !== undefined) {
      result.flyNet = this.toBoolean(item.FlyNet);
    }

    if (item.SeatPower !== undefined) {
      result.seatPower = this.toBoolean(item.SeatPower);
    }

    if (item.Usb !== undefined) {
      result.usb = this.toBoolean(item.Usb);
    }

    if (item.LiveTv !== undefined) {
      result.liveTv = this.toBoolean(item.LiveTv);
    }

    return result;
  }

  private toBoolean(value: boolean | string): boolean {
    return value === true || value === 'true';
  }
}
