#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "../config/index.js";
import { DeviceHandlers } from "./handlers/device.js";

/**
 * Create and configure the MCP server
 * @param {Object} ecowittConfig - Ecowitt API configuration
 * @returns {Promise<McpServer>} Configured MCP server instance
 */
export async function createMCPServer(ecowittConfig = config.ecowitt) {
  // Create the MCP server
  const server = new McpServer(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Create device handlers
  const deviceHandlers = new DeviceHandlers(ecowittConfig);

  // Register device.list tool
  server.tool("device_list", "List all Ecowitt weather devices", {}, async () => {
    try {
      const result = await deviceHandlers.handleDeviceList();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: "MCP_HANDLER_ERROR",
                  message: error.message,
                  type: "mcp_error",
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  });

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
