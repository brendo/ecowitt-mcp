/**
 * Validates that a required parameter exists and is a non-empty string.
 * This is useful for validating both configuration values and function parameters.
 * @param {string} name - The name of the parameter for the error message.
 * @param {*} value - The value of the parameter to check.
 * @param {string} [context='parameter'] - Optional context for the error message (e.g., 'environment variable').
 * @throws {Error} If the parameter is missing, not a string, or an empty string.
 */
export function validateRequired(name, value, context = "parameter") {
  if (value === undefined || value === null) {
    throw new Error(`Missing required ${context}: ${name}`);
  }
  if (typeof value !== "string") {
    throw new Error(`The ${context} '${name}' must be a string.`);
  }
  if (value.trim() === "") {
    throw new Error(`The ${context} '${name}' cannot be empty.`);
  }
}

/**
 * Validates URL format.
 * @param {string} url - URL to validate.
 * @returns {boolean} True if valid URL.
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
