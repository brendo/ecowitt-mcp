# Ecowitt MCP Server

MCP server for integrating Ecowitt weather stations with AI assistants. This fetches weather data using the [Ecowitt API](https://doc.ecowitt.net/web/#/apiv3en).

## Prerequisites

Requires a valid Ecowitt Application Key and API Key. Visit [Private Center in ecowitt.net](https://www.ecowitt.net/home/user) to create.

## MCP Configuration

```json
{
  "ecowitt": {
    "command": "npx -y ecowitt-mcp",
    "env": {
      "ECOWITT_APPLICATION_KEY": "your_app_key",
      "ECOWITT_API_KEY": "your_api_key"
    }
  }
}
```

## Available Tools

- **get_devices** - Get all your weather stations and sensors
- **get_device_realtime_info** - Get realtime data for a specific device
- **get_device_historical_info** - Get historical data for a specific device
- **get_current_datetime** - Because AI needs a little help knowing exactly when it is.

## Available Resources

- **resources/list** - List all available Ecowitt devices
- **resources/read** - Get full details for a specific device

## Example Usage

Once configured, you can ask your AI assistant:

> "Show me all my weather devices using the get_devices tool"

> "List my Ecowitt stations"

> "What is the current temperature from my Ecowitt station?"

> "What was the weather like last Christmas?"

> "What was the wettest month this year?"

> "When should I plant garlic?"

The AI will use the MCP server to fetch your device information from the Ecowitt API.

### Contributing

Clone `.env.example` to `.env` and fill in your Ecowitt credentials:

- `ECOWITT_APPLICATION_KEY` (required) - Your Ecowitt application key
- `ECOWITT_API_KEY` (required) - Your Ecowitt API key
- `ECOWITT_BASE_URL` (optional) - Base URL for Ecowitt API (default: https://api.ecowitt.net/api/v3)
- `REQUEST_TIMEOUT` (optional) - Request timeout in milliseconds (default: 10000)
