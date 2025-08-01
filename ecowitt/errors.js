/**
 * Ecowitt API error classification and handling utilities
 */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: Stylistic */
export class EcowittErrorClassifier {
  /**
   * Error type constants
   */
  static ErrorTypes = {
    SERVER_BUSY: "server_busy_error",
    AUTHENTICATION: "authentication_error",
    PARAMETER: "parameter_error",
    DEVICE: "device_error",
    CLIENT: "client_error",
    SERVER: "server_error",
    UNKNOWN: "unknown_error",
  };

  /**
   * Ecowitt-specific error code mappings
   */
  static ErrorCodeMap = {
    [-1]: "server_busy_error",
    40000: "parameter_error",
    40010: "authentication_error", // Illegal Application_Key Parameter
    40011: "authentication_error", // Illegal Api_Key Parameter
    40012: "device_error", // Illegal MAC/IMEI Parameter
    40013: "parameter_error", // Illegal start_date Parameter
    40014: "parameter_error", // Illegal end_date Parameter
    40015: "parameter_error", // Illegal cycle_type Parameter
    40016: "parameter_error", // Illegal call_back Parameter
    40017: "parameter_error", // Missing Application_Key Parameter
    40018: "parameter_error", // Missing Api_Key Parameter
    40019: "device_error", // Missing MAC Parameter
    40020: "parameter_error", // Missing start_date Parameter
    40021: "parameter_error", // Missing end_date Parameter
  };

  /**
   * Standard error messages for Ecowitt error codes
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
   * Classify an error based on Ecowitt error code and message
   * @param {number} code - Error code from API response
   * @param {string} message - Error message from API response
   * @returns {Object} Classified error object
   */
  static classifyError(code, message) {
    let type = EcowittErrorClassifier.ErrorCodeMap[code];

    // If no specific mapping, fall back to HTTP status code patterns
    if (!type) {
      if (code >= 400 && code < 500) {
        type = EcowittErrorClassifier.ErrorTypes.CLIENT;
      } else if (code >= 500 && code < 600) {
        type = EcowittErrorClassifier.ErrorTypes.SERVER;
      } else {
        type = EcowittErrorClassifier.ErrorTypes.UNKNOWN;
      }
    }

    return {
      code,
      message,
      type,
    };
  }

  /**
   * Check if an error code indicates an authentication problem
   * @param {number} code - Error code to check
   * @returns {boolean} True if authentication error
   */
  static isAuthenticationError(code) {
    return (
      EcowittErrorClassifier.ErrorCodeMap[code] === EcowittErrorClassifier.ErrorTypes.AUTHENTICATION
    );
  }

  /**
   * Check if an error code indicates a parameter problem
   * @param {number} code - Error code to check
   * @returns {boolean} True if parameter error
   */
  static isParameterError(code) {
    return (
      EcowittErrorClassifier.ErrorCodeMap[code] === EcowittErrorClassifier.ErrorTypes.PARAMETER
    );
  }

  /**
   * Check if an error code indicates a device problem
   * @param {number} code - Error code to check
   * @returns {boolean} True if device error
   */
  static isDeviceError(code) {
    return EcowittErrorClassifier.ErrorCodeMap[code] === EcowittErrorClassifier.ErrorTypes.DEVICE;
  }

  /**
   * Check if an error code indicates the system is busy
   * @param {number} code - Error code to check
   * @returns {boolean} True if system busy error
   */
  static isSystemBusyError(code) {
    return code === -1;
  }

  /**
   * Check if an error is retryable (system busy, server errors)
   * @param {number} code - Error code to check
   * @returns {boolean} True if error might be resolved by retrying
   */
  static isRetryableError(code) {
    return (
      EcowittErrorClassifier.isSystemBusyError(code) || (code >= 500 && code < 600) || code === 429 // Rate limiting
    );
  }

  /**
   * Get a human-readable description for an error code
   * @param {number} code - Error code
   * @returns {string} Human-readable error description
   */
  static getErrorDescription(code) {
    return EcowittErrorClassifier.ErrorMessages[code] || `Unknown error code: ${code}`;
  }

  /**
   * Create a standardized error response
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {Object} additionalInfo - Additional error context
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(code, message, additionalInfo = {}) {
    const classification = EcowittErrorClassifier.classifyError(code, message);

    return {
      success: false,
      error: {
        ...classification,
        retryable: EcowittErrorClassifier.isRetryableError(code),
        ...additionalInfo,
      },
    };
  }
}
