import type { Carrier, OperationsMeta } from './operations.js';

export type ScheduleCompartment = {
  classCode?: string;
  classDescription?: string;
  flyNet?: boolean;
  seatPower?: boolean;
  usb?: boolean;
  liveTv?: boolean;
};

export type ScheduleEquipment = {
  aircraftCode?: string;
  inflightEntertainment?: boolean;
  compartments: ScheduleCompartment[];
};

export type ScheduleTerminal = {
  name?: string;
};

export type SchedulePoint = {
  airportCode?: string;
  scheduledDateTime?: string;
  terminal?: ScheduleTerminal;
};

export type ScheduledLeg = {
  departure: SchedulePoint;
  arrival: SchedulePoint;
  marketingCarrier?: Carrier;
  operatingCarrier?: Carrier;
  equipment?: ScheduleEquipment;
  stopQuantity?: number;
  daysOfOperation?: string;
  effectiveDate?: string;
  expirationDate?: string;
};

export type ScheduledJourney = {
  totalDuration?: string;
  flights: ScheduledLeg[];
};

export type FlightSchedulesResult = {
  items: ScheduledJourney[];
  meta: OperationsMeta;
};

export type GetFlightSchedulesParams = {
  origin: string;
  destination: string;
  fromDateTime: string;
  directFlights?: boolean;
};
