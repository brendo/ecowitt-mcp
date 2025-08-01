import { cloneFixture, loadFixture } from "./fixtures.js";

/**
 * Create a mock fetch response object
 * @param {Object} data - Response data
 * @param {Object} options - Response options
 * @param {number} options.status - HTTP status code (default: 200)
 * @param {boolean} options.ok - Whether response is ok (default: status < 400)
 * @param {string} options.statusText - Status text (default: based on status)
 * @returns {Object} Mock fetch response
 */
export function createMockResponse(data, options = {}) {
  const { status = 200, ok = status < 400, statusText = getStatusText(status) } = options;

  return {
    ok,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map([["content-type", "application/json"]]),
  };
}

/**
 * Create a mock fetch response that rejects (network error)
 * @param {string} message - Error message
 * @returns {Promise} Rejected promise
 */
export function createMockNetworkError(message = "Network error") {
  return Promise.reject(new Error(message));
}

/**
 * Create a mock fetch response that rejects with timeout error
 * @returns {Promise} Rejected promise with AbortError
 */
export function createMockTimeoutError() {
  const error = new DOMException("Aborted", "AbortError");
  return Promise.reject(error);
}

/**
 * Create a mock fetch response with malformed JSON
 * @param {Object} options - Response options
 * @returns {Object} Mock fetch response that fails to parse JSON
 */
export function createMockMalformedResponse(options = {}) {
  const { status = 200, ok = true, statusText = "OK" } = options;

  return {
    ok,
    status,
    statusText,
    json: () => Promise.reject(new Error("Invalid JSON")),
    text: () => Promise.resolve("invalid json content"),
    headers: new Map([["content-type", "application/json"]]),
  };
}

/**
 * Create a mock fetch response from a fixture
 * @param {string} category - Fixture category
 * @param {string} name - Fixture name
 * @param {Object} options - Response options
 * @returns {Object} Mock fetch response
 */
export function createMockResponseFromFixture(category, name, options = {}) {
  const fixture = loadFixture(category, name);
  return createMockResponse(fixture, options);
}

/**
 * Create a successful Ecowitt API response from fixture
 * @param {string} fixtureName - Name of the fixture file (without extension)
 * @param {Object} overrides - Optional data overrides
 * @returns {Object} Mock fetch response
 */
export function createEcowittSuccessResponse(fixtureName, overrides = {}) {
  const fixture = loadFixture("ecowitt", fixtureName);
  const data = overrides ? { ...cloneFixture(fixture), ...overrides } : fixture;
  return createMockResponse(data);
}

/**
 * Create an Ecowitt API error response
 * @param {number} code - Ecowitt error code
 * @param {string} message - Error message
 * @param {Object} options - Additional response options
 * @returns {Object} Mock fetch response
 */
export function createEcowittErrorResponse(code, message, options = {}) {
  const data = {
    code,
    msg: message,
    time: Math.floor(Date.now() / 1000),
  };
  return createMockResponse(data, options);
}

/**
 * Create an HTTP error response
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 * @returns {Object} Mock fetch response
 */
export function createHttpErrorResponse(status, statusText) {
  return createMockResponse({}, { status, statusText, ok: false });
}

/**
 * Get standard status text for HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string} Status text
 */
function getStatusText(status) {
  const statusTexts = {
    200: "OK",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "Unknown";
}

/**
 * Common Ecowitt error responses for easy reuse
 * Use createEcowittErrorResponse(code, message) for specific errors
 */
export const EcowittErrors = {
  systemBusy: () => createEcowittErrorResponse(-1, "System is busy."),
  illegalApplicationKey: () =>
    createEcowittErrorResponse(40010, "Illegal Application_Key Parameter"),
  illegalApiKey: () => createEcowittErrorResponse(40011, "Illegal Api_Key Parameter"),
  missingMac: () => createEcowittErrorResponse(40019, "Missing MAC Parameter"),
};

/**
 * Common HTTP error responses for easy reuse
 */
export const HttpErrors = {
  badRequest: () => createHttpErrorResponse(400, "Bad Request"),
  unauthorized: () => createHttpErrorResponse(401, "Unauthorized"),
  forbidden: () => createHttpErrorResponse(403, "Forbidden"),
  notFound: () => createHttpErrorResponse(404, "Not Found"),
  methodNotAllowed: () => createHttpErrorResponse(405, "Method Not Allowed"),
  tooManyRequests: () => createHttpErrorResponse(429, "Too Many Requests"),
  internalServerError: () => createHttpErrorResponse(500, "Internal Server Error"),
  badGateway: () => createHttpErrorResponse(502, "Bad Gateway"),
  serviceUnavailable: () => createHttpErrorResponse(503, "Service Unavailable"),
};
