# Ecowitt MCP Server Implementation Plan

## Overview
This project implements a Message Control Protocol (MCP) server for the Ecowitt Weather API v3. It allows MCP clients to interact with Ecowitt weather stations and sensors through a standardized messaging protocol, abstracting away the complexities of the Ecowitt API. This server will leverage modern JavaScript features and a minimal dependency footprint.

## Core Features
- MCP server implementation using @modelcontextprotocol/sdk
- Ecowitt API integration (v3) for data retrieval
- Authentication and credential management
  - MCP client authentication
  - Ecowitt Application Key and API Key management
- Message handling for:
  - Device discovery and management (list, info)
  - Real-time weather data
  - Historical data access
- Rate limiting and request management
- Proper error propagation to MCP clients
- Test-Driven Development (TDD) approach for robustness

## Technical Architecture

### Core Dependencies
- `@modelcontextprotocol/sdk`: MCP server framework
- `@biomejs/biome`: Modern all-in-one dev toolkit (linting, formatting)
- `vitest`: Modern, fast testing framework
- `dotenv`: Configuration management
- `debug`: Debugging utilities
- Built-in Node.js modules (e.g., `node:events`, `node:crypto`, native `fetch` API)

### Server Components
1. MCP Server Core
   - Message handling framework
   - Client connection management
   - Authentication and authorization
   - Error handling and propagation

2. Ecowitt Integration
   - API client using native `fetch`
   - Rate limiting implementation
   - Response transformation to MCP messages
   - Error mapping
   - Device name to MAC address resolution

3. Device Management
   - Device discovery
   - Information retrieval

### Message Types
1. Device Operations
   - `device.list`: List all available devices (returns name, MAC, status)
   - `device.info`: Get device information by name (resolves name → MAC → device details)

2. Weather Data
   - `weather.realtime`: Get current weather readings by device name
   - `weather.history`: Get historical weather data by device name with date range

### Device Flow
Users interact with devices by name:
1. `device.list` is called by an MCP client, and the server fetches the device list from Ecowitt, returning devices with their names and MACs.
2. The MCP client then requests data for a specific device using its name (e.g., `weather.realtime` for "My Backyard Station").
3. The MCP server internally resolves the provided device name to its corresponding MAC address (e.g., "My Backyard Station" → "AABBCCDD1122").
4. The MCP server then calls the Ecowitt API using the MAC address as a parameter.

## Project Structure
```
ecowitt-mcp/
├── server/           # MCP server implementation
│   ├── index.js     # Server entry point
│   ├── auth.js      # Authentication handling
│   └── handlers/    # Message handlers for MCP operations
│       ├── device.js
│       └── weather.js
├── ecowitt/         # Ecowitt API integration layer
│   ├── client.js    # API client using fetch
│   ├── transform.js # Response transformations and data mapping
│   └── errors.js    # Error mapping utilities
├── config/          # Configuration management
├── utils/           # Shared utilities (e.g., rate limiter)
└── test/           # Test suite
```

## Implementation Phases

### Phase 1: Core Server & `device.list` Integration (TDD)
1.  **Project Initialization & Setup**:
    *   Initialize Node.js project.
    *   Install core dependencies (`@modelcontextprotocol/sdk`, `dotenv`, `debug`).
    *   Configure `vitest` for testing.
    *   Configure `@biomejs/biome` for linting and formatting.
    *   Establish basic project directory structure.
2.  **MCP Server Core**:
    *   Write tests for basic MCP server instantiation and message routing.
    *   Implement minimal MCP server setup.
    *   Write tests for client connection lifecycle.
    *   Implement client connection management.
    *   Write tests for authentication (handling `application_key` and `api_key` via environment variables or runtime config).
    *   Implement authentication framework.
3.  **Ecowitt API Client - `device.list` Focus**:
    *   Write tests for `fetch` wrapper (handling base URL, headers).
    *   Implement a wrapper around native `fetch` for Ecowitt API calls.
    *   Write tests for `device/list` endpoint authentication and response parsing.
    *   Implement `ecowitt/client.js` with a `listDevices()` method that calls `GET /api/v3/device/list`.
    *   Implement basic error handling and response transformation for `listDevices`.
4.  **MCP Message Handler - `device.list`**:
    *   Write tests for the `device.list` message handler, ensuring it calls the Ecowitt client and transforms the response.
    *   Implement the `server/handlers/device.js` module to handle `device.list` messages.
    *   Integrate the `device.list` handler into the main MCP server.

