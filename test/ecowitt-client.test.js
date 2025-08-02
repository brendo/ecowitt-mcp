import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EcowittClient } from "../ecowitt/client.js";
import { loadFixture } from "./helpers/fixtures.js";
import {
  createEcowittSuccessResponse,
  createMockMalformedResponse,
  createMockNetworkError,
  createMockTimeoutError,
  HttpErrors,
} from "./helpers/mock-responses.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("EcowittClient", () => {
  let client;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      applicationKey: "test-app-key",
      apiKey: "test-api-key",
      baseUrl: "https://api.ecowitt.net/api/v3",
      requestTimeout: 5000,
    };

    client = new EcowittClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Constructor", () => {
    it("should create client with valid configuration", () => {
      expect(client).toBeInstanceOf(EcowittClient);
      expect(client.config).toEqual(mockConfig);
    });

    it("should throw error with missing application key", () => {
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.applicationKey;

      expect(() => new EcowittClient(invalidConfig)).toThrow("Application key is required");
    });

    it("should throw error with missing API key", () => {
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.apiKey;

      expect(() => new EcowittClient(invalidConfig)).toThrow("API key is required");
    });

    it("should throw error with invalid base URL", () => {
      const invalidConfig = { ...mockConfig, baseUrl: "not-a-url" };

      expect(() => new EcowittClient(invalidConfig)).toThrow("Invalid base URL");
    });
  });

  describe("listDevices", () => {
    it("should successfully fetch device list", async () => {
      const mockResponse = createEcowittSuccessResponse("device-list-success");
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await client.listDevices();

      expect(fetch).toHaveBeenCalledWith(
        "https://api.ecowitt.net/api/v3/device/list?application_key=test-app-key&api_key=test-api-key",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ecowitt-mcp/0.0.1-dev",
          },
          signal: expect.objectContaining({
            aborted: false,
          }),
        }
      );

      expect(result).toEqual({
        success: true,
        devices: [
          {
            id: 1050,
            name: "Weather Station Main",
            mac: "AA:BB:CC:DD:EE:FF",
            imei: undefined,
            type: 1,
            dateZoneId: "America/New_York",
            createTime: 1642561960,
            longitude: -74.006,
            latitude: 40.7128,
            stationType: "EasyWeatherV1.6.1",
            iotDevices: [
              {
                name: "Indoor Sensor",
                defaultTitle: "AC1100-001234",
                deviceId: "AbCd1234567890EfGh",
                version: "1.2.3",
                createTime: 1705038104,
              },
              {
                name: "Outdoor Multi Sensor",
                defaultTitle: "WFC01-005678",
                deviceId: "XyZ9876543210AbCdE",
                version: "2.1.0",
                createTime: 1705038104,
              },
            ],
          },
          {
            id: 944,
            name: "Garden Station",
            mac: "11:22:33:44:55:66",
            imei: "863879049793071",
            type: 1,
            dateZoneId: "America/New_York",
            createTime: 1636684950,
            longitude: -74.004,
            latitude: 40.714,
            stationType: "WS6006_V1.1.26",
            iotDevices: [],
          },
        ],
      });
    });

    it("should handle empty device list", async () => {
      const mockResponse = createEcowittSuccessResponse("device-list-empty");
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await client.listDevices();

      expect(result).toEqual({
        success: true,
        devices: [],
      });
    });

    it("should handle Ecowitt API error response", async () => {
      const mockResponse = createEcowittSuccessResponse("device-list-error");
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await client.listDevices();

      expect(result).toEqual({
        success: false,
        error: {
          code: 40010,
          message: "Illegal application_key parameter",
          type: "authentication_error",
        },
      });
    });

    it("should handle HTTP error responses", async () => {
      const mockResponse = HttpErrors.internalServerError();
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await client.listDevices();

      expect(result).toEqual({
        success: false,
        error: {
          code: 500,
          message: "HTTP 500: Internal Server Error",
          type: "http_error",
        },
      });
    });

    it("should handle network errors", async () => {
      fetch.mockImplementation(() => createMockNetworkError("Network error"));

      const result = await client.listDevices();

      expect(result).toEqual({
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Network error",
          type: "network_error",
        },
      });
    });

    it("should handle request timeout", async () => {
      fetch.mockImplementation(() => createMockTimeoutError());

      const result = await client.listDevices();

      expect(result).toEqual({
        success: false,
        error: {
          code: "TIMEOUT",
          message: "Request timeout",
          type: "timeout_error",
        },
      });
    });

    it("should handle malformed JSON response", async () => {
      const mockResponse = createMockMalformedResponse();
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await client.listDevices();

      expect(result).toEqual({
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: "Invalid JSON",
          type: "parse_error",
        },
      });
    });
  });

  describe("URL construction", () => {
    it("should build correct URL with query parameters", () => {
      const url = client._buildUrl("/device/list");
      expect(url).toBe(
        "https://api.ecowitt.net/api/v3/device/list?application_key=test-app-key&api_key=test-api-key"
      );
    });

    it("should handle additional query parameters", () => {
      const url = client._buildUrl("/device/info", {
        mac: "AA:BB:CC:DD:EE:FF",
      });
      expect(url).toBe(
        "https://api.ecowitt.net/api/v3/device/info?application_key=test-app-key&api_key=test-api-key&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF"
      );
    });
  });

  describe("Error classification", () => {
    it("should delegate error classification to EcowittErrorClassifier", () => {
      const error = client._classifyError(40010, "Illegal Application_Key Parameter");
      expect(error).toEqual({
        code: 40010,
        message: "Illegal Application_Key Parameter",
        type: "authentication_error",
      });
    });
  });

  describe("Response transformation", () => {
    it("should transform device data correctly", () => {
      const deviceFixture = loadFixture("ecowitt", "device-list-success");
      const rawDevice = deviceFixture.data.list[0];

      const transformed = client._transformDevice(rawDevice);

      expect(transformed).toEqual({
        id: 1050,
        name: "Weather Station Main",
        mac: "AA:BB:CC:DD:EE:FF",
        imei: undefined,
        type: 1,
        dateZoneId: "America/New_York",
        createTime: 1642561960,
        longitude: -74.006,
        latitude: 40.7128,
        stationType: "EasyWeatherV1.6.1",
        iotDevices: [
          {
            name: "Indoor Sensor",
            defaultTitle: "AC1100-001234",
            deviceId: "AbCd1234567890EfGh",
            version: "1.2.3",
            createTime: 1705038104,
          },
          {
            name: "Outdoor Multi Sensor",
            defaultTitle: "WFC01-005678",
            deviceId: "XyZ9876543210AbCdE",
            version: "2.1.0",
            createTime: 1705038104,
          },
        ],
      });
    });

    it("should handle missing optional fields", () => {
      const rawDevice = {
        id: 123,
        name: "Simple Station",
        mac: "AA:BB:CC:DD:EE:FF",
        type: 1,
      };

      const transformed = client._transformDevice(rawDevice);

      expect(transformed).toEqual({
        id: 123,
        name: "Simple Station",
        mac: "AA:BB:CC:DD:EE:FF",
        imei: undefined,
        type: 1,
        dateZoneId: undefined,
        createTime: undefined,
        longitude: undefined,
        latitude: undefined,
        stationType: undefined,
        iotDevices: [],
      });
    });
  });
});
