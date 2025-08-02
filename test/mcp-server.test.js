import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceHandlers } from "../server/handlers/device.js";
import { createMCPServer } from "../server/index.js";

// Mock the dependencies
vi.mock("@modelcontextprotocol/sdk/server/mcp.js");
vi.mock("@modelcontextprotocol/sdk/server/stdio.js");
vi.mock("../server/handlers/device.js");
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

describe("MCP Server", () => {
  let mockServer;
  let mockTransport;
  let mockDeviceHandlers;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock McpServer instance methods
    mockServer = {
      tool: vi.fn(),
      connect: vi.fn(),
    };

    // Mock Transport instance
    mockTransport = {
      start: vi.fn(),
    };

    // Mock DeviceHandlers instance
    mockDeviceHandlers = {
      handleDeviceList: vi.fn(),
      getDeviceByName: vi.fn(),
    };

    // Mock constructors
    McpServer.mockImplementation(() => mockServer);
    StdioServerTransport.mockImplementation(() => mockTransport);
    DeviceHandlers.mockImplementation(() => mockDeviceHandlers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createMCPServer", () => {
    const validConfig = {
      applicationKey: "test-app-key",
      apiKey: "test-api-key",
      baseUrl: "https://api.ecowitt.net/api/v3",
    };

    it("should create server with valid configuration", async () => {
      const server = await createMCPServer(validConfig);

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

      expect(DeviceHandlers).toHaveBeenCalledWith(validConfig);
      expect(mockServer.tool).toHaveBeenCalled();
      expect(server).toBeDefined();
    });

    it("should create server with default config when no config provided", async () => {
      const server = await createMCPServer();

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

      expect(DeviceHandlers).toHaveBeenCalledWith({
        applicationKey: "test-app-key",
        apiKey: "test-api-key",
        baseUrl: "https://api.ecowitt.net/api/v3",
      });
      expect(server).toBeDefined();
    });

    it("should set up device_list tool", async () => {
      await createMCPServer(validConfig);

      // Check that tool was called for device_list
      const toolCalls = mockServer.tool.mock.calls;
      const deviceListCall = toolCalls.find((call) => call[0] === "device_list");

      expect(deviceListCall).toBeDefined();
    });

    it("should handle device_list tool successfully", async () => {
      const mockDeviceList = [
        {
          id: "123",
          name: "Test Station",
          mac: "AABBCCDD1122",
          type: "GW1000",
        },
      ];

      mockDeviceHandlers.handleDeviceList.mockResolvedValue({
        success: true,
        devices: mockDeviceList,
      });

      await createMCPServer();

      // Get the device_list tool handler
      const toolCalls = mockServer.tool.mock.calls;
      const deviceListCall = toolCalls.find((call) => call[0] === "device_list");
      const deviceListHandler = deviceListCall[3]; // Handler is the 4th argument

      // Call the handler
      const result = await deviceListHandler({});

      expect(mockDeviceHandlers.handleDeviceList).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                devices: mockDeviceList,
              },
              null,
              2
            ),
          },
        ],
      });
    });

    it("should handle device_list tool with error", async () => {
      const mockError = {
        success: false,
        error: {
          code: 40010,
          message: "Illegal Application_Key Parameter",
          type: "authentication_error",
        },
      };

      mockDeviceHandlers.handleDeviceList.mockResolvedValue(mockError);

      await createMCPServer();

      // Get the device_list tool handler
      const toolCalls = mockServer.tool.mock.calls;
      const deviceListCall = toolCalls.find((call) => call[0] === "device_list");
      const deviceListHandler = deviceListCall[3];

      // Call the handler
      const result = await deviceListHandler({});

      expect(mockDeviceHandlers.handleDeviceList).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockError, null, 2),
          },
        ],
      });
    });

    it("should handle device_list tool throwing exception", async () => {
      const error = new Error("Handler failed");
      mockDeviceHandlers.handleDeviceList.mockRejectedValue(error);

      await createMCPServer();

      // Get the device_list tool handler
      const toolCalls = mockServer.tool.mock.calls;
      const deviceListCall = toolCalls.find((call) => call[0] === "device_list");
      const deviceListHandler = deviceListCall[3];

      // Call the handler and expect it to handle the error
      const result = await deviceListHandler({});

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: "MCP_HANDLER_ERROR",
                  message: "Handler failed",
                  type: "mcp_error",
                },
              },
              null,
              2
            ),
          },
        ],
      });
    });
  });

  describe("server startup", () => {
    it("should create server without connecting transport", async () => {
      const server = await createMCPServer();

      // createMCPServer only creates the server, doesn't connect transport
      expect(server).toBeDefined();
      expect(StdioServerTransport).not.toHaveBeenCalled();
      expect(mockServer.connect).not.toHaveBeenCalled();
    });
  });

  describe("configuration handling", () => {
    it("should use provided configuration when passed", async () => {
      const customConfig = {
        applicationKey: "custom-app-key",
        apiKey: "custom-api-key",
        baseUrl: "https://custom.api.com/v3",
        requestTimeout: 15000,
      };

      const server = await createMCPServer(customConfig);
      expect(server).toBeDefined();
      expect(DeviceHandlers).toHaveBeenCalledWith(customConfig);
    });

    it("should use default configuration when none provided", async () => {
      const server = await createMCPServer();
      expect(server).toBeDefined();
      expect(DeviceHandlers).toHaveBeenCalledWith({
        applicationKey: "test-app-key",
        apiKey: "test-api-key",
        baseUrl: "https://api.ecowitt.net/api/v3",
      });
    });
  });
});
