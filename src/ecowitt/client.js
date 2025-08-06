import { CustomError, DataParsingError } from "../utils/errors.js";
import { EcowittApiError } from "./errors.js";

/**
 * Ecowitt API client for interacting with weather station data
 */
export class EcowittClient {
  /**
   * Create a new EcowittClient instance
   * @param {Object} config - Configuration object
   * @param {Object} config.ecowitt - Ecowitt API configuration
   * @param {string} config.ecowitt.applicationKey - Ecowitt application key
   * @param {string} config.ecowitt.apiKey - Ecowitt API key
   * @param {string} config.ecowitt.baseUrl - Base URL for the Ecowitt API
   * @param {number} config.ecowitt.requestTimeout - Request timeout in milliseconds
   * @param {Object} config.server - Server configuration
   * @param {string} config.server.version - Server version
   */
  constructor(config) {
    this.config = { ...this._validateConfig(config) };
  }

  /**
   * Validate the configuration object
   * @private
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   * @returns {Object} Validated configuration object
   */
  _validateConfig(config) {
    if (!config.ecowitt.applicationKey) {
      throw new CustomError("Application key is required", "MISSING_CONFIG", "configuration_error");
    }
    if (!config.ecowitt.apiKey) {
      throw new CustomError("API key is required", "MISSING_CONFIG", "configuration_error");
    }
    if (!config.ecowitt.baseUrl) {
      throw new CustomError("Base URL is required", "MISSING_CONFIG", "configuration_error");
    }

    // Validate base URL format
    try {
      new URL(config.ecowitt.baseUrl);
    } catch (error) {
      throw new CustomError("Invalid base URL format", "INVALID_CONFIG", "configuration_error", error);
    }

    // Handle base URL with path correctly - normalize by removing trailing slash
    const normalizedBaseUrl = config.ecowitt.baseUrl.endsWith("/")
      ? config.ecowitt.baseUrl.slice(0, -1)
      : config.ecowitt.baseUrl;

    return {
      applicationKey: config.ecowitt.applicationKey,
      apiKey: config.ecowitt.apiKey,
      baseUrl: normalizedBaseUrl,
      requestTimeout: config.ecowitt.requestTimeout,
      version: config.server?.version,
    };
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

    const url = new URL(`${this.config.baseUrl}${normalizedEndpoint}`);

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
    }, this.config.requestTimeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `ecowitt-mcp/${this.config.version}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options.fetchOptions,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors (response.ok is false, after checking Ecowitt specific errors)
      // This might happen if Ecowitt returns a non-200 status *and* a successful 'code: 0' in payload,
      // though typically a non-200 would also have a non-zero data.code.
      // This check ensures we catch any unexpected HTTP status codes.
      if (!response.ok) {
        throw new EcowittApiError(
          response.status,
          `HTTP Error: ${response.statusText}`,
          new Error(`HTTP status ${response.status}: ${response.statusText}`)
        );
      }

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new DataParsingError(`Failed to parse API response as JSON: ${error.message}`, error);
      }

      // Handle Ecowitt API errors (non-zero code from the data payload)
      if (data.code !== 0) {
        throw new EcowittApiError(data.code, data.msg);
      }

      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof CustomError) {
        throw error; // Re-throw custom errors directly
      }

      // Handle timeout errors
      if (error.name === "AbortError") {
        throw new CustomError("Request timed out.", "TIMEOUT_ERROR", "timeout_error", error);
      }

      // Handle general network errors (e.g., DNS issues, connection refused)
      throw new CustomError(`Network error: ${error.message}`, "NETWORK_ERROR", "network_error", error);
    }
  }

  /**
   * Helper to build device identification parameters (mac or imei).
   * @private
   * @param {string} macOrImei - Device MAC or IMEI.
   * @returns {Object} Parameters object with either 'mac' or 'imei' key.
   * @throws {CustomError} If macOrImei is not provided.
   */
  _buildDeviceParams(macOrImei) {
    if (!macOrImei) {
      throw new CustomError("MAC or IMEI is required.", "INVALID_PARAMETER", "parameter_error");
    }
    return macOrImei.includes(":") ? { mac: macOrImei } : { imei: macOrImei };
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
   * @returns {Promise<Array<Object>>} Array of transformed device objects
   */
  async listDevices() {
    const data = await this._makeRequest("/device/list");
    // 'data' here is the .data part of the Ecowitt response, which contains 'list'
    return (data.list || []).map((device) => this._transformDevice(device));
  }

  /**
   * Get detailed information for a specific device by MAC or IMEI.
   * @param {string} macOrImei - Device MAC or IMEI.
   * @returns {Promise<Object>} Raw detailed device information.
   * @throws {EcowittApiError|CustomError|DataParsingError} On various errors.
   */
  async getDeviceInfo(macOrImei) {
    const params = this._buildDeviceParams(macOrImei);

    return this._makeRequest("/device/info", { params });
  }

  /**
   * Get real-time information for a specific device by MAC or IMEI.
   * @param {string} macOrImei - Device MAC or IMEI.
   * @param {string} [callback] - Comma-separated list of field types to return (e.g., "all", "outdoor", "indoor.humidity").
   * @param {Object} [unitOptions] - Optional unit conversion parameters (temp_unitid, pressure_unitid, etc.).
   * @returns {Promise<Object>} Raw real-time device information.
   * @throws {EcowittApiError|CustomError|DataParsingError} On various errors.
   */
  async getRealTimeInfo(macOrImei, callback, unitOptions = {}) {
    const params = {
      ...this._buildDeviceParams(macOrImei),
      ...(callback && { call_back: callback }),
      ...unitOptions,
    };

    return this._makeRequest("/device/real_time", { params });
  }

  /**
   * Get historical data for a specific device by MAC or IMEI.
   * @param {string} macOrImei - Device MAC or IMEI.
   * @param {string} startDate - Start time of data query (ISO8601: "YYYY-MM-DD HH:mm:ss").
   * @param {string} endDate - End time of data query (ISO8601: "YYYY-MM-DD HH:mm:ss").
   * @param {string} callback - Comma-separated list of field types to return.
   * @param {string} [cycleType] - Data resolution ("auto", "5min", "30min", "4hour", "1day").
   * @param {Object} [unitOptions] - Optional unit parameters.
   * @returns {Promise<Object>} Historical device data.
   * @throws {EcowittApiError|CustomError|DataParsingError} On various errors.
   */
  async getDeviceHistory(macOrImei, startDate, endDate, callback, cycleType, unitOptions = {}) {
    const params = {
      ...this._buildDeviceParams(macOrImei),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(callback && { call_back: callback }),
      ...(cycleType && { cycle_type: cycleType }),
      ...unitOptions,
    };

    return this._makeRequest("/device/history", { params });
  }
}
