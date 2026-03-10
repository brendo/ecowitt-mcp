## Ecowitt MCP Server – Agent Guide

This guide explains **how AI agents should use the Ecowitt MCP server** to work with a user’s Ecowitt weather stations.

---

## Overview

- **Purpose**: Fetch real‑time and historical weather data from the user’s Ecowitt stations via MCP tools.
- **Primary flow**:  
  1. **Discover devices** with `get_devices`.  
  2. Use a device’s **`mac`** to call `get_device_realtime_info` or `get_device_historical_info`.  
  3. Optionally call `get_current_datetime` for current UTC time.

Your MCP host may prefix tool names (for example, `ecowitt__get_devices`), but the logical tool names and arguments below remain the same.

---

## Response formats (for SDK authors)

This server uses both `content` and `structuredContent` in tool responses

If your MCP client or SDK only supports a `content` field (or requires it), you can:

1. Parse the `content` array normally (for example, take the first text item and `JSON.parse` it), or  
2. Use a more permissive result model that allows both `content` and `structuredContent`, and fall back to `structuredContent` when needed.

In all cases, the **tool’s JSON schema describes the shape of the `structuredContent` object** (`devices`, `history`, `datetime`, etc.). The server always returns that structured JSON; some SDKs simply ignore it unless explicitly configured to handle `structuredContent`.

---

## Tools

### get_devices

- **What it does**:  
  List all Ecowitt weather station devices available to the user.
- **When to use**:  
  **Always call this first** when you need to work with Ecowitt data. It gives you the valid `mac` values for other tools.
- **Input**:  
  - No arguments.
- **Output (structured)**:  
  - `devices`: array of objects with fields:
    - `uri`: device URI  
    - `name`: device name  
    - `mac`: device MAC address (use this with other tools)  
    - `type`: numeric device type  
    - `stationType`: device station type  
    - `dateZoneId`: device timezone  
    - `longitude`, `latitude`: device coordinates  

**Usage example**

```json
{
  "tool": "ecowitt__get_devices",
  "arguments": {}
}
```

Pick a device and reuse its `mac` value as input to the other tools.

---

### get_device_realtime_info

- **What it does**:  
  Get **current real‑time measurements** for a single Ecowitt device.
- **When to use**:  
  When the user asks about **current** weather or live sensor readings.
- **Required input**:
  - **`mac`** (string):  
    - **Must come from** `get_devices` (`devices[i].mac`).  
    - Accepted formats (case‑insensitive):  
      - `AA:BB:CC:DD:EE:FF`  
      - `AABBCCDDEEFF`
- **Optional input**:
  - **`callback`** (string, optional):  
    - Subset of data to return.  
    - Examples: `"all"`, `"outdoor"`, `"indoor.humidity"`.  
    - If omitted, a sensible default set of fields is returned.
  - **Unit options (all optional)**:
    - `temp_unitid`: `"C"` = °C, `"F"` = °F (default if omitted)  
    - `pressure_unitid`: `"hPa"`, `"inHg"` (default), or `"mmHg"`  
    - `wind_speed_unitid`: `"mps"`, `"kmh"`, `"knots"`, `"mph"` (default), `"bft"`, or `"fpm"`  
    - `rainfall_unitid`: `"mm"` or `"in"` (default)  
    - `solar_irradiance_unitid`: `"lux"`, `"fc"`, or `"Wm2"` (default)  
    - `capacity_unitid`: `"L"` (default), `"m3"`, or `"gal"`  
  - If you are **unsure about units, omit all unit fields** and defaults will be used.

**Typical usage (defaults for units)**

```json
{
  "tool": "ecowitt__get_device_realtime_info",
  "arguments": {
    "mac": "<mac from get_devices>"
  }
}
```

**Usage with explicit units and subset of data**

```json
{
  "tool": "ecowitt__get_device_realtime_info",
  "arguments": {
    "mac": "<mac from get_devices>",
    "callback": "outdoor",
    "temp_unitid": "C",
    "wind_speed_unitid": "mph"
  }
}
```

