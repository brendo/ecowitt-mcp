/**
 * Ecowitt API error classification and handling utilities
 */
import { CustomError } from "../utils/errors.js";

/**
 * Error specifically for issues with the Ecowitt API.
 * Includes mappings for Ecowitt API specific error codes.
 */
export class EcowittApiError extends CustomError {
  /**
   * Ecowitt API error type classifications.
   */
  static ErrorTypes = {
    SERVER_BUSY: "server_busy_error",
    AUTHENTICATION: "authentication_error",
    PARAMETER: "parameter_error",
    DEVICE: "device_error",
    CLIENT: "client_error", // Generic client-side error (4xx)
    SERVER: "server_error", // Generic server-side error (5xx)
    UNKNOWN: "unknown_error", // Uncategorized error
  };

  /**
   * Ecowitt-specific error code to internal error type mapping.
   */
  static ErrorCodeMap = {
    [-1]: EcowittApiError.ErrorTypes.SERVER_BUSY,
    40000: EcowittApiError.ErrorTypes.PARAMETER,
    40010: EcowittApiError.ErrorTypes.AUTHENTICATION, // Illegal Application_Key Parameter
    40011: EcowittApiError.ErrorTypes.AUTHENTICATION, // Illegal Api_Key Parameter
    40012: EcowittApiError.ErrorTypes.DEVICE, // Illegal MAC/IMEI Parameter
    40013: EcowittApiError.ErrorTypes.PARAMETER, // Illegal start_date Parameter
    40014: EcowittApiError.ErrorTypes.PARAMETER, // Illegal end_date Parameter
    40015: EcowittApiError.ErrorTypes.PARAMETER, // Illegal cycle_type Parameter
    40016: EcowittApiError.ErrorTypes.PARAMETER, // Illegal call_back Parameter
    40017: EcowittApiError.ErrorTypes.PARAMETER, // Missing Application_Key Parameter
    40018: EcowittApiError.ErrorTypes.PARAMETER, // Missing Api_Key Parameter
    40019: EcowittApiError.ErrorTypes.DEVICE, // Missing MAC Parameter
    40020: EcowittApiError.ErrorTypes.PARAMETER, // Missing start_date Parameter
    40021: EcowittApiError.ErrorTypes.PARAMETER, // Missing end_date Parameter
  };

  /**
   * Standard error messages for Ecowitt API error codes.
   */
  static ErrorMessages = {
    [-1]: "System is busy.",
    40000: "Illegal parameter",
    40010: "Illegal Application_Key Parameter",
    40011: "Illegal Api_Key Parameter",
    40012: "Illegal MAC/IMEI Parameter",
    40013: "Illegal start_date Parameter",
    40014: "Illegal end_date Parameter",
    40015: "Illegal cycle_type Parameter",
    40016: "Illegal call_back Parameter",
    40017: "Missing Application_Key Parameter",
    40018: "Missing Api_Key Parameter",
    40019: "Missing MAC Parameter",
    40020: "Missing start_date Parameter",
    40021: "Missing end_date Parameter",
  };

  /**
   * Creates an instance of EcowittApiError.
   * @param {number} apiResponseCode - The numerical error code from the Ecowitt API.
   * @param {string} [apiResponseMessage="An unknown Ecowitt API error occurred."] - The message from the Ecowitt API.
   * @param {Error} [originalError=null] - The original error (e.g., network error, Fetch API error).
   */
  constructor(apiResponseCode, apiResponseMessage = "An unknown Ecowitt API error occurred.", originalError = null) {
    const defaultMessage = EcowittApiError.ErrorMessages[apiResponseCode] || apiResponseMessage;
    let mappedType = EcowittApiError.ErrorCodeMap[apiResponseCode];

    // Fallback classification if no specific mapping
    if (!mappedType) {
      if (apiResponseCode >= 400 && apiResponseCode < 500) {
        mappedType = EcowittApiError.ErrorTypes.CLIENT;
      } else if (apiResponseCode >= 500 && apiResponseCode < 600) {
        mappedType = EcowittApiError.ErrorTypes.SERVER;
      } else {
        mappedType = EcowittApiError.ErrorTypes.UNKNOWN;
      }
    }

    super(defaultMessage, apiResponseCode, mappedType);
    this.name = "EcowittApiError";
    this.apiResponseCode = apiResponseCode;
    this.apiResponseMessage = apiResponseMessage;
    this.originalError = originalError;
  }

  /**
   * Checks if the Ecowitt API error is retryable.
   * @returns {boolean} True if the error indicates a transient issue and can be retried.
   */
  isRetryable() {
    return (
      this.apiResponseCode === -1 || // System busy
      (this.apiResponseCode >= 500 && this.apiResponseCode < 600) || // Server errors
      this.apiResponseCode === 429 // Standard HTTP rate limiting code, even if not explicitly in Ecowitt map.
    );
  }
}

/**
 * Error for when a requested device is not found.
 */
export class DeviceNotFoundError extends CustomError {
  /**
   * Creates an instance of DeviceNotFoundError.
   * @param {string} identifier - The name or MAC address of the device that was not found.
   */
  constructor(identifier) {
    super(`Device "${identifier}" not found.`, "DEVICE_NOT_FOUND", "device_error");
    this.name = "DeviceNotFoundError";
    this.identifier = identifier;
  }
}
