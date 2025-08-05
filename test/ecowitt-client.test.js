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

  const mockDeviceInfoApiResponse = {
    code: 0,
    msg: "success",
    data: {
      id: 1,
      name: "Device 1",
      mac: "AA:BB:CC:DD:EE:FF",
      stationtype: "GW1000",
      date_zone_id: "UTC",
      createtime: 1678886400000,
      longitude: 0,
      latitude: 0,
      iotdevice_list: [],
    },
  };

  const mockRealTimeInfoApiResponse = {
    code: 0,
    msg: "success",
    data: {
      device_id: "WH2320_123456789012345",
      firmware_version: "1.0.0",
      last_upload: 1678886400,
      tempf: 70.0,
      humidity: 60,
      windspeedmph: 5.5,
      dailyrainin: 0.1,
      solarradiation: 120.5,
      uv: 5,
      date: "2023-03-15",
      time: "10:00:00",
      temp_unit: "F",
      wind_speed_unit: "mph",
      rain_unit: "in",
      solar_irradiance_unit: "W/m²",
      capacity_unit: "L",
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
  });

  describe("getDeviceInfo", () => {
    it("should successfully fetch device information by MAC", async () => {
      fetch.once(JSON.stringify(mockDeviceInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const deviceInfo = await client.getDeviceInfo("AA:BB:CC:DD:EE:FF");
      expect(deviceInfo).toEqual(mockDeviceInfoApiResponse.data);
    });

    it("should successfully fetch device information by IMEI", async () => {
      fetch.once(JSON.stringify(mockDeviceInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const deviceInfo = await client.getDeviceInfo("123456789012345");
      expect(deviceInfo).toEqual(mockDeviceInfoApiResponse.data);
    });

    it("should throw CustomError for missing MAC or IMEI", async () => {
      const client = new EcowittClient(mockConfig);
      await expect(client.getDeviceInfo(undefined)).rejects.toThrow(CustomError);
      await expect(client.getDeviceInfo(null)).rejects.toThrow(CustomError);
      await expect(client.getDeviceInfo("")).rejects.toThrow(CustomError);
    });

    it("should return empty data if API returns empty data object", async () => {
      fetch.once(JSON.stringify({ code: 0, msg: "success", data: {} }));
      const client = new EcowittClient(mockConfig);
      const deviceInfo = await client.getDeviceInfo("AA:BB:CC:DD:EE:FF");
      expect(deviceInfo).toEqual({});
    });
  });

  describe("getRealTimeInfo", () => {
    it("should successfully fetch real-time information by MAC", async () => {
      fetch.once(JSON.stringify(mockRealTimeInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF");
      expect(realTimeInfo).toEqual(mockRealTimeInfoApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information by IMEI", async () => {
      fetch.once(JSON.stringify(mockRealTimeInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const realTimeInfo = await client.getRealTimeInfo("123456789012345");
      expect(realTimeInfo).toEqual(mockRealTimeInfoApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("real_time?application_key=test-app-key&api_key=test-api-key&imei=123456789012345"),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information with callBack parameter", async () => {
      fetch.once(JSON.stringify(mockRealTimeInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF", "all");
      expect(realTimeInfo).toEqual(mockRealTimeInfoApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&call_back=all"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch real-time information with unitOptions", async () => {
      fetch.once(JSON.stringify(mockRealTimeInfoApiResponse));
      const client = new EcowittClient(mockConfig);
      const unitOptions = { temp_unitid: 1, wind_speed_unitid: 6 };
      const realTimeInfo = await client.getRealTimeInfo("AA:BB:CC:DD:EE:FF", undefined, unitOptions);
      expect(realTimeInfo).toEqual(mockRealTimeInfoApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "real_time?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&temp_unitid=1&wind_speed_unitid=6"
        ),
        expect.any(Object)
      );
    });

    it("should throw CustomError for missing MAC or IMEI", async () => {
      const client = new EcowittClient(mockConfig);
      await expect(client.getRealTimeInfo(undefined)).rejects.toThrow(CustomError);
      await expect(client.getRealTimeInfo(null)).rejects.toThrow(CustomError);
      await expect(client.getRealTimeInfo("")).rejects.toThrow(CustomError);
    });
  });

  describe("_makeRequest", () => {
    it("should throw EcowittApiError for an API error response", async () => {
      const errorResponse = loadFixture("ecowitt", "device-list-error");
      fetch.mockResponse(JSON.stringify(errorResponse));

      const client = new EcowittClient(mockConfig);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(EcowittApiError);
      await expect(client._makeRequest("/test/error")).rejects.toThrow("Illegal Application_Key Parameter");
    });

    it("should throw EcowittApiError for an HTTP error response", async () => {
      fetch.once({
        status: 500,
        statusText: "Server Error",
        body: "{}",
      });
      const client = new EcowittClient(mockConfig);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(EcowittApiError);
    });

    it("should throw CustomError for network errors", async () => {
      fetch.mockRejectOnce(new Error("Network connection failed"));
      const client = new EcowittClient(mockConfig);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(CustomError);
    });

    it("should throw DataParsingError for malformed JSON responses", async () => {
      fetch.once("this is not json");
      const client = new EcowittClient(mockConfig);
      await expect(client._makeRequest("/test/error")).rejects.toThrow(DataParsingError);
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

    it("should successfully fetch history by MAC", async () => {
      fetch.once(JSON.stringify(mockHistoryApiResponse));
      const client = new EcowittClient(mockConfig);
      const result = await client.getDeviceHistory(
        "AA:BB:CC:DD:EE:FF",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temp",
        "auto"
      );
      expect(result).toEqual(mockHistoryApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "history?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF&start_date=2023-03-15+00%3A00%3A00&end_date=2023-03-15+23%3A59%3A59&call_back=outdoor.temp&cycle_type=auto"
        ),
        expect.any(Object)
      );
    });

    it("should successfully fetch history by IMEI", async () => {
      fetch.once(JSON.stringify(mockHistoryApiResponse));
      const client = new EcowittClient(mockConfig);
      const result = await client.getDeviceHistory(
        "123456789012345",
        "2023-03-15 00:00:00",
        "2023-03-15 23:59:59",
        "outdoor.temp"
      );
      expect(result).toEqual(mockHistoryApiResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("history?application_key=test-app-key&api_key=test-api-key&imei=123456789012345"),
        expect.any(Object)
      );
    });

    it("should include all unit options and cycle_type", async () => {
      fetch.once(JSON.stringify(mockHistoryApiResponse));
      const client = new EcowittClient(mockConfig);
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
      const client = new EcowittClient(mockConfig);
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
      const client = new EcowittClient(mockConfig);
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
      const transformed = client._transformDevice(rawDevice);
      expect(transformed.id).toBe(99);
      expect(transformed.name).toBe("Raw Device");
      expect(transformed.dateZoneId).toBe("UTC");
    });
  });
});