---

### get_device_historical_info

- **What it does**:  
  Get **historical measurements** for a single device over a **time range**.
- **When to use**:  
  When the user asks about **past** weather, trends, or statistics over time.
- **Required input**:
  - **`mac`** (string):  
    - From `get_devices` (`devices[i].mac`).  
    - Formats: `AA:BB:CC:DD:EE:FF` or `AABBCCDDEEFF` (case‑insensitive).
  - **`start_date`** (string):  
    - Start of time range, in the **device’s timezone**.  
    - Format: `"YYYY-MM-DD HH:mm:ss"` (for example, `"2025-12-25 00:00:00"`).
  - **`end_date`** (string):  
    - End of time range, in the **device’s timezone**.  
    - Same format: `"YYYY-MM-DD HH:mm:ss"`.
  - **`call_back`** (string):  
    - Comma‑separated list of field groups to return.  
    - Examples:  
      - `"all"`  
      - `"outdoor.temp,indoor.humidity"`
- **Optional input**:
  - **`cycle_type`** (string, optional):  
    - Data resolution: `"auto"`, `"5min"`, `"30min"`, `"4hour"`, `"1day"`.  
    - If omitted, defaults to `"auto"`.
  - **Unit options** (same as `get_device_realtime_info`, all optional, defaults if omitted).

- **Output (structured)**:
  - `history`: raw Ecowitt API historical data for the requested period.

**Usage example**

```json
{
  "tool": "ecowitt__get_device_historical_info",
  "arguments": {
    "mac": "<mac from get_devices>",
    "start_date": "2025-12-25 00:00:00",
    "end_date": "2025-12-26 00:00:00",
    "callback": "outdoor.temp,indoor.humidity",
    "cycle_type": "1day"
  }
}
```

If unsure about units, **do not include any unit fields**.

---

### get_current_datetime

- **What it does**:  
  Return the **current datetime in UTC** in ISO‑8601 format.
- **When to use**:  
  When you need an accurate timestamp to compute date ranges or to explain time‑zone conversions.
- **Input**:  
  - No arguments.
- **Output (structured)**:
  - `datetime`: ISO‑8601 UTC string, for example `"2026-02-12T10:15:30.000Z"`.

**Usage example**

```json
{
  "tool": "ecowitt__get_current_datetime",
  "arguments": {}
}
```

---

## Recommended Workflows

### 1. Answer “what devices do I have?”

1. **Call** `get_devices` with no arguments.  
2. Use the `devices` array in the response to list names, types, and locations.

### 2. Answer “what’s the weather right now at my station?”

1. Call `get_devices`.  
2. Select the most relevant device (for example, by `name` or closest coordinates).  
3. Call `get_device_realtime_info` with:
   - `mac`: that device’s `mac`.  
   - No unit fields (let defaults apply), unless the user explicitly requests a unit system.

### 3. Answer “what was the weather like on date X?”

1. Call `get_devices` and choose a device.  
2. If needed, call `get_current_datetime` to understand “now” for relative time queries.  
3. Build `start_date` and `end_date` in the device’s timezone using `"YYYY-MM-DD HH:mm:ss"`.  
4. Call `get_device_historical_info` with:
   - `mac`: device’s `mac`  
   - `start_date`, `end_date`  
   - `callback`: `"all"` or specific groups like `"outdoor.temp,indoor.humidity"`.

### 4. Dealing with errors

- **Invalid MAC**:  
  - Ensure `mac` is **exactly** one of the values returned by `get_devices`.  
  - You may rewrite formats (with or without `:`) but the characters must match.
- **Unit errors**:  
  - Only pass numeric codes from the lists above.  
  - If unsure, **omit the unit fields entirely** and use defaults.

This guide should give you everything needed to choose the right Ecowitt tool, construct valid arguments, and avoid trial‑and‑error when interacting with the MCP server.

