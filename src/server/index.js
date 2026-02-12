#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getConfig } from "../config/index.js";
import { EcowittClient } from "../ecowitt/client.js";
import { formatMacAddress } from "../utils/mac.js";
import { extractUnitOptions, UnitOptionsSchema } from "../utils/unit_options.js";
import { DeviceHandlers } from "./handlers/device.js";

/**
 * Create and configure the MCP server
 * @param {Object} config - Full configuration object
 * @param {Object} config.ecowitt - Ecowitt API configuration
 * @param {string} config.ecowitt.applicationKey - Ecowitt application key
 * @param {string} config.ecowitt.apiKey - Ecowitt API key
 * @param {string} config.ecowitt.baseUrl - Base URL for the Ecowitt API
 * @param {Object} config.server - Server configuration
 * @param {string} config.server.name - Server name
 * @param {string} config.server.version - Server version
 * @param {number} config.server.requestTimeout - Request timeout in milliseconds
 * @returns {Promise<McpServer>} Configured MCP server instance
 */
export async function createMCPServer(config) {
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
        logging: {},
      },
    }
  );

  // Create device handlers
  const ecowittClient = new EcowittClient(config);
  const deviceHandlers = new DeviceHandlers(ecowittClient);

  // Register the standard 'resources' primitive
  server.registerResource(
    "devices",
    new ResourceTemplate("ecowitt://device/{mac}", {
      list: async () => {
        try {
          const resources = await deviceHandlers.handleDeviceList();

          return { resources };
        } catch (error) {
          server.server.sendLoggingMessage({
            level: "error",
            data: `Error listing devices: ${error.message}`,
          });
          throw error;
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
        server.server.sendLoggingMessage({
          level: "error",
          data: error.message,
        });

        throw error;
      }
    }
  );

  // Register tools
  server.registerTool(
    "get_devices",
    {
      name: "get_devices",
      description:
        "List all Ecowitt weather station devices. " +
        "Call this first to discover devices and valid MAC addresses (see `mac` field) " +
        "to use with the other tools.",
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
      try {
        const devices = await deviceHandlers.handleDeviceList();

        return {
          structuredContent: { devices },
          content: [
            {
              type: "text",
              text: JSON.stringify({ devices }, null, 2),
              contentType: "application/json",
            },
          ],
        };
      } catch (error) {
        server.server.sendLoggingMessage({
          level: "error",
          data: `Error getting devices: ${error.message}`,
        });
        throw error;
      }
    }
  );

  server.registerTool(
    "get_device_realtime_info",
    {
      name: "get_device_realtime_info",
      description:
        "Get current real-time measurements for a single Ecowitt device. " +
        "Use the `mac` value from `get_devices`. " +
        "If you are unsure about units, omit all unit fields to use the device defaults.",
      inputSchema: {
        mac: z
          .string()
          .describe(
            "Device MAC address from `get_devices` (`mac` field). " +
              "Accepted formats: `AA:BB:CC:DD:EE:FF` or `AABBCCDDEEFF` (case-insensitive)."
          ),
        callback: z
          .string()
          .optional()
          .describe(
            "Optional subset of data to return (e.g. 'all', 'outdoor', 'indoor.humidity'). " +
              "If omitted, a sensible default set of fields is returned."
          ),
        ...UnitOptionsSchema,
      },
    },
    async (args) => {
      try {
        const { mac, callback, ...rest } = args;
        const formattedMac = formatMacAddress(mac);
        const unitOptions = extractUnitOptions(rest);
        const realtimeData = await deviceHandlers.getDeviceRealTimeInfo(formattedMac, callback, unitOptions);

        return {
          content: [{ type: "text", text: JSON.stringify(realtimeData, null, 2), contentType: "application/json" }],
        };
      } catch (error) {
        server.server.sendLoggingMessage({
          level: "error",
          data: `Error getting realtime info for device ${args.mac}: ${error.message}`,
        });
        throw error;
      }
    }
  );

  server.registerTool(
    "get_device_historical_info",
    {
      name: "get_device_historical_info",
      description:
        "Get historical measurements for a single Ecowitt device over a time range. " +
        "Use the `mac` value from `get_devices`. " +
        "Times must be in the device's timezone and formatted as 'YYYY-MM-DD HH:mm:ss'. " +
        "If you are unsure about units, omit all unit fields to use the device defaults.",
      inputSchema: {
        mac: z
          .string()
          .describe(
            "Device MAC address from `get_devices` (`mac` field). " +
              "Accepted formats: `AA:BB:CC:DD:EE:FF` or `AABBCCDDEEFF` (case-insensitive)."
          ),
        start_date: z
          .string()
          .describe("Start time of data query in device timezone (ISO-like: 'YYYY-MM-DD HH:mm:ss')."),
        end_date: z
          .string()
          .describe("End time of data query in device timezone (ISO-like: 'YYYY-MM-DD HH:mm:ss')."),
        callback: z
          .string()
          .describe(
            "Comma-separated list of field groups to return (e.g. 'outdoor.temp,indoor.humidity'). " +
              "Use 'all' to return all available fields."
          ),
        cycle_type: z
          .string()
          .optional()
          .describe(
            "Data resolution: 'auto', '5min', '30min', '4hour', or '1day' (defaults to 'auto' if omitted)."
          ),
        ...UnitOptionsSchema,
      },
      outputSchema: {
        history: z.any().describe("Historical device data (raw Ecowitt API response)"),
      },
    },
    async (args) => {
      try {
        const { mac, start_date, end_date, callback, cycle_type, ...rest } = args;
        const formattedMac = formatMacAddress(mac);
        const unitOptions = extractUnitOptions(rest);
        const historyData = await deviceHandlers.getDeviceHistory(
          formattedMac,
          start_date,
          end_date,
          callback,
          cycle_type,
          unitOptions
        );

        return {
          structuredContent: { history: historyData },
          content: [{ type: "text", text: JSON.stringify(historyData, null, 2), contentType: "application/json" }],
        };
      } catch (error) {
        server.server.sendLoggingMessage({
          level: "error",
          data: `Error getting historical data for device ${args.mac}: ${error.message}`,
        });
        throw error;
      }
    }
  );

  server.registerTool(
    "get_current_datetime",
    {
      name: "get_current_datetime",
      description: "Get the current datetime in ISO 8601 format (UTC).",
      outputSchema: {
        datetime: z.string().datetime().describe("Current datetime in ISO 8601 format (UTC)"),
      },
    },
    async () => {
      const datetime = new Date().toISOString();

      return {
        structuredContent: { datetime },
        content: [
          {
            type: "text",
            text: JSON.stringify({ datetime }, null, 2),
            contentType: "application/json",
          },
        ],
      };
    }
  );

  return server;
}

try {
  // Create and configure the MCP server instance
  const config = getConfig();
  const server = await createMCPServer(config);

  // Initialize stdio transport and establish connection
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Ecowitt MCP Server started successfully");
} catch (error) {
  console.error("Failed to start Ecowitt MCP Server:", error.message);
  process.exit(1);
}
