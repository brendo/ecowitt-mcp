# Ecowitt MCP Server Implementation Plan

## Overview
This project implements a Message Control Protocol (MCP) server for the Ecowitt Weather API v3. It allows MCP clients to interact with Ecowitt weather stations and sensors through standard MCP primitives, abstracting away the complexities of the Ecowitt API. This server will leverage modern JavaScript features and a minimal dependency footprint.

## Core Features
- MCP server implementation using `@modelcontextprotocol/sdk`.
- Ecowitt API integration (v3) for data retrieval.
- Authentication and credential management for the Ecowitt API.
- **MCP `resources` Primitive**:
  - `resources/list`: Discover all available weather devices.
  - `resources/read`: Get full details for a specific device.
- Robust error handling using custom error classes and a centralized MCP error mapper.
- Test-Driven Development (TDD) approach for robustness.

## Technical Architecture

### Core Dependencies
- `@modelcontextprotocol/sdk`: MCP server framework.
- `@biomejs/biome`: Modern all-in-one dev toolkit (linting, formatting).
- `vitest`: Modern, fast testing framework.
- `debug`: Debugging utilities.
- Built-in Node.js modules (e.g., `node:crypto`, native `fetch` API).

### Server Components
1. **MCP Server Core**:
   - Message handling framework for MCP primitives.
   - Client connection management (`StdioServerTransport`).
   - Centralized error mapping to MCP-compliant responses.

2. **Ecowitt Integration (`src/ecowitt/`)**:
   - API client using native `fetch` (`client.js`).
   - Custom error classes for API and data parsing issues (`errors.js`).

3. **Handlers (`src/server/handlers/`)**:
   - Business logic for fetching and transforming Ecowitt data into MCP-compliant objects.
   - Propagates specific errors for handling by the MCP server core.

4. **Utilities (`src/utils/`)**:
   - Shared custom error base classes (`errors.js`).
   - Centralized MCP error response formatter (`src/server/utils/mcp_error_handler.js`).

### MCP Primitives

The server exposes the standard MCP `resources` primitive for device discovery and inspection.

1.  **`resources/list`**:
    *   **Description**: Retrieves a list of all available Ecowitt devices.
    *   **Returns**: An array of MCP `Resource` objects, where each resource represents a weather device. The resource `uri` will be in the format `ecowitt://device/{mac}`.

2.  **`resources/read`**:
    *   **Description**: Retrieves the full, detailed data for a single device.
    *   **Parameters**: A `uri` identifying the device (e.g., `ecowitt://device/{mac}`).
    *   **Returns**: The complete JSON data for the device as `ResourceContents`.

## Project Structure
```
ecowitt-mcp/
├── src/
│   ├── server/           # MCP server implementation
│   │   ├── index.js     # Server entry point and MCP primitive registration
│   │   ├── handlers/    # Business logic and data transformation
│   │   │   └── device.js
│   │   └── utils/       # Server-specific utilities
│   │       └── mcp_error_handler.js
│   ├── ecowitt/         # Ecowitt API integration layer
│   │   ├── client.js    # API client using fetch
│   │   └── errors.js    # Ecowitt-specific custom error classes
│   └── utils/           # Shared utilities
│       └── errors.js    # Base custom error classes (CustomError, HandlerError)
└── test/            # Test suite
```

## Implementation Phases

### Phase 1: Core Server & `resources/list` Integration (COMPLETE)
1.  **Project Initialization & Setup**: Established project structure, installed dependencies, and configured Biome and Vitest.
2.  **MCP Server Core**: Implemented minimal MCP server setup in `src/server/index.js`.
3.  **Custom Error Handling**: Created a robust error hierarchy with `CustomError`, `EcowittApiError`, `DeviceNotFoundError`, etc. Implemented a centralized error handler `toMcpErrorResponse`.
4.  **Ecowitt API Client**: Implemented `src/ecowitt/client.js` with a `listDevices()` method that calls the Ecowitt API and throws custom errors on failure.
5.  **MCP `resources/list` Handler**: Implemented `src/server/handlers/device.js` to fetch raw device data and transform it into an array of MCP `Resource` objects. Integrated the handler into the main MCP server to respond to `resources/list` requests.

### Phase 2: Implement `resources/read` (TDD)
1.  **Ecowitt Client Enhancement**: Implement a `getDeviceInfo(mac)` method in `src/ecowitt/client.js` to call the `GET /api/v3/device/info` endpoint.
2.  **Handler Implementation**:
    *   Write tests for a handler method (e.g., `handleDeviceRead(uri)`) in `src/server/handlers/device.js`.
    *   Implement the handler to parse the MAC address from the resource `uri`, call `getDeviceInfo`, and return the device data formatted as `ResourceContents`.
3.  **MCP Integration**: Register the `read` operation in the `resources` primitive in `src/server/index.js`, connecting it to the new handler.

### Phase 3: Implement Weather `tools` (TDD)
1.  **Ecowitt Client Expansion**: Add methods for `real_time` and `history` endpoints to `src/ecowitt/client.js`.
2.  **Tool Error Handling**: Create a `toMcpOperationErrorResult` utility to format tool execution errors (as opposed to protocol errors) with `isError: true`.
3.  **Tool Handlers**: Create `src/server/handlers/weather.js` to handle the business logic for weather data requests.
4.  **MCP Integration**:
    *   Register `realtime_weather` and `weather_history` tools in `src/server/index.js`.
    *   Ensure the handlers use `toMcpOperationErrorResult` for API or data processing failures.

### Phase 4: Integration Testing & Documentation
1.  **Integration Tests**: Write end-to-end tests simulating an MCP client interacting with the server.
2.  **Documentation**: Create a detailed `README.md` with setup, configuration, and usage examples. Document the exposed MCP resources and tools.

## Error Handling
The server uses a hierarchy of custom error classes extending a base `CustomError`.
- **`CustomError` (`src/utils/errors.js`)**: Base class providing `code`, `message`, and `type`.
- **`EcowittApiError` (`src/ecowitt/errors.js`)**: For errors returned by the Ecowitt API.
- **`DeviceNotFoundError` (`src/ecowitt/errors.js`)**: For when a specific device isn't found.
- **`DataParsingError` (`src/utils/errors.js`)**: For issues like malformed JSON.
- **`HandlerError` (`src/utils/errors.js`)**: For unexpected errors within handler logic.

A centralized function, `toMcpErrorResponse`, located in `src/server/utils/mcp_error_handler.js`, catches these errors at the MCP boundary (`src/server/index.js`) and transforms them into compliant JSON-RPC error responses. This keeps business logic clean (throwing errors) and ensures consistent error reporting to the client. Tool execution errors will be handled separately to report failures within a successful MCP response.
