import { EcowittClient } from "../../ecowitt/client.js";

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
   * Handle device.list MCP message
   * @returns {Promise<Object>} List of devices or error response
   */
  async handleDeviceList() {
    try {
      const result = await this.client.listDevices();
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "HANDLER_ERROR",
          message: error.message,
          type: "handler_error",
        },
      };
    }
  }

  /**
   * Get a device by name (helper method for name-to-MAC resolution)
   * @param {string} deviceName - Name of the device to find
   * @returns {Promise<Object>} Device object or error response
   */
  async getDeviceByName(deviceName) {
    // Validate input
    if (!deviceName || typeof deviceName !== "string" || deviceName.trim() === "") {
      return {
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Device name is required",
          type: "parameter_error",
        },
      };
    }

    try {
      const result = await this.handleDeviceList();

      if (!result.success) {
        return result;
      }

      // Find device by name (case-insensitive)
      const normalizedName = deviceName.toLowerCase().trim();
      const device = result.devices.find((d) => d.name.toLowerCase() === normalizedName);

      if (!device) {
        return {
          success: false,
          error: {
            code: "DEVICE_NOT_FOUND",
            message: `Device "${deviceName}" not found`,
            type: "device_error",
          },
        };
      }

      return {
        success: true,
        device,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "HANDLER_ERROR",
          message: error.message,
          type: "handler_error",
        },
      };
    }
  }
}
