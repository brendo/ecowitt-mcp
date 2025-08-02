import { beforeEach, describe, expect, it, vi } from "vitest";
import { EcowittClient } from "../ecowitt/client.js";
import { DeviceHandlers } from "../server/handlers/device.js";

// Mock the EcowittClient
vi.mock("../ecowitt/client.js");

describe("DeviceHandlers", () => {
  let handlers;
  let mockEcowittClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock client instance
    mockEcowittClient = {
      listDevices: vi.fn(),
    };

    // Mock the EcowittClient constructor
    EcowittClient.mockImplementation(() => mockEcowittClient);

    // Create handlers instance
    handlers = new DeviceHandlers({
      applicationKey: "test-app-key",
      apiKey: "test-api-key",
      baseUrl: "https://api.ecowitt.net/api/v3",
    });
  });

  describe("constructor", () => {
    it("should create an instance with valid config", () => {
      expect(handlers).toBeInstanceOf(DeviceHandlers);
      expect(EcowittClient).toHaveBeenCalledWith({
        applicationKey: "test-app-key",
        apiKey: "test-api-key",
        baseUrl: "https://api.ecowitt.net/api/v3",
      });
    });

    it("should throw error with invalid config", () => {
      // Mock EcowittClient to throw validation error
      EcowittClient.mockImplementation(() => {
        throw new Error("Application key is required");
      });

      expect(() => {
        new DeviceHandlers({});
      }).toThrow("Application key is required");
    });
  });

  describe("handleDeviceList", () => {
    it("should return device list on successful API call", async () => {
      // Mock successful API response
      const mockDevices = [
        {
          id: "123",
          name: "My Weather Station",
          mac: "AABBCCDD1122",
          imei: "123456789",
          type: "GW1000",
          dateZoneId: "America/New_York",
          createTime: 1234567890,
          longitude: -74.006,
          latitude: 40.7128,
          stationType: "outdoor",
          iotDevices: [],
        },
        {
          id: "456",
          name: "Garden Sensor",
          mac: "EEFFGGHH3344",
          imei: "987654321",
          type: "WH31",
          dateZoneId: "America/New_York",
          createTime: 1234567891,
          longitude: -74.006,
          latitude: 40.7128,
          stationType: "outdoor",
          iotDevices: [],
        },
      ];

      mockEcowittClient.listDevices.mockResolvedValue({
        success: true,
        devices: mockDevices,
      });

      const result = await handlers.handleDeviceList();

      expect(mockEcowittClient.listDevices).toHaveBeenCalledOnce();
      expect(result).toEqual({
        success: true,
        devices: mockDevices,
      });
    });

    it("should return error when API call fails", async () => {
      // Mock API error response
      const mockError = {
        success: false,
        error: {
          code: 40010,
          message: "Illegal Application_Key Parameter",
          type: "authentication_error",
        },
      };

      mockEcowittClient.listDevices.mockResolvedValue(mockError);

      const result = await handlers.handleDeviceList();

      expect(mockEcowittClient.listDevices).toHaveBeenCalledOnce();
      expect(result).toEqual(mockError);
    });

    it("should handle client method throwing an exception", async () => {
      // Mock client method throwing
      const error = new Error("Network connection failed");
      mockEcowittClient.listDevices.mockRejectedValue(error);

      const result = await handlers.handleDeviceList();

      expect(mockEcowittClient.listDevices).toHaveBeenCalledOnce();
      expect(result).toEqual({
        success: false,
        error: {
          code: "HANDLER_ERROR",
          message: "Network connection failed",
          type: "handler_error",
        },
      });
    });

    it("should handle empty device list", async () => {
      // Mock empty device list response
      mockEcowittClient.listDevices.mockResolvedValue({
        success: true,
        devices: [],
      });

      const result = await handlers.handleDeviceList();

      expect(mockEcowittClient.listDevices).toHaveBeenCalledOnce();
      expect(result).toEqual({
        success: true,
        devices: [],
      });
    });
  });

  describe("getDeviceByName", () => {
    it("should return device when found by name", async () => {
      const mockDevices = [
        {
          id: "123",
          name: "My Weather Station",
          mac: "AABBCCDD1122",
          type: "GW1000",
        },
        {
          id: "456",
          name: "Garden Sensor",
          mac: "EEFFGGHH3344",
          type: "WH31",
        },
      ];

      mockEcowittClient.listDevices.mockResolvedValue({
        success: true,
        devices: mockDevices,
      });

      const result = await handlers.getDeviceByName("Garden Sensor");

      expect(result).toEqual({
        success: true,
        device: mockDevices[1],
      });
    });

    it("should return error when device not found", async () => {
      const mockDevices = [
        {
          id: "123",
          name: "My Weather Station",
          mac: "AABBCCDD1122",
          type: "GW1000",
        },
      ];

      mockEcowittClient.listDevices.mockResolvedValue({
        success: true,
        devices: mockDevices,
      });

      const result = await handlers.getDeviceByName("Nonexistent Device");

      expect(result).toEqual({
        success: false,
        error: {
          code: "DEVICE_NOT_FOUND",
          message: 'Device "Nonexistent Device" not found',
          type: "device_error",
        },
      });
    });

    it("should handle case-insensitive device name matching", async () => {
      const mockDevices = [
        {
          id: "123",
          name: "My Weather Station",
          mac: "AABBCCDD1122",
          type: "GW1000",
        },
      ];

      mockEcowittClient.listDevices.mockResolvedValue({
        success: true,
        devices: mockDevices,
      });

      const result = await handlers.getDeviceByName("my weather station");

      expect(result).toEqual({
        success: true,
        device: mockDevices[0],
      });
    });

    it("should propagate API errors", async () => {
      const mockError = {
        success: false,
        error: {
          code: 40011,
          message: "Illegal Api_Key Parameter",
          type: "authentication_error",
        },
      };

      mockEcowittClient.listDevices.mockResolvedValue(mockError);

      const result = await handlers.getDeviceByName("Any Device");

      expect(result).toEqual(mockError);
    });
  });

  describe("error handling", () => {
    it("should handle missing device name parameter", async () => {
      const result = await handlers.getDeviceByName("");

      expect(result).toEqual({
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Device name is required",
          type: "parameter_error",
        },
      });
    });

    it("should handle null device name parameter", async () => {
      const result = await handlers.getDeviceByName(null);

      expect(result).toEqual({
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Device name is required",
          type: "parameter_error",
        },
      });
    });

    it("should handle undefined device name parameter", async () => {
      const result = await handlers.getDeviceByName(undefined);

      expect(result).toEqual({
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Device name is required",
          type: "parameter_error",
        },
      });
    });
  });
});
