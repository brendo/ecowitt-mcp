#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "../config/index.js";
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
        // Tools capability will be added back when weather tools are implemented
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
        // Reformat MAC address by injecting colons
        const formattedMac = mac.replace(/(.{2})/g, "$1:").slice(0, -1);
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
