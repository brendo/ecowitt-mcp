import { afterEach, beforeEach, describe, expect, inject, it, vi } from "vitest";

// Helper to load the config module fresh for each test
const loadConfig = async () => {
  const { config } = await import("../config/index.js");
  return config;
};

describe("Configuration", () => {
  beforeEach(() => {
    // Reset modules to ensure config is re-evaluated with new env vars
    vi.resetModules();
    // Stub required env vars to prevent top-level validation errors in most tests
    vi.stubEnv("ECOWITT_APPLICATION_KEY", "test-app-key");
    vi.stubEnv("ECOWITT_API_KEY", "test-api-key");
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
      expect(config.server.requestTimeout).toBe(10000);
    });

    it("should allow override of request timeout", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "5000");
      vi.resetModules();
      const config = await loadConfig();
      expect(config.server.requestTimeout).toBe(5000);
    });
  });

  describe("Validation", () => {
    it("should throw error when application key is missing", async () => {
      vi.stubEnv("ECOWITT_APPLICATION_KEY", undefined);
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("Missing required environment variable: ECOWITT_APPLICATION_KEY");
    });

    it("should throw error when API key is missing", async () => {
      vi.stubEnv("ECOWITT_API_KEY", undefined);
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("Missing required environment variable: ECOWITT_API_KEY");
    });

    it("should validate that application key is not empty", async () => {
      vi.stubEnv("ECOWITT_APPLICATION_KEY", " ");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("The environment variable 'ECOWITT_APPLICATION_KEY' cannot be empty");
    });

    it("should validate that API key is not empty", async () => {
      vi.stubEnv("ECOWITT_API_KEY", "");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("The environment variable 'ECOWITT_API_KEY' cannot be empty");
    });

    it("should validate base URL format", async () => {
      vi.stubEnv("ECOWITT_BASE_URL", "not-a-url");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("Invalid ECOWITT_BASE_URL format");
    });

    it("should validate REQUEST_TIMEOUT is a positive number", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "not-a-number");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });

    it("should validate REQUEST_TIMEOUT is not negative", async () => {
      vi.stubEnv("REQUEST_TIMEOUT", "-100");
      vi.resetModules();
      await expect(loadConfig()).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });
  });
});
