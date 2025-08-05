#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "../config/index.js";
import { formatMacAddress } from "../utils/mac.js";
import { DeviceHandlers } from "./handlers/device.js";
import { toMcpErrorResponse } from "./utils/mcp_error_handler.js";

/**
 * Create and configure the MCP server
 * @param {Object} ecowittConfig - Ecowitt API configuration
 * @returns {Promise<McpServer>} Configured MCP server instance
 */
export async function createMCPServer(ecowittConfig = config.ecowitt) {
  // Create the MCP server and advertise capabilities for resources
  const server = new McpServer(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        resources: {
          listChanged: false, // Set to true if you implement notifications
          subscribe: false, // Set to true if you implement subscriptions
        },
        tools: {},
      },
    }
  );

  // Create device handlers
  const deviceHandlers = new DeviceHandlers(ecowittConfig);

  // Register the standard 'resources' primitive
  server.registerResource(
    "devices",
    new ResourceTemplate("ecowitt://device/{mac}", {
      list: async () => {
        try {
          const resources = await deviceHandlers.handleDeviceList();

          return { resources };
        } catch (error) {
          // Centralized error handling for any issues during the operation
          return toMcpErrorResponse(error);
        }
      },
    }),
    {
      title: "Ecowitt Devices",
      description: "Access Ecowitt weather station device information.",
      mimeType: "application/json",
    },
    async (uri, { mac }) => {
      try {
        const formattedMac = formatMacAddress(mac);
        const deviceData = await deviceHandlers.getDeviceByMac(formattedMac);

        return {
          contents: [
            {
              uri: uri.href,
              mac: formattedMac,
              title: deviceData.name,
              text: JSON.stringify(deviceData, null, 2),
              contentType: "application/json",
            },
          ],
        };
      } catch (error) {
        return toMcpErrorResponse(error);
      }
    }
  );

  // Register tools
  server.registerTool(
    "get_devices",
    {
      name: "get_devices",
      description: "Get information about all Ecowitt weather station devices",
      outputSchema: {
        devices: z.array(
          z.object({
            uri: z.string().describe("Device URI"),
            name: z.string().describe("Device name"),
            mac: z.string().describe("Device MAC address"),
            type: z.number().describe("Device type"), // TODO: Map type to string
            stationType: z.string().describe("Device station type"),
            dateZoneId: z.string().describe("Device timezone"),
            longitude: z.number().describe("Longitude of device"),
            latitude: z.number().describe("Latitude of device"),
          })
        ),
      },
    },
    async () => {
      const devices = await deviceHandlers.handleDeviceList();

      return {
        structuredContent: { devices },
      };
    }
  );

  server.registerTool(
    "get_device_realtime_info",
    {
      name: "get_device_realtime_info",
      description: "Get real-time information from an Ecowitt weather station device",
      inputSchema: {
        mac: z.string().describe("Device MAC address (format: AA:BB:CC:DD:EE:FF or AABBCCDDEEFF)"),
        callback: z
          .string()
          .optional()
          .describe("Optional field types to return (e.g., 'all', 'outdoor', 'indoor.humidity')"),
        temp_unitid: z
          .number()
          .int()
          .min(1)
          .max(2)
          .optional()
          .describe("Temperature unit: 1 for °C, 2 for °F (default)"),
        pressure_unitid: z
          .number()
          .int()
          .min(3)
          .max(5)
          .optional()
          .describe("Pressure unit: 3 for hPa, 4 for inHg (default), 5 for mmHg"),
        wind_speed_unitid: z
          .number()
          .int()
          .min(6)
          .max(11)
          .optional()
          .describe("Wind speed unit: 6 for m/s, 7 for km/h, 8 for knots, 9 for mph (default), 10 for BFT, 11 for fpm"),
        rainfall_unitid: z
          .number()
          .int()
          .min(12)
          .max(13)
          .optional()
          .describe("Rain unit: 12 for mm, 13 for in (default)"),
        solar_irradiance_unitid: z
          .number()
          .int()
          .min(14)
          .max(16)
          .optional()
          .describe("Solar Irradiance unit: 14 for lux, 15 for fc, 16 for W/m² (default)"),
        capacity_unitid: z
          .number()
          .int()
          .min(24)
          .max(26)
          .optional()
          .describe("Capacity unit: 24 for L (default), 25 for m³, 26 for gal"),
      },
    },
    async (args) => {
      const { mac, callback, ...unitOptions } = args;
      const formattedMac = formatMacAddress(mac);
      const realtimeData = await deviceHandlers.getDeviceRealTimeInfo(formattedMac, callback, unitOptions);

      return {
        content: [{ type: "text", text: JSON.stringify(realtimeData, null, 2), contentType: "application/json" }],
      };
    }
  );

  return server;
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Create the server
    const server = await createMCPServer();

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("Ecowitt MCP Server started successfully");
  } catch (error) {
    console.error("Failed to start Ecowitt MCP Server:", error.message);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
}
