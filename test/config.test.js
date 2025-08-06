import { afterEach, beforeEach, describe, expect, inject, it, vi } from "vitest";
import { loadConfig } from "./helpers/config";

describe("Configuration", () => {
  beforeEach(() => {
    // Reset modules to ensure config is re-evaluated with new env vars
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up all stubs
    vi.unstubAllEnvs();
  });

  describe("Ecowitt API configuration", () => {
    it("should load required environment variables", async () => {
      const config = await loadConfig();
      expect(config.ecowitt.applicationKey).toBe("test-app-key");
      expect(config.ecowitt.apiKey).toBe("test-api-key");
    });

    it("should use default base URL when not specified", async () => {
      const config = await loadConfig();
      expect(config.ecowitt.baseUrl).toBe("https://api.ecowitt.net/api/v3");
    });

    it("should allow override of base URL", async () => {
      vi.stubEnv("ECOWITT_BASE_URL", "http://localhost:8080");
      vi.resetModules(); // Re-evaluate module with new env
      const config = await loadConfig();
      expect(config.ecowitt.baseUrl).toBe("http://localhost:8080");
    });
  });

  describe("Server configuration", () => {
    it("should have correct server metadata", async () => {
      const config = await loadConfig();
      expect(config.server.name).toBe("ecowitt-weather-server");
      expect(config.server.version).toBe(inject("APP_VERSION"));
    });

    it("should have default request timeout", async () => {
      const config = await loadConfig();
      expect(config.ecowitt.requestTimeout).toBe(1000);
    });

    it("should allow override of request timeout", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "5000");
      vi.resetModules();
      const config = await loadConfig();
      expect(config.ecowitt.requestTimeout).toBe(5000);
    });
  });

  describe("Validation", () => {
    it("should throw error when application key is missing", async () => {
      vi.stubEnv("ECOWITT_APPLICATION_KEY", undefined);
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("ECOWITT_APPLICATION_KEY: Required");
    });

    it("should throw error when API key is missing", async () => {
      vi.stubEnv("ECOWITT_API_KEY", undefined);
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("ECOWITT_API_KEY: Required");
    });

    it("should validate that application key is not empty", async () => {
      vi.stubEnv("ECOWITT_APPLICATION_KEY", "");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("ECOWITT_APPLICATION_KEY: ECOWITT_APPLICATION_KEY is required");
    });

    it("should validate that API key is not empty", async () => {
      vi.stubEnv("ECOWITT_API_KEY", "");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("ECOWITT_API_KEY: ECOWITT_API_KEY is required");
    });

    it("should validate base URL format", async () => {
      vi.stubEnv("ECOWITT_BASE_URL", "not-a-url");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("ECOWITT_BASE_URL: Invalid url");
    });

    it("should validate REQUEST_TIMEOUT is a positive number", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "not-a-number");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT: Expected number, received nan");
    });

    it("should validate REQUEST_TIMEOUT is not negative", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "-100");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });

    it("should validate REQUEST_TIMEOUT maximum value", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "400000");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT cannot exceed 5 minutes");
    });

    it("should handle REQUEST_TIMEOUT as zero", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "0");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });

    it("should handle empty string REQUEST_TIMEOUT", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });

    it("should validate multiple fields fail together", async () => {
      vi.stubEnv("ECOWITT_APPLICATION_KEY", undefined);
      vi.stubEnv("ECOWITT_API_KEY", "");
      vi.stubEnv("REQUEST_TIMEOUT", "not-a-number");
      vi.resetModules();

      try {
        await loadConfig();
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("Configuration validation failed:");
        expect(error.message).toContain("ECOWITT_APPLICATION_KEY: Required");
        expect(error.message).toContain("ECOWITT_API_KEY: ECOWITT_API_KEY is required");
        expect(error.message).toContain("REQUEST_TIMEOUT: Expected number, received nan");
      }
    });

    it("should use regex to validate error message format", async () => {
      vi.stubEnv("ECOWITT_BASE_URL", "invalid-url");
      vi.resetModules();

      await expect(loadConfig()).rejects.toThrow(/Configuration validation failed:\nECOWITT_BASE_URL: Invalid url/);
    });

    it("should verify error message contains specific field validation", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "999999");
      vi.resetModules();

      const errorPromise = loadConfig();
      await expect(errorPromise).rejects.toHaveProperty("message");

      try {
        await errorPromise;
      } catch (error) {
        expect(error.message).toMatch(/REQUEST_TIMEOUT.*cannot exceed 5 minutes/);
      }
    });
  });
});
