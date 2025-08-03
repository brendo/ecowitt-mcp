import { beforeEach, describe, expect, it, vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { EcowittClient } from "../ecowitt/client.js";
import { CustomError, DataParsingError, EcowittApiError } from "../ecowitt/errors.js";
import { loadFixture } from "./helpers/fixtures.js";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

describe("EcowittClient", () => {
  const mockConfig = {
    applicationKey: "test-app-key",
    apiKey: "test-api-key",
    baseUrl: "https://api.ecowitt.net/api/v3",
    requestTimeout: 5000,
  };

  const mockDeviceListApiResponse = {
    code: 0,
    msg: "success",
    data: {
      list: [
        {
          id: 1,
          name: "Device 1",
          mac: "AA:BB:CC:DD:EE:FF",
          stationtype: "GW1000",
        },
        {
          id: 2,
          name: "Device 2",
          imei: "123456789012345",
          stationtype: "WH2320",
        },
      ],
    },
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  describe("Constructor", () => {
    it("should create a client with valid configuration", () => {
      expect(() => new EcowittClient(mockConfig)).not.toThrow();
    });

    it("should throw CustomError for missing application key", () => {
      const invalidConfig = { ...mockConfig, applicationKey: undefined };
      expect(() => new EcowittClient(invalidConfig)).toThrow(CustomError);
    });
  });

  describe("listDevices", () => {
    it("should successfully fetch and transform the device list", async () => {
      fetch.once(JSON.stringify(mockDeviceListApiResponse));

      const client = new EcowittClient(mockConfig);
      const devices = await client.listDevices();

      expect(devices).toBeInstanceOf(Array);
      expect(devices.length).toBe(2);
      expect(devices[0].name).toBe("Device 1");
      expect(devices[1].stationType).toBe("WH2320");
    });

    it("should handle an empty device list from the API", async () => {
      fetch.once(JSON.stringify({ code: 0, msg: "success", data: { list: [] } }));
      const client = new EcowittClient(mockConfig);
      const devices = await client.listDevices();
      expect(devices).toEqual([]);
    });

    it("should throw EcowittApiError for an API error response", async () => {
      const errorResponse = loadFixture("ecowitt", "device-list-error");
      fetch.mockResponse(JSON.stringify(errorResponse));

      const client = new EcowittClient(mockConfig);
      await expect(client.listDevices()).rejects.toThrow(EcowittApiError);
      await expect(client.listDevices()).rejects.toThrow("Illegal Application_Key Parameter");
    });

    it("should throw EcowittApiError for an HTTP error response", async () => {
      fetch.once({
        status: 500,
        statusText: "Server Error",
        body: "{}",
      });
      const client = new EcowittClient(mockConfig);
      await expect(client.listDevices()).rejects.toThrow(EcowittApiError);
    });

    it("should throw CustomError for network errors", async () => {
      fetch.mockRejectOnce(new Error("Network connection failed"));
      const client = new EcowittClient(mockConfig);
      await expect(client.listDevices()).rejects.toThrow(CustomError);
    });

    it("should throw DataParsingError for malformed JSON responses", async () => {
      fetch.once("this is not json");
      const client = new EcowittClient(mockConfig);
      await expect(client.listDevices()).rejects.toThrow(DataParsingError);
    });
  });

  describe("URL construction", () => {
    it("should build the correct URL with authentication parameters", () => {
      const client = new EcowittClient(mockConfig);
      // @ts-ignore - accessing private method for testing
      const url = client._buildUrl("/test/endpoint");
      expect(url).toBe(
        "https://api.ecowitt.net/api/v3/test/endpoint?application_key=test-app-key&api_key=test-api-key"
      );
    });
  });

  describe("Response transformation", () => {
    it("should transform raw device data correctly", () => {
      const client = new EcowittClient(mockConfig);
      const rawDevice = {
        id: 99,
        name: "Raw Device",
        mac: "11:22:33:44:55:66",
        date_zone_id: "UTC",
        stationtype: "GW1000",
      };
      // @ts-ignore - accessing private method for testing
      const transformed = client._transformDevice(rawDevice);
      expect(transformed.id).toBe(99);
      expect(transformed.name).toBe("Raw Device");
      expect(transformed.dateZoneId).toBe("UTC");
    });
  });
});
