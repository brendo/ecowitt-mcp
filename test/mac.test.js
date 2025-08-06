import { describe, expect, it } from "vitest";
import { compactMacAddress, formatMacAddress, isValidMacAddress } from "../src/utils/mac.js";

describe("MAC address utilities", () => {
  describe("formatMacAddress", () => {
    it("should format MAC address without colons", () => {
      expect(formatMacAddress("AABBCCDDEEFF")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should return MAC address with colons unchanged", () => {
      expect(formatMacAddress("AA:BB:CC:DD:EE:FF")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should handle lowercase input", () => {
      expect(formatMacAddress("aabbccddeeff")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should handle mixed case input", () => {
      expect(formatMacAddress("AaBbCcDdEeFf")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should handle MAC with hyphens", () => {
      expect(formatMacAddress("AA-BB-CC-DD-EE-FF")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should handle MAC with spaces", () => {
      expect(formatMacAddress("AA BB CC DD EE FF")).toBe("AA:BB:CC:DD:EE:FF");
    });

    it("should throw error for empty string", () => {
      expect(() => formatMacAddress("")).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for null input", () => {
      expect(() => formatMacAddress(null)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for undefined input", () => {
      expect(() => formatMacAddress(undefined)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for non-string input", () => {
      expect(() => formatMacAddress(123456)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for invalid length", () => {
      expect(() => formatMacAddress("AABBCCDDEE")).toThrow(
        "Invalid MAC address format. Expected 12 hexadecimal characters."
      );
    });

    it("should throw error for invalid characters", () => {
      expect(() => formatMacAddress("GGBBCCDDEEFF")).toThrow(
        "Invalid MAC address format. Expected 12 hexadecimal characters."
      );
    });
  });

  describe("compactMacAddress", () => {
    it("should remove colons from MAC address", () => {
      expect(compactMacAddress("AA:BB:CC:DD:EE:FF")).toBe("AABBCCDDEEFF");
    });

    it("should return compact MAC unchanged", () => {
      expect(compactMacAddress("AABBCCDDEEFF")).toBe("AABBCCDDEEFF");
    });

    it("should handle lowercase input", () => {
      expect(compactMacAddress("aa:bb:cc:dd:ee:ff")).toBe("AABBCCDDEEFF");
    });

    it("should handle MAC with hyphens", () => {
      expect(compactMacAddress("AA-BB-CC-DD-EE-FF")).toBe("AABBCCDDEEFF");
    });

    it("should handle MAC with spaces", () => {
      expect(compactMacAddress("AA BB CC DD EE FF")).toBe("AABBCCDDEEFF");
    });

    it("should throw error for empty string", () => {
      expect(() => compactMacAddress("")).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for null input", () => {
      expect(() => compactMacAddress(null)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for undefined input", () => {
      expect(() => compactMacAddress(undefined)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for non-string input", () => {
      expect(() => compactMacAddress(123456)).toThrow("MAC address must be a non-empty string");
    });

    it("should throw error for invalid length", () => {
      expect(() => compactMacAddress("AA:BB:CC:DD:EE")).toThrow(
        "Invalid MAC address format. Expected 12 hexadecimal characters."
      );
    });

    it("should throw error for invalid characters", () => {
      expect(() => compactMacAddress("GG:BB:CC:DD:EE:FF")).toThrow(
        "Invalid MAC address format. Expected 12 hexadecimal characters."
      );
    });
  });

  describe("isValidMacAddress", () => {
    it("should return true for valid MAC with colons", () => {
      expect(isValidMacAddress("AA:BB:CC:DD:EE:FF")).toBe(true);
    });

    it("should return true for valid MAC without colons", () => {
      expect(isValidMacAddress("AABBCCDDEEFF")).toBe(true);
    });

    it("should return true for valid MAC with hyphens", () => {
      expect(isValidMacAddress("AA-BB-CC-DD-EE-FF")).toBe(true);
    });

    it("should return true for valid MAC with spaces", () => {
      expect(isValidMacAddress("AA BB CC DD EE FF")).toBe(true);
    });

    it("should return true for lowercase MAC", () => {
      expect(isValidMacAddress("aa:bb:cc:dd:ee:ff")).toBe(true);
    });

    it("should return true for mixed case MAC", () => {
      expect(isValidMacAddress("Aa:Bb:Cc:Dd:Ee:Ff")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isValidMacAddress("")).toBe(false);
    });

    it("should return false for null input", () => {
      expect(isValidMacAddress(null)).toBe(false);
    });

    it("should return false for undefined input", () => {
      expect(isValidMacAddress(undefined)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isValidMacAddress(123456)).toBe(false);
    });

    it("should return false for too short MAC", () => {
      expect(isValidMacAddress("AA:BB:CC:DD:EE")).toBe(false);
    });

    it("should return false for too long MAC", () => {
      expect(isValidMacAddress("AA:BB:CC:DD:EE:FF:GG")).toBe(false);
    });

    it("should return false for invalid characters", () => {
      expect(isValidMacAddress("GG:BB:CC:DD:EE:FF")).toBe(false);
    });

    it("should return false for invalid format", () => {
      expect(isValidMacAddress("AA::BB:CC:DD:EE:FF")).toBe(false);
    });
  });
});
