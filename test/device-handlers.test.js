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
      title: "Device 1",
      description: "Ecowitt weather station: GW1000",
      mac: "AA:BB:CC:DD:EE:01",
    },
    {
      uri: "ecowitt://device/AABBCCDDEE02",
      name: "Backyard",
      title: "Backyard",
      description: "Ecowitt weather station: WS2900",
      mac: "AA:BB:CC:DD:EE:02",
    },
  ];

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
