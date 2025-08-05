# Ecowitt MCP Server

MCP server for integrating Ecowitt weather stations with AI assistants.

## Prerequisites

MCP server requires a valid Ecowitt Application Key and API Key. Visit [Private Center in ecowitt.net](https://www.ecowitt.net/home/user) to create.

## MCP Configuration

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=ecowitt&config=eyJjb21tYW5kIjoibnB4IC15IGVjb3dpdHQtbWNwIiwiZW52Ijp7IkVDT1dJVFRfQVBQTElDQVRJT05fS0VZIjoieW91cl9hcHBfa2V5IiwiRUNPV0lUVF9BUElfS0VZIjoieW91cl9hcGlfa2V5In19)

Or add to your MCP client configuration manually (e.g., Claude Desktop, Cursor):

```json
{
  "ecowitt": {
    "command": "npx",
    "args": [
      "-y",
      "ecowitt-mcp",
    ],
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

## Available Resources

- **resources/list** - List all available Ecowitt devices
- **resources/read** - Get full details for a specific device

## Example Usage

Once configured, you can ask your AI assistant:

> "Show me all my weather devices using the get_devices tool"

> "List my Ecowitt stations"

> "What is the current temperature from my Ecowitt station?"

The AI will use the MCP server to fetch your device information from the Ecowitt API.
