import { beforeEach, describe, expect, it, vi } from "vitest";
import { EcowittClient } from "../ecowitt/client.js";
import { DeviceNotFoundError, EcowittApiError } from "../ecowitt/errors.js";
import { DeviceHandlers } from "../server/handlers/device.js";
import { CustomError, HandlerError } from "../utils/errors.js";

// Mock the EcowittClient module
vi.mock("../ecowitt/client.js");

describe("DeviceHandlers", () => {
  let deviceHandlers;
  const mockConfig = {
    applicationKey: "test-app-key",
    apiKey: "test-api-key",
    baseUrl: "https://api.ecowitt.net",
  };

  const mockRawDevices = [
    {
      id: 1,
      name: "Device 1",
      mac: "AA:BB:CC:DD:EE:01",
      stationType: "GW1000",
      dateZoneId: "America/New_York",
    },
    {
      id: 2,
      name: "Backyard",
      mac: "AA:BB:CC:DD:EE:02",
      stationType: "WS2900",
    },
  ];

  const mockTransformedResources = [
    {
      uri: "ecowitt://device/AABBCCDDEE01",
      name: "Device 1",
      mac: "AA:BB:CC:DD:EE:01",
      stationType: "GW1000",
      dateZoneId: "America/New_York",
    },
    {
      uri: "ecowitt://device/AABBCCDDEE02",
      name: "Backyard",
      mac: "AA:BB:CC:DD:EE:02",
      stationType: "WS2900",
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
    deviceHandlers = new DeviceHandlers(mockConfig);
  });

  describe("constructor", () => {
    it("should create an instance and instantiate EcowittClient with valid config", () => {
      expect(deviceHandlers).toBeInstanceOf(DeviceHandlers);
      expect(EcowittClient).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe("handleDeviceList", () => {
    it("should return transformed resource list on successful API call", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;

      const result = await deviceHandlers.handleDeviceList();
      expect(result).toEqual(mockTransformedResources);
      expect(mockListDevices).toHaveBeenCalled();
    });

    it("should throw an error when the API client fails", async () => {
      const apiError = new EcowittApiError(40010);
      const mockListDevices = vi.fn().mockRejectedValue(apiError);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;

      await expect(deviceHandlers.handleDeviceList()).rejects.toThrow(EcowittApiError);
    });

    it("should handle an empty device list from the client", async () => {
      const mockListDevices = vi.fn().mockResolvedValue([]);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;

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
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;

      const result = await deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01");
      expect(result).toEqual(mockDeviceInfo);
      expect(mockGetDeviceInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01");
    });

    it("should throw DeviceNotFoundError if client returns empty data", async () => {
      const mockGetDeviceInfo = vi.fn().mockResolvedValue({});
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;

      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(DeviceNotFoundError);
    });

    it("should throw CustomError for invalid MAC address parameter", async () => {
      await expect(deviceHandlers.getDeviceByMac(" ")).rejects.toThrow(CustomError);
      await expect(deviceHandlers.getDeviceByMac(null)).rejects.toThrow(CustomError);
    });

    it("should propagate EcowittApiError from the client", async () => {
      const apiError = new EcowittApiError(500);
      const mockGetDeviceInfo = vi.fn().mockRejectedValue(apiError);
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;

      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(EcowittApiError);
    });

    it("should wrap unexpected errors in a HandlerError", async () => {
      const unexpectedError = new Error("Something weird happened");
      const mockGetDeviceInfo = vi.fn().mockRejectedValue(unexpectedError);
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;
      await expect(deviceHandlers.getDeviceByMac("AA:BB:CC:DD:EE:01")).rejects.toThrow(HandlerError);
    });
  });

  describe("getDeviceRealTimeInfo", () => {
    it("should return real-time data on successful API call by MAC", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue(mockRealTimeInfo);
      EcowittClient.mock.instances[0].getRealTimeInfo = mockGetRealTimeInfo;

      const result = await deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01");
      expect(result).toEqual(mockRealTimeInfo);
      expect(mockGetRealTimeInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01", undefined, {});
    });

    it("should include callBack and unitOptions when provided", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue(mockRealTimeInfo);
      EcowittClient.mock.instances[0].getRealTimeInfo = mockGetRealTimeInfo;

      const callBack = "outdoor";
      const unitOptions = { temp_unitid: 1 };
      const result = await deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01", callBack, unitOptions);
      expect(result).toEqual(mockRealTimeInfo);
      expect(mockGetRealTimeInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:01", callBack, unitOptions);
    });

    it("should return empty data if client returns empty data object", async () => {
      const mockGetRealTimeInfo = vi.fn().mockResolvedValue({});
      EcowittClient.mock.instances[0].getRealTimeInfo = mockGetRealTimeInfo;

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
      EcowittClient.mock.instances[0].getRealTimeInfo = mockGetRealTimeInfo;

      await expect(deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01")).rejects.toThrow(EcowittApiError);
    });

    it("should wrap unexpected errors in a HandlerError", async () => {
      const unexpectedError = new Error("Something unexpected happened");
      const mockGetRealTimeInfo = vi.fn().mockRejectedValue(unexpectedError);
      EcowittClient.mock.instances[0].getRealTimeInfo = mockGetRealTimeInfo;

      await expect(deviceHandlers.getDeviceRealTimeInfo("AA:BB:CC:DD:EE:01")).rejects.toThrow(HandlerError);
    });
  });

  describe("getDeviceByName", () => {
    it("should return full device data when found by name", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      const mockDeviceInfo = { ...mockRawDevices[1], full_details: true };
      const mockGetDeviceInfo = vi.fn().mockResolvedValue(mockDeviceInfo);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;

      const result = await deviceHandlers.getDeviceByName("Backyard");

      expect(result).toEqual(mockDeviceInfo);
      expect(mockListDevices).toHaveBeenCalled();
      expect(mockGetDeviceInfo).toHaveBeenCalledWith("AA:BB:CC:DD:EE:02");
    });

    it("should throw DeviceNotFoundError when a device is not found", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;

      await expect(deviceHandlers.getDeviceByName("NonExistentDevice")).rejects.toThrow(DeviceNotFoundError);
    });

    it("should handle case-insensitive device name matching", async () => {
      const mockListDevices = vi.fn().mockResolvedValue(mockRawDevices);
      const mockDeviceInfo = { ...mockRawDevices[1], full_details: true };
      const mockGetDeviceInfo = vi.fn().mockResolvedValue(mockDeviceInfo);
      EcowittClient.mock.instances[0].listDevices = mockListDevices;
      EcowittClient.mock.instances[0].getDeviceInfo = mockGetDeviceInfo;

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
      EcowittClient.mock.instances[0].listDevices = mockListDevices;

      await expect(deviceHandlers.getDeviceByName("any name")).rejects.toThrow(EcowittApiError);
    });
  });
});
