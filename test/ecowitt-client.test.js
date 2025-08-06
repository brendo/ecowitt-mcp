import { beforeEach, describe, expect, it, vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { EcowittClient } from "../src/ecowitt/client.js";
import { CustomError, DataParsingError, EcowittApiError } from "../src/ecowitt/errors.js";
import { loadConfig } from "./helpers/config";
import { loadFixture } from "./helpers/fixtures.js";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

describe("EcowittClient", () => {
  let config;

  beforeEach(async () => {
    vi.resetModules();
    fetch.resetMocks();
    config = await loadConfig();
  });

  describe("Constructor", () => {
    it("should create a client with valid configuration", () => {
      expect(() => new EcowittClient(config)).not.toThrow();
    });

    it("should throw CustomError for missing application key", () => {
      delete config.ecowitt.applicationKey;
      expect(() => new EcowittClient(config)).toThrow(CustomError);
    });
  });

  describe("listDevices", () => {
    it("should successfully fetch and transform the device list", async () => {
      const mockResponse = loadFixture("ecowitt", "device-list-success");
      fetch.once(JSON.stringify(mockResponse));

      const client = new EcowittClient(config);
      const devices = await client.listDevices();

      expect(devices).toBeInstanceOf(Array);
      expect(devices.length).toBe(2);
      expect(devices[0].name).toBe("Weather Station Main");
      expect(devices[1].stationType).toBe("WS6006_V1.1.26");
    });

    it("should handle an empty device list from the API", async () => {
      const mockResponse = loadFixture("ecowitt", "device-list-empty");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const devices = await client.listDevices();
      expect(devices).toEqual([]);
    });
  });

  describe("getDeviceInfo", () => {
    it("should successfully fetch device information by MAC", async () => {
      const mockResponse = loadFixture("ecowitt", "device-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const deviceInfo = await client.getDeviceInfo("AA:BB:CC:DD:EE:FF");
      expect(deviceInfo).toEqual(mockResponse.data);
    });

    it("should successfully fetch device information by IMEI", async () => {
      const mockResponse = loadFixture("ecowitt", "device-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const deviceInfo = await client.getDeviceInfo("123456789012345");
      expect(deviceInfo).toEqual(mockResponse.data);
    });

    it("should throw CustomError for missing MAC or IMEI", async () => {
      const client = new EcowittClient(config);
      await expect(client.getDeviceInfo(undefined)).rejects.toThrow(CustomError);
      await expect(client.getDeviceInfo(null)).rejects.toThrow(CustomError);
      await expect(client.getDeviceInfo("")).rejects.toThrow(CustomError);
    });

    it("should return empty data if API returns empty data object", async () => {
      fetch.once(JSON.stringify({ code: 0, msg: "success", data: {} }));
      const client = new EcowittClient(config);
      const deviceInfo = await client.getDeviceInfo("AA:BB:CC:DD:EE:FF");
      expect(deviceInfo).toEqual({});
    });
  });

  describe("getRealTimeInfo", () => {
    it("should successfully fetch real-time information by MAC", async () => {
      const mockResponse = loadFixture("ecowitt", "real-time-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF");
      expect(realTimeInfo).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information by IMEI", async () => {
      const mockResponse = loadFixture("ecowitt", "real-time-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const realTimeInfo = await client.getRealTimeInfo("123456789012345");
      expect(realTimeInfo).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("real_time?application_key=test-app-key&api_key=test-api-key&imei=123456789012345"),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information with callBack parameter", async () => {
      const mockResponse = loadFixture("ecowitt", "real-time-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF", "all");
      expect(realTimeInfo).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&call_back=all"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information with unitOptions", async () => {
      const mockResponse = loadFixture("ecowitt", "real-time-info-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const unitOptions = { temp_unitid: 1, wind_speed_unitid: 6 };
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF", undefined, unitOptions);
      expect(realTimeInfo).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&temp_unitid=1&wind_speed_unitid=6"
        ),
        expect.any(Object)
      );
    });

    it("should throw CustomError for missing MAC or IMEI", async () => {
      const client = new EcowittClient(config);
      await expect(client.getRealTimeInfo(undefined)).rejects.toThrow(CustomError);
      await expect(client.getRealTimeInfo(null)).rejects.toThrow(CustomError);
      await expect(client.getRealTimeInfo("")).rejects.toThrow(CustomError);
    });
  });

  describe("_makeRequest", () => {
    it("should throw EcowittApiError for an API error response", async () => {
      const errorResponse = loadFixture("ecowitt", "device-list-error");
      fetch.mockResponse(JSON.stringify(errorResponse));

      const client = new EcowittClient(config);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(EcowittApiError);
      await expect(client._makeRequest("/test/error")).rejects.toThrow("Illegal Application_Key Parameter");
    });

    it("should throw EcowittApiError for an HTTP error response", async () => {
      fetch.once({
        status: 500,
        statusText: "Server Error",
        body: "{}",
      });
      const client = new EcowittClient(config);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(EcowittApiError);
    });

    it("should throw CustomError for network errors", async () => {
      fetch.mockRejectOnce(new Error("Network connection failed"));
      const client = new EcowittClient(config);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(CustomError);
    });

    it("should throw DataParsingError for malformed JSON responses", async () => {
      fetch.once("this is not json");
      const client = new EcowittClient(config);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(DataParsingError);
    });
  });

  describe("getDeviceHistory", () => {
    it("should successfully fetch history by MAC", async () => {
      const mockResponse = loadFixture("ecowitt", "device-history-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const result = await client.getDeviceHistory(
        "AA:BB:CC:DD:EE:FF",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temp",
        "auto"
      );
      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "history?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&start_date=2023-03-15+00%3A00%3A00&end_date=2023-03-15+23%3A59%3A59&call_back=outdoor.temp&cycle_type=auto"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch history by IMEI", async () => {
      const mockResponse = loadFixture("ecowitt", "device-history-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const result = await client.getDeviceHistory(
        "123456789012345",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temp"
      );
      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("history?application_key=test-app-key&api_key=test-api-key&imei=123456789012345"),
        expect.any(Object)
      );
    });

    it("should include all unit options and cycle_type", async () => {
      const mockResponse = loadFixture("ecowitt", "device-history-success");
      fetch.once(JSON.stringify(mockResponse));
      const client = new EcowittClient(config);
      const unitOptions = {
        temp_unitid: 1,
        pressure_unitid: 3,
        wind_speed_unitid: 6,
        rainfall_unitid: 12,
        solar_irradiance_unitid: 14,
        capacity_unitid: 24,
      };
      await client.getDeviceHistory(
        "AA:BB:CC:DD:EE:FF",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temp",
        "5min",
        unitOptions
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "temp_unitid=1&pressure_unitid=3&wind_speed_unitid=6&rainfall_unitid=12&solar_irradiance_unitid=14&capacity_unitid=24"
        ),
        expect.any(Object)
      );
    });

    it("should throw CustomError for missing required parameters", async () => {
      const client = new EcowittClient(config);
      await expect(
        client.getDeviceHistory(undefined, "2023-03-15 00:00:00", "2023-03-15 23:59:59", "outdoor.temp")
      ).rejects.toThrow(CustomError);
      await expect(
        client.getDeviceHistory("AA:BB:CC:DD:EE:FF", undefined, "2023-03-15 23:59:59", "outdoor.temp")
      ).rejects.toThrow(CustomError);
      await expect(
        client.getDeviceHistory("AA:BB:CC:DD:EE:FF", "2023-03-15 00:00:00", undefined, "outdoor.temp")
      ).rejects.toThrow(CustomError);
      await expect(
        client.getDeviceHistory("AA:BB:CC:DD:EE:FF", "2023-03-15 00:00:00", "2023-03-15 23:59:59", undefined)
      ).rejects.toThrow(CustomError);
    });
  });

  describe("URL construction", () => {
    it("should build the correct URL with authentication parameters", () => {
      const client = new EcowittClient(config);
      const url = client._buildUrl("/test/endpoint");
      expect(url).toBe(
        "https://api.ecowitt.net/api/v3/test/endpoint?application_key=test-app-key&api_key=test-api-key"
      );
    });
  });

  describe("Response transformation", () => {
    it("should transform raw device data correctly", () => {
      const client = new EcowittClient(config);
      const deviceListFixture = loadFixture("ecowitt", "device-list-success");
      const rawDevice = deviceListFixture.data.list[0];

      const transformed = client._transformDevice(rawDevice);
      expect(transformed.id).toBe(1050);
      expect(transformed.name).toBe("Weather Station Main");
      expect(transformed.mac).toBe("AA:BB:CC:DD:EE:FF");
      expect(transformed.dateZoneId).toBe("America/New_York");
      expect(transformed.stationType).toBe("EasyWeatherV1.6.1");
      expect(transformed.longitude).toBe(-74.006);
      expect(transformed.latitude).toBe(40.7128);
      expect(transformed.iotDevices).toBeDefined();
      expect(transformed.iotDevices.length).toBe(2);
    });
  });
});
