import { beforeEach, describe, expect, it, vi } from "vitest";
import { EcowittClient } from "../src/ecowitt/client.js";
import { DeviceNotFoundError, EcowittApiError } from "../src/ecowitt/errors.js";
import { DeviceHandlers } from "../src/server/handlers/device.js";
import { CustomError, HandlerError } from "../src/utils/errors.js";

// Mock the EcowittClient module
vi.mock("../src/ecowitt/client.js");

describe("DeviceHandlers", () => {
  let deviceHandlers;
  let mockClient;

  const mockRawDevices = [
    {
      id: 1,
      name: "Device 1",
      mac: "AA:BB:CC:DD:EE:01",
      type: "gateway",
      stationType: "GW1000",
      dateZoneId: "America/New_York",
      longitude: -74.006,
      latitude: 40.7128,
    },
    {
      id: 2,
      name: "Backyard",
      mac: "AA:BB:CC:DD:EE:02",
      type: "weather_station",
      stationType: "WS2900",
      longitude: -74.007,
      latitude: 40.7129,
    },
  ];

  const mockTransformedResources = [
    {
      uri: "ecowitt://device/AABBCCDDEE01",
      name: "Device 1",
      mac: "AA:BB:CC:DD:EE:01",
      type: "gateway",
      stationType: "GW1000",
      dateZoneId: "America/New_York",
      longitude: -74.006,
      latitude: 40.7128,
    },
    {
      uri: "ecowitt://device/AABBCCDDEE02",
      name: "Backyard",
      mac: "AA:BB:CC:DD:EE:02",
      type: "weather_station",
      stationType: "WS2900",
      longitude: -74.007,
      latitude: 40.7129,
    },
  ];

  const mockRealTimeInfo = {
    tempf: 70.0,
    humidity: 60,
    windspeedmph: 5.5,
  };

  beforeEach(() => {
    // Reset mocks before each test
    EcowittClient.mockClear();
    mockClient = new EcowittClient();
    deviceHandlers = new DeviceHandlers(mockClient);
  });

  describe("constructor", () => {
    it("should create an instance with injected client", () => {
      expect(deviceHandlers).toBeInstanceOf(DeviceHandlers);
      expect(deviceHandlers.client).toBe(mockClient);
    });
  });

  describe("handleDeviceList", () => {
    it("should return transformed resource list on successful API call", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      mockClient.listDevices = mockListDevices;

      const result = await deviceHandlers.handleDeviceList();
      expect(result).toEqual(mockTransformedResources);
      expect(mockListDevices).toHaveBeenCalled();
    });

    it("should throw an error when the API client fails", async () => {
      const apiError = new EcowittApiError(40010);
      const mockListDevices = vi.fn().mockRejectedValue(apiError);
      mockClient.listDevices = mockListDevices;

      await expect(deviceHandlers.handleDeviceList()).rejects.toThrow(EcowittApiError);
    });

    it("should handle an empty device list from the client", async () => {
      const mockListDevices = vi.fn().mockResolvedValue([]);
      mockClient.listDevices = mockListDevices;

      const result = await deviceHandlers.handleDeviceList();
      expect(result).toEqual([]);
    });
  });

  describe("getDeviceByMac", () => {
    it("should return device data on success", async () => {
      const mockDeviceInfo = {
        id: 1,
        name: "Device 1",
        mac: "AA:BB:CC:DD:EE:01",
      };
      const mockGetDeviceInfo = vi.fn().mockResolvedValue(mockDeviceInfo);
      mockClient.getDeviceInfo = mockGetDeviceInfo;

      const result = await deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01");
      expect(result).toEqual(mockDeviceInfo);
      expect(mockGetDeviceInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01");
    });

    it("should throw DeviceNotFoundError if client returns empty data", async () => {
      const mockGetDeviceInfo = vi.fn().mockResolvedValue({});
      mockClient.getDeviceInfo = mockGetDeviceInfo;

      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(DeviceNotFoundError);
    });

    it("should throw CustomError for invalid MAC address parameter", async () => {
      await expect(deviceHandlers.getDeviceByMac(" ")).rejects.toThrow(CustomError);
      await expect(deviceHandlers.getDeviceByMac(null)).rejects.toThrow(CustomError);
    });

    it("should propagate EcowittApiError from the client", async () => {
      const apiError = new EcowittApiError(500);
      const mockGetDeviceInfo = vi.fn().mockRejectedValue(apiError);
      mockClient.getDeviceInfo = mockGetDeviceInfo;

      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(EcowittApiError);
    });

    it("should wrap unexpected errors in a HandlerError", async () => {
      const unexpectedError = new Error("Something weird happened");
      const mockGetDeviceInfo = vi.fn().mockRejectedValue(unexpectedError);
      mockClient.getDeviceInfo = mockGetDeviceInfo;
      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(HandlerError);
    });
  });

  describe("getDeviceRealTimeInfo", () => {
    it("should return real-time data on successful API call by MAC", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue(mockRealTimeInfo);
      mockClient.getRealTimeInfo = mockGetRealTimeInfo;

      const result = await deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01");
      expect(result).toEqual(mockRealTimeInfo);
      expect(mockGetRealTimeInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01", undefined, {});
    });

    it("should include callBack and unitOptions when provided", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue(mockRealTimeInfo);
      mockClient.getRealTimeInfo = mockGetRealTimeInfo;

      const callBack = "outdoor";
      const unitOptions = { temp_unitid: 1 };
      const result = await deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01", callBack, unitOptions);
      expect(result).toEqual(mockRealTimeInfo);
      expect(mockGetRealTimeInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01", callBack, unitOptions);
    });

    it("should return empty data if client returns empty data object", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue({});
      mockClient.getRealTimeInfo = mockGetRealTimeInfo;

      const result = await deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01");
      expect(result).toEqual({});
    });

    it("should throw CustomError for missing MAC address parameter", async () => {
      await expect(deviceHandlers.getDeviceRealTimeInfo(undefined)).rejects.toThrow(CustomError);
      await expect(deviceHandlers.getDeviceRealTimeInfo(null)).rejects.toThrow(CustomError);
      await expect(deviceHandlers.getDeviceRealTimeInfo("")).rejects.toThrow(CustomError);
    });

    it("should propagate EcowittApiError from the client", async () => {
      const apiError = new EcowittApiError(500);
      const mockGetRealTimeInfo = vi.fn().mockRejectedValue(apiError);
      mockClient.getRealTimeInfo = mockGetRealTimeInfo;

      await expect(deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01")).rejects.toThrow(EcowittApiError);
    });

    it("should wrap unexpected errors in a HandlerError", async () => {
      const unexpectedError = new Error("Something unexpected happened");
      const mockGetRealTimeInfo = vi.fn().mockRejectedValue(unexpectedError);
      mockClient.getRealTimeInfo = mockGetRealTimeInfo;

      await expect(deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01")).rejects.toThrow(HandlerError);
    });
  });

  describe("getDeviceHistory", () => {
    const mockHistoryApiResponse = {
      code: 0,
      msg: "success",
      time: "1647993600",
      data: {
        outdoor: {
          temperature: {
            unit: "C",
            list: {
              1647993600: 12.3,
              1648008000: 12.7,
            },
          },
          humidity: {
            unit: "%",
            list: {
              1647993600: 56,
              1648008000: 57,
            },
          },
        },
      },
    };

    it("should return history data on successful API call", async () => {
      const mockGetDeviceHistory = vi.fn().mockResolvedValue(mockHistoryApiResponse.data);
      mockClient.getDeviceHistory = mockGetDeviceHistory;

      const result = await deviceHandlers.getDeviceHistory(
        "AA:BB:CC:DD:EE:01",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temperature"
      );
      expect(result).toEqual(mockHistoryApiResponse.data);
      expect(mockGetDeviceHistory).toHaveBeenCalledWith(
        "AA:BB:CC:DD:EE:01",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temperature",
        undefined,
        {}
      );
    });

    it("should include cycleType and unitOptions when provided", async () => {
      const mockGetDeviceHistory = vi.fn().mockResolvedValue(mockHistoryApiResponse.data);
      mockClient.getDeviceHistory = mockGetDeviceHistory;
      const unitOptions = { temp_unitid: 1 };
      const cycleType = "5min";
      await deviceHandlers.getDeviceHistory(
        "AA:BB:CC:DD:EE:01",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temperature",
        cycleType,
        unitOptions
      );
      expect(mockGetDeviceHistory).toHaveBeenCalledWith(
        "AA:BB:CC:DD:EE:01",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temperature",
        cycleType,
        unitOptions
      );
    });

    it("should throw CustomError for missing required parameters", async () => {
      await expect(
        deviceHandlers.getDeviceHistory(undefined, "2023-03-15 00:00:00", "2023-03-15 23:59:59", "outdoor.temperature")
      ).rejects.toThrow(CustomError);
      await expect(
        deviceHandlers.getDeviceHistory("AA:BB:CC:DD:EE:01", undefined, "2023-03-15 23:59:59", "outdoor.temperature")
      ).rejects.toThrow(CustomError);
      await expect(
        deviceHandlers.getDeviceHistory("AA:BB:CC:DD:EE:01", "2023-03-15 00:00:00", undefined, "outdoor.temperature")
      ).rejects.toThrow(CustomError);
      await expect(
        deviceHandlers.getDeviceHistory("AA:BB:CC:DD:EE:01", "2023-03-15 00:00:00", "2023-03-15 23:59:59", undefined)
      ).rejects.toThrow(CustomError);
    });

    it("should propagate EcowittApiError from the client", async () => {
      const apiError = new EcowittApiError(500);
      const mockGetDeviceHistory = vi.fn().mockRejectedValue(apiError);
      mockClient.getDeviceHistory = mockGetDeviceHistory;

      await expect(
        deviceHandlers.getDeviceHistory(
          "AA:BB:CC:DD:EE:01",
          "2023-03-15 00:00:00",
          "2023-03-15 23:59:59",
          "outdoor.temperature"
        )
      ).rejects.toThrow(EcowittApiError);
    });

    it("should wrap unexpected errors in a HandlerError", async () => {
      const unexpectedError = new Error("Something weird happened");
      const mockGetDeviceHistory = vi.fn().mockRejectedValue(unexpectedError);
      mockClient.getDeviceHistory = mockGetDeviceHistory;
      await expect(
        deviceHandlers.getDeviceHistory(
          "AA:BB:CC:DD:EE:01",
          "2023-03-15 00:00:00",
          "2023-03-15 23:59:59",
          "outdoor.temperature"
        )
      ).rejects.toThrow(HandlerError);
    });
  });

  describe("getDeviceByName", () => {
    it("should return full device data when found by name", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      const mockDeviceInfo = { ...mockRawDevices[1], full_details: true };
      const mockGetDeviceInfo = vi.fn().mockResolvedValue(mockDeviceInfo);
      mockClient.listDevices = mockListDevices;
      mockClient.getDeviceInfo = mockGetDeviceInfo;

      const result = await deviceHandlers.getDeviceByName("Backyard");

      expect(result).toEqual(mockDeviceInfo);
      expect(mockListDevices).toHaveBeenCalled();
      expect(mockGetDeviceInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:02");
    });

    it("should throw DeviceNotFoundError when a device is not found", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      mockClient.listDevices = mockListDevices;

      await expect(deviceHandlers.getDeviceByName("NonExistentDevice")).rejects.toThrow(DeviceNotFoundError);
    });

    it("should handle case-insensitive device name matching", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      const mockDeviceInfo = { ...mockRawDevices[1], full_details: true };
      const mockGetDeviceInfo = vi.fn().mockResolvedValue(mockDeviceInfo);
      mockClient.listDevices = mockListDevices;
      mockClient.getDeviceInfo = mockGetDeviceInfo;

      const result = await deviceHandlers.getDeviceByName("backyard");
      expect(result).toEqual(mockDeviceInfo);
    });

    it("should throw CustomError for invalid device name parameter", async () => {
      await expect(deviceHandlers.getDeviceByName(" ")).rejects.toThrow(CustomError);
      await expect(deviceHandlers.getDeviceByName(null)).rejects.toThrow(CustomError);
    });

    it("should propagate errors from handleDeviceList", async () => {
      const apiError = new EcowittApiError(500);
      const mockListDevices = vi.fn().mockRejectedValue(apiError);
      mockClient.listDevices = mockListDevices;

      await expect(deviceHandlers.getDeviceByName("any name")).rejects.toThrow(EcowittApiError);
    });
  });
});
