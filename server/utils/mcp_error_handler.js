import { EcowittApiError } from "../../ecowitt/errors.js";
import { CustomError, DataParsingError } from "../../utils/errors.js";

/**
 * Centralized error handler for mapping custom errors to MCP error responses.
 * Adheres to the Single Responsibility Principle by focusing solely on error transformation.
 *
 * @param {Error} error - The error object to handle.
 * @returns {Object} An MCP-compliant error response object.
 */
export function toMcpErrorResponse(error) {
  let mcpCode, mcpMessage, mcpType, originalErrorMessage;
  let isRetryable = false;

  if (error instanceof CustomError) {
    mcpCode = error.code;
    mcpMessage = error.message;
    mcpType = error.type;

    // Default originalErrorMessage for CustomErrors that wrap another error
    if (error.originalError) {
      originalErrorMessage = error.originalError.message;
    }

    if (typeof error.isRetryable === "function") {
      isRetryable = error.isRetryable();
    }

    if (error instanceof EcowittApiError && error.apiResponseMessage) {
      // For EcowittApiError, prioritize apiResponseMessage for the original error message if available
      originalErrorMessage = error.apiResponseMessage;
    } else if (error instanceof DataParsingError) {
      mcpType = "external_service_error"; // Override type for data parsing
    } else {
      // This covers generic CustomError instances (NETWORK_ERROR, TIMEOUT_ERROR, CONFIGURATION_ERROR)
      isRetryable = ["NETWORK_ERROR", "TIMEOUT_ERROR"].includes(error.code) || error.type === "server_busy_error";
    }
  } else {
    // This is for native Error objects or other unexpected types
    mcpCode = "UNHANDLED_EXCEPTION";
    mcpMessage = `An unhandled exception occurred: ${error.message}`;
    mcpType = "server_error";
  }

  const errorResponse = {
    error: {
      code: mcpCode,
      message: mcpMessage,
      type: mcpType,
    },
  };

  if (isRetryable) {
    errorResponse.error.retryable = true;
  }
  // Only add originalErrorMessage if it's explicitly set to something other than undefined
  if (originalErrorMessage !== undefined) {
    errorResponse.error.originalErrorMessage = originalErrorMessage;
  }

  return errorResponse;
}
