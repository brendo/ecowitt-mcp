import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EcowittErrorClassifier } from "./errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json for version info
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

/**
 * Ecowitt API client for interacting with weather station data
 */
export class EcowittClient {
  /**
   * Create a new EcowittClient instance
   * @param {Object} config - Configuration object
   * @param {string} config.applicationKey - Ecowitt application key
   * @param {string} config.apiKey - Ecowitt API key
   * @param {string} config.baseUrl - Base URL for the Ecowitt API
   * @param {number} config.requestTimeout - Request timeout in milliseconds
   */
  constructor(config) {
    this._validateConfig(config);
    this.config = { ...config };
  }

  /**
   * Validate the configuration object
   * @private
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  _validateConfig(config) {
    if (!config.applicationKey) {
      throw new Error("Application key is required");
    }
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    if (!config.baseUrl) {
      throw new Error("Base URL is required");
    }

    // Validate base URL format
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error("Invalid base URL");
    }
  }

  /**
   * Build a complete URL for an API endpoint
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} additionalParams - Additional query parameters
   * @returns {string} Complete URL with authentication parameters
   */
  _buildUrl(endpoint, additionalParams = {}) {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Handle base URL with path correctly
    const baseUrl = this.config.baseUrl.endsWith("/")
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    const url = new URL(`${baseUrl}${normalizedEndpoint}`);

    // Add authentication parameters
    url.searchParams.set("application_key", this.config.applicationKey);
    url.searchParams.set("api_key", this.config.apiKey);

    // Add any additional parameters
    for (const [key, value] of Object.entries(additionalParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString());
      }
    }

    return url.toString();
  }

  /**
   * Make an HTTP request to the Ecowitt API
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async _makeRequest(endpoint, options = {}) {
    const url = this._buildUrl(endpoint, options.params);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.requestTimeout || 10000);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `ecowitt-mcp/${packageJson.version}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options.fetchOptions,
      });

      clearTimeout(timeoutId);

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (error) {
        return {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message: error.message,
            type: "parse_error",
          },
        };
      }

      // Handle HTTP errors
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            type: "http_error",
          },
        };
      }

      // Handle Ecowitt API errors (non-zero code)
      if (data.code !== 0) {
        const error = this._classifyError(data.code, data.msg);
        return {
          success: false,
          error,
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: data.time,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (error.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: "Request timeout",
            type: "timeout_error",
          },
        };
      }

      // Handle network errors
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error.message,
          type: "network_error",
        },
      };
    }
  }

  /**
   * Classify API error based on error code and message
   * @private
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @returns {Object} Classified error
   */
  _classifyError(code, message) {
    return EcowittErrorClassifier.classifyError(code, message);
  }

  /**
   * Transform raw device data from API to normalized format
   * @private
   * @param {Object} rawDevice - Raw device data from API
   * @returns {Object} Normalized device data
   */
  _transformDevice(rawDevice) {
    return {
      id: rawDevice.id,
      name: rawDevice.name,
      mac: rawDevice.mac,
      imei: rawDevice.imei,
      type: rawDevice.type,
      dateZoneId: rawDevice.date_zone_id,
      createTime: rawDevice.createtime,
      longitude: rawDevice.longitude,
      latitude: rawDevice.latitude,
      stationType: rawDevice.stationtype,
      iotDevices: (rawDevice.iotdevice_list || []).map((device) => ({
        name: device.name,
        defaultTitle: device.default_title,
        deviceId: device.device_id,
        version: device.version,
        createTime: device.createtime,
      })),
    };
  }

  /**
   * List all devices associated with the account
   * @returns {Promise<Object>} List of devices or error
   */
  async listDevices() {
    const response = await this._makeRequest("/device/list");

    if (!response.success) {
      return response;
    }

    // Transform device data
    const devices = (response.data.list || []).map((device) => this._transformDevice(device));

    return {
      success: true,
      devices,
    };
  }
}
