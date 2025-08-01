import { describe, expect, it } from "vitest";
import { EcowittErrorClassifier } from "../ecowitt/errors.js";

describe("EcowittErrorClassifier", () => {
  describe("Error classification", () => {
    it("should classify system busy errors", () => {
      const error = EcowittErrorClassifier.classifyError(-1, "System is busy.");
      expect(error).toEqual({
        code: -1,
        message: "System is busy.",
        type: "server_busy_error",
      });
    });

    it("should classify illegal application key errors", () => {
      const error = EcowittErrorClassifier.classifyError(
        40010,
        "Illegal Application_Key Parameter"
      );
      expect(error).toEqual({
        code: 40010,
        message: "Illegal Application_Key Parameter",
        type: "authentication_error",
      });
    });

    it("should classify illegal API key errors", () => {
      const error = EcowittErrorClassifier.classifyError(40011, "Illegal Api_Key Parameter");
      expect(error).toEqual({
        code: 40011,
        message: "Illegal Api_Key Parameter",
        type: "authentication_error",
      });
    });

    it("should classify illegal parameter errors", () => {
      const error = EcowittErrorClassifier.classifyError(40000, "Illegal parameter");
      expect(error).toEqual({
        code: 40000,
        message: "Illegal parameter",
        type: "parameter_error",
      });
    });

    it("should classify missing parameter errors", () => {
      const error = EcowittErrorClassifier.classifyError(
        40017,
        "Missing Application_Key Parameter"
      );
      expect(error).toEqual({
        code: 40017,
        message: "Missing Application_Key Parameter",
        type: "parameter_error",
      });
    });

    it("should classify device MAC errors", () => {
      const error = EcowittErrorClassifier.classifyError(40012, "Illegal MAC/IMEI Parameter");
      expect(error).toEqual({
        code: 40012,
        message: "Illegal MAC/IMEI Parameter",
        type: "device_error",
      });
    });

    it("should classify missing MAC errors", () => {
      const error = EcowittErrorClassifier.classifyError(40019, "Missing MAC Parameter");
      expect(error).toEqual({
        code: 40019,
        message: "Missing MAC Parameter",
        type: "device_error",
      });
    });

    it("should classify HTTP client errors", () => {
      const error = EcowittErrorClassifier.classifyError(404, "Not Found");
      expect(error).toEqual({
        code: 404,
        message: "Not Found",
        type: "client_error",
      });
    });

    it("should classify HTTP server errors", () => {
      const error = EcowittErrorClassifier.classifyError(500, "Internal server error");
      expect(error).toEqual({
        code: 500,
        message: "Internal server error",
        type: "server_error",
      });
    });

    it("should classify unknown errors", () => {
      const error = EcowittErrorClassifier.classifyError(999, "Unknown error");
      expect(error).toEqual({
        code: 999,
        message: "Unknown error",
        type: "unknown_error",
      });
    });
  });

  describe("Error type checking methods", () => {
    it("should identify authentication errors", () => {
      expect(EcowittErrorClassifier.isAuthenticationError(40010)).toBe(true);
      expect(EcowittErrorClassifier.isAuthenticationError(40011)).toBe(true);
      expect(EcowittErrorClassifier.isAuthenticationError(40000)).toBe(false);
    });

    it("should identify parameter errors", () => {
      expect(EcowittErrorClassifier.isParameterError(40000)).toBe(true);
      expect(EcowittErrorClassifier.isParameterError(40017)).toBe(true);
      expect(EcowittErrorClassifier.isParameterError(40018)).toBe(true);
      expect(EcowittErrorClassifier.isParameterError(40010)).toBe(false);
    });

    it("should identify device errors", () => {
      expect(EcowittErrorClassifier.isDeviceError(40012)).toBe(true);
      expect(EcowittErrorClassifier.isDeviceError(40019)).toBe(true);
      expect(EcowittErrorClassifier.isDeviceError(40000)).toBe(false);
    });

    it("should identify system busy errors", () => {
      expect(EcowittErrorClassifier.isSystemBusyError(-1)).toBe(true);
      expect(EcowittErrorClassifier.isSystemBusyError(40000)).toBe(false);
    });
  });

  describe("Retryable error detection", () => {
    it("should identify retryable errors", () => {
      expect(EcowittErrorClassifier.isRetryableError(-1)).toBe(true); // System busy
      expect(EcowittErrorClassifier.isRetryableError(500)).toBe(true); // Server error
      expect(EcowittErrorClassifier.isRetryableError(502)).toBe(true); // Bad gateway
      expect(EcowittErrorClassifier.isRetryableError(503)).toBe(true); // Service unavailable
      expect(EcowittErrorClassifier.isRetryableError(429)).toBe(true); // Rate limiting
    });

    it("should identify non-retryable errors", () => {
      expect(EcowittErrorClassifier.isRetryableError(40010)).toBe(false); // Auth error
      expect(EcowittErrorClassifier.isRetryableError(40000)).toBe(false); // Parameter error
      expect(EcowittErrorClassifier.isRetryableError(404)).toBe(false); // Not found
      expect(EcowittErrorClassifier.isRetryableError(400)).toBe(false); // Bad request
    });
  });

  describe("Error descriptions", () => {
    it("should provide descriptions for known error codes", () => {
      expect(EcowittErrorClassifier.getErrorDescription(-1)).toBe("System is busy.");
      expect(EcowittErrorClassifier.getErrorDescription(40010)).toBe(
        "Illegal Application_Key Parameter"
      );
      expect(EcowittErrorClassifier.getErrorDescription(40011)).toBe("Illegal Api_Key Parameter");
    });

    it("should provide default description for unknown error codes", () => {
      expect(EcowittErrorClassifier.getErrorDescription(99999)).toBe("Unknown error code: 99999");
    });
  });

  describe("Error response creation", () => {
    it("should create standardized error responses", () => {
      const response = EcowittErrorClassifier.createErrorResponse(
        40010,
        "Illegal Application_Key Parameter"
      );

      expect(response).toEqual({
        success: false,
        error: {
          code: 40010,
          message: "Illegal Application_Key Parameter",
          type: "authentication_error",
          retryable: false,
        },
      });
    });

    it("should include additional info in error responses", () => {
      const response = EcowittErrorClassifier.createErrorResponse(-1, "System is busy.", {
        timestamp: "2024-01-01T12:00:00Z",
      });

      expect(response).toEqual({
        success: false,
        error: {
          code: -1,
          message: "System is busy.",
          type: "server_busy_error",
          retryable: true,
          timestamp: "2024-01-01T12:00:00Z",
        },
      });
    });
  });

  describe("Error code mappings", () => {
    it("should have correct mappings for all documented error codes", () => {
      const testCases = [
        { code: -1, expectedType: "server_busy_error" },
        { code: 40000, expectedType: "parameter_error" },
        { code: 40010, expectedType: "authentication_error" },
        { code: 40011, expectedType: "authentication_error" },
        { code: 40012, expectedType: "device_error" },
        { code: 40013, expectedType: "parameter_error" },
        { code: 40014, expectedType: "parameter_error" },
        { code: 40015, expectedType: "parameter_error" },
        { code: 40016, expectedType: "parameter_error" },
        { code: 40017, expectedType: "parameter_error" },
        { code: 40018, expectedType: "parameter_error" },
        { code: 40019, expectedType: "device_error" },
        { code: 40020, expectedType: "parameter_error" },
        { code: 40021, expectedType: "parameter_error" },
      ];

      testCases.forEach(({ code, expectedType }) => {
        const error = EcowittErrorClassifier.classifyError(code, `Test message for ${code}`);
        expect(error.type).toBe(expectedType);
      });
    });
  });
});
