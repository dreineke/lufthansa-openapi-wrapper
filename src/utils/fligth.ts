export function validateIataAirportCode(code: string, fieldName = 'airportCode'): string {
  const normalized = code.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`${fieldName} must be a 3-letter IATA airport code`);
  }

  return normalized;
}

export function validateFlightNumber(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z0-9]{2}\d{1,4}$/.test(normalized)) {
    throw new Error('flightNumber must be airline code + numeric flight number, e.g. LH400');
  }

  return normalized;
}
