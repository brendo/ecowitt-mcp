/**
 * MAC address formatting utilities
 */

// Regex patterns for MAC address validation
const MAC_SEPARATORS_REGEX = /[:\-\s]/g;
const MAC_HEX_VALIDATION_REGEX = /^[0-9A-F]{12}$/;
const MAC_HEX_VALIDATION_CASE_INSENSITIVE_REGEX = /^[0-9A-Fa-f]{12}$/;

/**
 * Clean and normalize a MAC address by removing separators and converting to uppercase
 * @param {string} mac - MAC address with any format
 * @returns {string} Clean MAC address in uppercase without separators
 * @private
 */
function cleanMacAddress(mac) {
  return mac.replace(MAC_SEPARATORS_REGEX, "").toUpperCase();
}

/**
 * Validate if a string is a valid MAC address format
 * @param {string} mac - MAC address to validate
 * @returns {boolean} True if valid MAC address format
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
 * Validate MAC address input and throw error if invalid
 * @param {string} mac - MAC address to validate
 * @throws {Error} If MAC address is invalid
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
 * Format a MAC address to include colons between each pair of hex digits
 * @param {string} mac - MAC address with or without colons
 * @returns {string} MAC address formatted with colons (e.g., "AA:BB:CC:DD:EE:FF")
 * @throws {Error} If the MAC address format is invalid
 */
export function formatMacAddress(mac) {
  validateMacAddress(mac);
  const cleanMac = cleanMacAddress(mac);
  return cleanMac.replace(/(.{2})/g, "$1:").slice(0, -1);
}

/**
 * Remove colons from a MAC address to get the compact format
 * @param {string} mac - MAC address with colons
 * @returns {string} MAC address without colons (e.g., "AABBCCDDEEFF")
 * @throws {Error} If the MAC address format is invalid
 */
export function compactMacAddress(mac) {
  validateMacAddress(mac);
  return cleanMacAddress(mac);
}
