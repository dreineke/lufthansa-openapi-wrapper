# Lufthansa OpenAPI Wrapper

A TypeScript/JavaScript wrapper for the Lufthansa OpenAPI, providing a clean, typed interface for accessing flight data, airport information, and airline services.

## Features

- 🛫 **Flight Operations**: Flight schedules, status, and real-time information
- ✈️ **Airport Data**: Airport details, nearest airports, and location data
- 🌍 **Geographic Information**: Cities, countries, and airport codes
- 🏢 **Airline Information**: Airline details and aircraft data
- 🔐 **OAuth Authentication**: Automatic token management and refresh
- 🔄 **Retry Logic**: Built-in retry with exponential backoff
- 📄 **Pagination Support**: Easy handling of paginated results
- 📝 **Full TypeScript Support**: Complete type definitions
- 🛡️ **Error Handling**: Comprehensive error handling and validation

## Installation

```bash
npm install lufthansa-openapi-wrapper
```

## Quick Start

### 1. Get API Credentials

First, register for Lufthansa OpenAPI access at [developer.lufthansa.com](https://developer.lufthansa.com) to obtain your:

- Client ID
- Client Secret

### 2. Basic Setup

```typescript
import { LufthansaApiClient } from 'lufthansa-openapi-wrapper';

const client = new LufthansaApiClient({
  oauth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});
```

### 3. Simple Example

```typescript
// Get airport information
const airport = await client.airports.getByCode('FRA');
console.log(airport?.names); // Frankfurt airport names in different languages

// Search for flights
const flights = await client.flightSchedule.get({
  origin: 'FRA',
  destination: 'LAX',
  fromDateTime: '2024-03-20',
  directFlights: true,
});
console.log(flights.items);
```

## Configuration Options

```typescript
const client = new LufthansaApiClient({
  // Required: OAuth credentials
  oauth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    tokenUrl: 'https://api.lufthansa.com/v1/oauth/token', // Optional, defaults to Lufthansa
  },

  // Optional: API configuration
  baseUrl: 'https://api.lufthansa.com', // Optional, defaults to Lufthansa API
  apiVersion: 'v1', // Optional, defaults to 'v1'
  timeoutMs: 30000, // Optional, request timeout (default: 10s)
  maxRetries: 3, // Optional, retry attempts (default: 3)
  userAgent: 'my-app/1.0', // Optional, custom user agent
});
```

## API Reference

### Airlines

```typescript
// Get all airlines (paginated)
const airlines = await client.airlines.list({ limit: 50, offset: 0 });

// Get specific airline by IATA code
const airline = await client.airlines.getByCode('LH');

// Get all airlines (auto-paginated)
const allAirlines = await client.airlines.listAll();
```

### Airports

```typescript
// Get all airports
const airports = await client.airports.list({
  limit: 100,
  lhOperated: true, // Only Lufthansa-operated airports
  group: 'LHOperated', // 'MilesAndMore' | 'LHOperated' | 'AllAirports'
});

// Get specific airport by IATA code
const airport = await client.airports.getByCode('FRA', { lang: 'EN' });

// Get nearest airports by coordinates
const nearestAirports = await client.nearestAirport.get({
  latitude: 50.0379,
  longitude: 8.5622,
  lang: 'EN',
});
```

### Cities

```typescript
// List cities
const cities = await client.cities.list({ limit: 50 });

// Get specific city
const city = await client.cities.getByCode('FRA', { lang: 'DE' });
```

### Countries

```typescript
// List all countries
const countries = await client.countries.list({ limit: 100 });

// Get specific country
const country = await client.countries.getByCode('DE', { lang: 'EN' });
```

### Aircraft

```typescript
// List aircraft types
const aircraft = await client.aircrafts.list({ limit: 100 });

// Get specific aircraft by code
const aircraftInfo = await client.aircrafts.getByCode('A380');
```

### Flight Schedules

```typescript
// Get flight schedules between airports
const schedules = await client.flightSchedule.get({
  origin: 'FRA',
  destination: 'JFK',
  fromDateTime: '2024-03-20', // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  directFlights: true, // Optional: only direct flights
});
```

### Flight Status

```typescript
// Get status by flight number
const status = await client.flightStatus.getByFlight({
  flightNumber: 'LH400',
  date: '2024-03-20',
});

// Get status by route
const routeStatus = await client.flightStatus.getByRoute({
  origin: 'FRA',
  destination: 'LAX',
  date: '2024-03-20',
  serviceType: 'passenger', // 'passenger' | 'cargo' | 'all'
  limit: 50,
});

// Get arrivals at airport
const arrivals = await client.flightStatus.getArrivals({
  airportCode: 'FRA',
  fromDateTime: '2024-03-20T08:00',
  serviceType: 'passenger',
});

// Get departures from airport
const departures = await client.flightStatus.getDepartures({
  airportCode: 'FRA',
  fromDateTime: '2024-03-20T08:00',
});
```

### Customer Flight Information

```typescript
// Get detailed flight information
const flightInfo = await client.customerFlightInformation.getByFlight({
  flightNumber: 'LH400',
  date: '2024-03-20',
});

// Get flight information by route
const routeInfo = await client.customerFlightInformation.getByRoute({
  origin: 'FRA',
  destination: 'LAX',
  date: '2024-03-20',
});

// Get arrival information
const arrivalInfo = await client.customerFlightInformation.getArrivals({
  airportCode: 'FRA',
  fromDateTime: '2024-03-20T08:00',
});

// Get departure information
const departureInfo = await client.customerFlightInformation.getDepartures({
  airportCode: 'FRA',
  fromDateTime: '2024-03-20T08:00',
});
```

## Data Types

The wrapper provides comprehensive TypeScript types for all API responses:

```typescript
// Airport information
type Airport = {
  airportCode: string;
  cityCode?: string;
  countryCode?: string;
  locationType?: string;
  utcOffset?: string;
  timeZoneId?: string;
  latitude?: number;
  longitude?: number;
  names: AirportName[];
};

// Flight schedule
type ScheduledJourney = {
  totalDuration?: string;
  flights: ScheduledLeg[];
};

// Flight status
type FlightStatusItem = {
  departure: FlightStatusPoint;
  arrival: FlightStatusPoint;
  marketingCarrier?: Carrier;
  operatingCarrier?: Carrier;
  aircraftCode?: string;
  status?: FlightStatusTimeStatus;
};
```

## Pagination

The wrapper supports both manual and automatic pagination:

```typescript
// Manual pagination
const page1 = await client.airports.list({ limit: 50, offset: 0 });
const page2 = await client.airports.list({ limit: 50, offset: 50 });

// Automatic pagination (fetches all results)
const allAirports = await client.airports.listAll({ limit: 100 });
```

## Error Handling

The wrapper provides detailed error information:

```typescript
import { ApiError } from 'lufthansa-openapi-wrapper';

try {
  const flight = await client.flightStatus.getByFlight({
    flightNumber: 'INVALID',
    date: '2024-03-20',
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.log(`API Error: ${error.status} - ${error.message}`);
    console.log('Response body:', error.body);
  } else {
    console.log('Other error:', error);
  }
}
```

## Common Error Cases

- **401 Unauthorized**: Invalid OAuth credentials
- **429 Too Many Requests**: Rate limit exceeded (automatic retry with backoff)
- **404 Not Found**: Resource not found (e.g., invalid airport code)
- **400 Bad Request**: Invalid parameters (e.g., malformed date)

## Date and Time Formats

The API accepts different date/time formats depending on the endpoint:

- **Dates**: `YYYY-MM-DD` (e.g., `2024-03-20`)
- **Date-Times**: `YYYY-MM-DDTHH:mm` (e.g., `2024-03-20T08:30`)
- **Airport Codes**: 3-letter IATA codes (e.g., `FRA`, `LAX`)
- **Flight Numbers**: Airline code + flight number (e.g., `LH400`)

## Advanced Usage

### Custom Configuration

```typescript
const client = new LufthansaApiClient({
  oauth: {
    clientId: process.env.LUFTHANSA_CLIENT_ID!,
    clientSecret: process.env.LUFTHANSA_CLIENT_SECRET!,
  },
  timeoutMs: 30000, // 30 seconds
  maxRetries: 5, // More aggressive retrying
  userAgent: 'MyApp/1.0 (+https://example.com)',
});
```

### Environment Variables

Create a `.env` file:

```env
LUFTHANSA_CLIENT_ID=your_client_id
LUFTHANSA_CLIENT_SECRET=your_client_secret
```

```typescript
import { config } from 'dotenv';
config();

const client = new LufthansaApiClient({
  oauth: {
    clientId: process.env.LUFTHANSA_CLIENT_ID!,
    clientSecret: process.env.LUFTHANSA_CLIENT_SECRET!,
  },
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow the existing code style (use Prettier)
- Add types for all new functionality
- Include error handling and validation
- Update documentation

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Disclaimer

This is an unofficial wrapper for the Lufthansa OpenAPI. It is not affiliated with or endorsed by Deutsche Lufthansa AG. Please refer to the official [Lufthansa OpenAPI documentation](https://developer.lufthansa.com) for the most up-to-date information about the API.

## Support

- 📖 [Official Lufthansa API Documentation](https://developer.lufthansa.com)
- 🐛 [Issue Tracker](https://github.com/dreineke/lufthansa-openapi-wrapper/issues)

## Changelog

### 1.0.0

- Initial release
- Full TypeScript support
- OAuth token management
- Comprehensive API coverage
- Automatic retry and pagination
- Error handling and validation
