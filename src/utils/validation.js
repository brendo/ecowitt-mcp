/**
 * Validates that a required parameter exists and is a non-empty string.
 * This is useful for validating both configuration values and function parameters.
 *
 * @param {string} name - The name of the parameter for the error message (e.g., "MAC address", "API key")
 * @param {*} value - The value of the parameter to check (can be any type, will be validated)
 * @param {string} [context='parameter'] - Optional context for the error message (e.g., 'environment variable', 'configuration value')
 * @throws {Error} If the parameter is missing (undefined/null), not a string, or an empty/whitespace-only string
 *
 * @example
 * validateRequired("API key", process.env.API_KEY, "environment variable");
 * validateRequired("MAC address", "AA:BB:CC:DD:EE:FF"); // Uses default 'parameter' context
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
