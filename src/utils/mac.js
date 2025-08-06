/**
 * MAC address formatting and validation utilities for Ecowitt device handling.
 * Provides functions to validate, format, and normalize MAC addresses in various formats.
 */

// Regex patterns for MAC address validation
const MAC_SEPARATORS_REGEX = /[:\-\s]/g;
const MAC_HEX_VALIDATION_REGEX = /^[0-9A-F]{12}$/;
const MAC_HEX_VALIDATION_CASE_INSENSITIVE_REGEX = /^[0-9A-Fa-f]{12}$/;

/**
 * Clean and normalize a MAC address by removing separators and converting to uppercase.
 * @param {string} mac - MAC address with any format (e.g., "AA:BB:CC:DD:EE:FF", "AA-BB-CC-DD-EE-FF", "AABBCCDDEEFF")
 * @returns {string} Clean MAC address in uppercase without separators (e.g., "AABBCCDDEEFF")
 * @private
 */
function cleanMacAddress(mac) {
  return mac.replace(MAC_SEPARATORS_REGEX, "").toUpperCase();
}

/**
 * Validate if a string is a valid MAC address format.
 * Accepts various formats including colons, dashes, or no separators.
 * Case-insensitive validation.
 * @param {string} mac - MAC address to validate (e.g., "AA:BB:CC:DD:EE:FF", "aa-bb-cc-dd-ee-ff", "AABBCCDDEEFF")
 * @returns {boolean} True if valid MAC address format, false otherwise
 */
export function isValidMacAddress(mac) {
  if (!mac || typeof mac !== "string") {
    return false;
  }

  // Check for malformed separators (consecutive separators like :: or --)
  if (/[:\-\s]{2,}/.test(mac)) {
    return false;
  }

  const cleanMac = cleanMacAddress(mac);
  return MAC_HEX_VALIDATION_CASE_INSENSITIVE_REGEX.test(cleanMac);
}

/**
 * Validate MAC address input and throw error if invalid.
 * Performs strict validation requiring uppercase hexadecimal characters.
 * @param {string} mac - MAC address to validate
 * @throws {Error} If MAC address is null, undefined, not a string, or has invalid format
 * @private
 */
function validateMacAddress(mac) {
  if (!mac || typeof mac !== "string") {
    throw new Error("MAC address must be a non-empty string");
  }

  const cleanMac = cleanMacAddress(mac);
  if (!MAC_HEX_VALIDATION_REGEX.test(cleanMac)) {
    throw new Error("Invalid MAC address format. Expected 12 hexadecimal characters.");
  }
}

/**
 * Format a MAC address to include colons between each pair of hex digits.
 * Accepts input with or without existing separators and normalizes to colon format.
 * @param {string} mac - MAC address with or without separators (e.g., "AABBCCDDEEFF", "AA-BB-CC-DD-EE-FF")
 * @returns {string} MAC address formatted with colons (e.g., "AA:BB:CC:DD:EE:FF")
 * @throws {Error} If the MAC address format is invalid or input is not a valid string
 */
export function formatMacAddress(mac) {
  validateMacAddress(mac);
  const cleanMac = cleanMacAddress(mac);
  return cleanMac.replace(/(.{2})/g, "$1:").slice(0, -1);
}

/**
 * Remove separators from a MAC address to get the compact format.
 * Accepts input with various separators (colons, dashes, spaces) and returns clean format.
 * @param {string} mac - MAC address with separators (e.g., "AA:BB:CC:DD:EE:FF", "AA-BB-CC-DD-EE-FF")
 * @returns {string} MAC address without separators in uppercase (e.g., "AABBCCDDEEFF")
 * @throws {Error} If the MAC address format is invalid or input is not a valid string
 */
export function compactMacAddress(mac) {
  validateMacAddress(mac);
  return cleanMacAddress(mac);
}