### Phase 2: Expand Ecowitt API Operations (TDD)
1.  **Ecowitt Client Enhancements**:
    *   Write tests for device name to MAC address resolution.
    *   Implement `ecowitt/transform.js` for name-to-MAC mapping, potentially caching the device list.
    *   Write tests for `device/info`, `real_time`, and `history` endpoints.
    *   Implement `getDeviceInfo(mac)`, `getRealtimeData(mac)`, `getHistoricalData(mac, start, end)` methods in `ecowitt/client.js`.
    *   Refine error mapping (`ecowitt/errors.js`) for various Ecowitt API error codes.
2.  **Error Handling & Retries**:
    *   Write tests for error response parsing and classification.
    *   Implement proper error mapping from Ecowitt API responses to MCP errors.
    *   Write tests for automatic retries with exponential backoff for transient errors.
    *   Implement retry logic for network failures and temporary API issues.

### Phase 3: Complete Message Handlers (TDD)
1.  **Device Operations Handlers**:
    *   Write tests for the `device.info` MCP handler.
    *   Implement the `device.info` handler, utilizing the name-to-MAC resolution.
2.  **Weather Data Handlers**:
    *   Write tests for the `weather.realtime` MCP handler.
    *   Implement the `weather.realtime` handler, using device name resolution.
    *   Write tests for the `weather.history` MCP handler.
    *   Implement the `weather.history` handler, including date range validation and using device name resolution.

### Phase 4: Integration Testing & Documentation
1.  **Integration Tests**:
    *   Write end-to-end integration tests using `vitest` to simulate MCP client interactions with the server, verifying message flow and data transformations.
    *   Include tests for authentication, rate limiting, and various error scenarios.
    *   (Optional, with caution) Implement tests against the *actual* Ecowitt API using dedicated test credentials.
2.  **Documentation**:
    *   Generate JSDoc for all public API methods and internal modules.
    *   Create a detailed `README.md` including setup instructions, configuration guide, and examples of MCP messages.
    *   Document the MCP message schemas supported by the server.
    *   Provide examples of how an MCP client would interact with this server.

## Error Handling
Based on Ecowitt API v3 documentation:

### Standard Response Format
```json
{
  "code": 0,        // 0 = success, non-zero = error
  "msg": "success", // Error message if code != 0
  "time": 1234567890,
  "data": {...}     // Response data (only if code = 0)
}
```

### Error Codes
-   **Authentication Errors**: Invalid `application_key` or `api_key` (Ecowitt specific, and MCP client auth).
-   **Parameter Errors**: Missing required parameters, invalid MAC address, invalid date formats.
-   **Rate Limiting**: API quota exceeded, too many requests per minute (handled by responding appropriately to Ecowitt's rate limit responses).
-   **Device Errors**: Device not found by name/MAC, device offline, no recent data.
-   **Network Errors**: Connection timeout, DNS resolution failures, general network unavailability.
-   **MCP Errors**: Invalid message format, unsupported MCP operations, authorization failures.
-   **Validation Errors**: Invalid date ranges, malformed device names or other input.
-   **Data Parsing Errors**: Malformed JSON responses from Ecowitt API.

## Security Considerations
-   MCP client authentication and authorization.
-   Secure storage of Ecowitt `application_key` and `api_key` (e.g., via environment variables).
-   Proper handling of Ecowitt API rate limit responses.
-   Input validation for all incoming MCP messages and parameters sent to Ecowitt.
-   Safe error messages (avoid leaking sensitive information like API keys or internal server details).
-   Environment variable protection (e.g., using `.env` files and ensuring they are not committed).
-   HTTPS enforcement for Ecowitt API calls.
-   Request signing and validation (if the MCP SDK supports this for client authentication).

## Modern JavaScript Features Used
-   Native `fetch` API for HTTP requests.
-   ESM modules for better modularity and tree-shaking potential.
-   Class fields and private class members (`#`) for cleaner class definitions.
-   `AbortController` for request timeouts and cancellation.
-   `URL` and `URLSearchParams` for robust URL manipulation.
-   Web Streams API (if applicable for large data, though less likely for this API).

## Future Enhancements
-   Advanced caching strategies for frequently accessed data (e.g., device lists, recent real-time data).
-   Multi-device batching for `realtime` or `history` if the Ecowitt API ever supports it.
-   Custom alert configurations based on sensor readings.
-   Metrics and monitoring integration for server health and API usage.
-   Horizontal scaling support for the MCP server.
-   Optional TypeScript type definitions for the SDK and API responses.