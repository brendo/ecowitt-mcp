/**
 * Base class for all custom errors in the Ecowitt MCP server.
 * Extends the native Error object to include a 'code' and 'type' property
 * for better programmatic error handling and MCP response formatting.
 */
export class CustomError extends Error {
  /**
   * Creates an instance of CustomError.
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {string} [type="server_error"] - Error type for MCP response formatting (e.g., "server_error", "external_service_error", "parameter_error", "device_error", "handler_error", "configuration_error", "timeout_error", "network_error")
   */
  constructor(message, code, type = "server_error") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

/**
 * Generic error for issues within MCP message handlers.
 */
export class HandlerError extends CustomError {
  /**
   * Creates an instance of HandlerError.
   * @param {string} message - A descriptive message about the handler error.
   * @param {Error} [originalError=null] - The original error that caused this handler error.
   */
  constructor(message, originalError = null) {
    super(message, "HANDLER_ERROR", "handler_error");
    this.name = "HandlerError";
    this.originalError = originalError;
  }
}

/**
 * Error for when data cannot be parsed (e.g., invalid JSON response).
 */
export class DataParsingError extends CustomError {
  /**
   * Creates an instance of DataParsingError.
   * @param {string} message - A descriptive message about the parsing error.
   * @param {Error} [originalError=null] - The original parsing error (e.g., SyntaxError).
   */
  constructor(message, originalError = null) {
    super(message, "DATA_PARSING_ERROR", "data_parsing_error");
    this.name = "DataParsingError";
    this.originalError = originalError;
  }
}
