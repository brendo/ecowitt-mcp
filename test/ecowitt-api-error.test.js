import { describe, expect, it } from "vitest";
import { EcowittApiError } from "../src/ecowitt/errors.js";

describe("EcowittApiError", () => {
  describe("Constructor and Properties", () => {
    it("should correctly assign properties for a known error code", () => {
      const errorCode = 40010; // Illegal Application_Key Parameter
      const error = new EcowittApiError(errorCode);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("EcowittApiError");
      expect(error.message).toBe("Illegal Application_Key Parameter");
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(EcowittApiError.ErrorTypes.AUTHENTICATION);
      expect(error.apiResponseCode).toBe(errorCode);
    });

    it("should use the provided message when the error code is unknown", () => {
      const errorCode = 99999;
      const errorMessage = "A custom, unknown error occurred.";
      const error = new EcowittApiError(errorCode, errorMessage);

      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(EcowittApiError.ErrorTypes.UNKNOWN); // Falls back to unknown
    });

    it("should classify a 4xx HTTP status as a client error if not in the map", () => {
      const errorCode = 404;
      const errorMessage = "Not Found";
      const error = new EcowittApiError(errorCode, errorMessage);

      expect(error.type).toBe(EcowittApiError.ErrorTypes.CLIENT);
    });

    it("should classify a 5xx HTTP status as a server error if not in the map", () => {
      const errorCode = 503;
      const errorMessage = "Service Unavailable";
      const error = new EcowittApiError(errorCode, errorMessage);

      expect(error.type).toBe(EcowittApiError.ErrorTypes.SERVER);
    });

    it("should store the original error if provided", () => {
      const original = new Error("Network timeout");
      const error = new EcowittApiError(500, "Server error", original);

      expect(error.originalError).toBe(original);
    });
  });

  describe("isRetryable()", () => {
    it("should return true for system busy error (-1)", () => {
      const error = new EcowittApiError(-1);
      expect(error.isRetryable()).toBe(true);
    });

    it("should return true for 5xx server errors", () => {
      const error = new EcowittApiError(500, "Internal Server Error");
      expect(error.isRetryable()).toBe(true);
    });

    it("should return true for rate limiting error (429)", () => {
      const error = new EcowittApiError(429, "Too Many Requests");
      expect(error.isRetryable()).toBe(true);
    });

    it("should return false for 4xx client errors (other than 429)", () => {
      const error = new EcowittApiError(400, "Bad Request");
      expect(error.isRetryable()).toBe(false);
    });

    it("should return false for authentication errors", () => {
      const error = new EcowittApiError(40010);
      expect(error.isRetryable()).toBe(false);
    });

    it("should return false for parameter errors", () => {
      const error = new EcowittApiError(40000);
      expect(error.isRetryable()).toBe(false);
    });
  });
});
