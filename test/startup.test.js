import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMCPServer } from "../server/index.js";

// Mock the MCP SDK to avoid stdio transport issues during testing
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    tool: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
  })),
}));

// Mock the config to provide test values
vi.mock("../config/index.js", () => ({
  config: {
    ecowitt: {
      applicationKey: "test-app-key",
      apiKey: "test-api-key",
      baseUrl: "https://api.ecowitt.net/api/v3",
    },
    server: {
      name: "ecowitt-weather-server",
      version: "1.0.0",
      requestTimeout: 10000,
    },
    debug: {
      enabled: false,
      logLevel: "info",
    },
  },
}));

describe("Server Startup", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should create server successfully with default configuration", async () => {
    const server = await createMCPServer();
    expect(server).toBeDefined();
  });

  it("should create server successfully with custom configuration", async () => {
    const customConfig = {
      applicationKey: "custom-app-key",
      apiKey: "custom-api-key",
      baseUrl: "https://custom.api.com/v3",
      requestTimeout: 15000,
    };

    const server = await createMCPServer(customConfig);
    expect(server).toBeDefined();
  });

  it("should handle server creation with minimal configuration", async () => {
    const minimalConfig = {
      applicationKey: "minimal-app-key",
      apiKey: "minimal-api-key",
      baseUrl: "https://api.ecowitt.net/api/v3",
    };

    const server = await createMCPServer(minimalConfig);
    expect(server).toBeDefined();
  });

  it("should validate configuration and set up handlers", async () => {
    const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");

    const server = await createMCPServer();

    // Verify McpServer constructor was called with correct parameters
    expect(McpServer).toHaveBeenCalledWith(
      {
        name: "ecowitt-weather-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Verify server was created successfully
    expect(server).toBeDefined();

    // Get the mock server instance
    const mockServer = McpServer.mock.results[0].value;

    // Verify tool was called for device_list
    expect(mockServer.tool).toHaveBeenCalled();

    const toolCalls = mockServer.tool.mock.calls;
    const deviceListTool = toolCalls.find((call) => call[0] === "device_list");
    expect(deviceListTool).toBeDefined();

    // createMCPServer doesn't connect transport, that happens in main()
    expect(mockServer.connect).not.toHaveBeenCalled();
  });

  it("should set up device_list tool that returns proper structure", async () => {
    const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");

    await createMCPServer();

    const mockServer = McpServer.mock.results[0].value;
    const toolCalls = mockServer.tool.mock.calls;
    const deviceListTool = toolCalls.find((call) => call[0] === "device_list");

    expect(deviceListTool).toBeDefined();
    expect(typeof deviceListTool[3]).toBe("function");

    // The handler function should be the fourth argument
    const handler = deviceListTool[3];
    expect(handler).toBeInstanceOf(Function);
  });
});
