import { EcowittClient } from "../../ecowitt/client.js";
import { DeviceNotFoundError } from "../../ecowitt/errors.js";
import { CustomError, HandlerError } from "../../utils/errors.js";
import { validateRequired } from "../../utils/validation.js";

/**
 * Device handlers for MCP device operations
 */
export class DeviceHandlers {
  /**
   * Create a new DeviceHandlers instance
   * @param {Object} config - Configuration object
   * @param {string} config.applicationKey - Ecowitt application key
   * @param {string} config.apiKey - Ecowitt API key
   * @param {string} config.baseUrl - Base URL for the Ecowitt API
   * @param {number} [config.requestTimeout] - Request timeout in milliseconds
   */
  constructor(config) {
    this.client = new EcowittClient(config);
  }

  /**
   * Fetches devices from Ecowitt API and transforms them into a list
   * suitable for MCP Resources.
   * On success, returns an array of transformed device objects.
   * On failure, throws an error.
   * @returns {Promise<Array<Object>>} Array of transformed device objects (suitable for MCP Resource)
   * @throws {EcowittApiError|CustomError|HandlerError} If the API call fails or encounters a processing error.
   */
  async handleDeviceList() {
    const rawDevices = await this.client.listDevices();
    return rawDevices.map((device) => ({
      uri: `ecowitt://device/${device.mac.replace(/:/g, "")}`,
      name: device.name,
      mac: device.mac,
      type: device.type,
      stationType: device.stationType,
      dateZoneId: device.dateZoneId,
      longitude: device.longitude,
      latitude: device.latitude,
    }));
  }

  /**
   * Get a device by MAC address from Ecowitt API.
   * @param {string} macAddress - MAC address of the device to find
   * @returns {Promise<Object>} Raw device object from Ecowitt API
   * @throws {CustomError|EcowittApiError|DeviceNotFoundError|HandlerError} If device not found, invalid parameter, API call fails, or an unexpected error occurs.
   */
  async getDeviceByMac(macAddress) {
    try {
      validateRequired("MAC address", macAddress);
    } catch (error) {
      throw new CustomError(error.message, "INVALID_PARAMETER", "parameter_error");
    }

    try {
      const deviceData = await this.client.getDeviceInfo(macAddress);
      if (!deviceData || Object.keys(deviceData).length === 0) {
        throw new DeviceNotFoundError(macAddress);
      }
      return deviceData;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new HandlerError(`An unexpected error occurred in getDeviceByMac: ${error.message}`, error);
    }
  }

  /**
   * Get real-time information for a specific device by MAC address.
   * @param {string} macAddress - Device MAC address.
   * @param {string} [callBack] - Comma-separated list of field types to return.
   * @param {Object} [unitOptions] - Optional unit conversion parameters.
   * @returns {Promise<Object>} Raw real-time device information.
   * @throws {CustomError|EcowittApiError|HandlerError} If device not found, invalid parameter, API call fails, or an unexpected error occurs.
   */
  async getDeviceRealTimeInfo(macAddress, callBack, unitOptions = {}) {
    try {
      validateRequired("MAC address", macAddress);
    } catch (error) {
      throw new CustomError(error.message, "INVALID_PARAMETER", "parameter_error");
    }

    try {
      const realTimeData = await this.client.getRealTimeInfo(macAddress, callBack, unitOptions);
      return realTimeData;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new HandlerError(`An unexpected error occurred in getDeviceRealTimeInfo: ${error.message}`, error);
    }
  }

  /**
   * Get a device by name (helper method for name-to-MAC resolution)
   * @param {string} deviceName - Name of the device to find
   * @returns {Promise<Object>} Raw device object from Ecowitt API
   * @throws {DeviceNotFoundError|CustomError|HandlerError} If device not found or an error occurs.
   */
  async getDeviceByName(deviceName) {
    try {
      validateRequired("Device name", deviceName);
    } catch (error) {
      throw new CustomError(error.message, "INVALID_PARAMETER", "parameter_error");
    }

    try {
      const resources = await this.handleDeviceList();

      const normalizedName = deviceName.toLowerCase().trim();
      const resource = resources.find((r) => r.name.toLowerCase() === normalizedName);

      if (!resource) {
        throw new DeviceNotFoundError(deviceName);
      }

      return this.getDeviceByMac(resource.mac);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new HandlerError(`An unexpected error occurred in getDeviceByName: ${error.message}`, error);
    }
  }
}
