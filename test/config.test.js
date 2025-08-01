import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Configuration", () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear any existing config module from cache
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("Ecowitt API configuration", () => {
    it("should load required environment variables", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";

      const { config } = await import("../config/index.js");
      expect(config.ecowitt.applicationKey).toBe("test-app-key");
      expect(config.ecowitt.apiKey).toBe("test-api-key");
    });

    it("should use default base URL when not specified", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";

      const { config } = await import("../config/index.js");
      expect(config.ecowitt.baseUrl).toBe("https://api.ecowitt.net/api/v3");
    });

    it("should allow override of base URL", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";
      process.env.ECOWITT_BASE_URL = "https://custom.api.url/v3";

      const { config } = await import("../config/index.js");
      expect(config.ecowitt.baseUrl).toBe("https://custom.api.url/v3");
    });
  });

  describe("Server configuration", () => {
    it("should have correct server metadata", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";

      const { config } = await import("../config/index.js");
      expect(config.server.name).toBe("ecowitt-weather-server");
      expect(config.server.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("should have default request timeout", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";
      delete process.env.REQUEST_TIMEOUT;

      const { config } = await import("../config/index.js");
      expect(config.server.requestTimeout).toBe(10000);
    });

    it("should allow override of request timeout", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      process.env.ECOWITT_API_KEY = "test-api-key";
      process.env.REQUEST_TIMEOUT = "5000";

      const { config } = await import("../config/index.js");
      expect(config.server.requestTimeout).toBe(5000);
    });
  });

  describe("Validation", () => {
    it("should throw error when application key is missing", async () => {
      delete process.env.ECOWITT_APPLICATION_KEY;
      process.env.ECOWITT_API_KEY = "test-api-key";

      await expect(async () => {
        await import("../config/index.js");
      }).rejects.toThrow("Missing required environment variable: ECOWITT_APPLICATION_KEY");
    });

    it("should throw error when API key is missing", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "test-app-key";
      delete process.env.ECOWITT_API_KEY;

      await expect(async () => {
        await import("../config/index.js");
      }).rejects.toThrow("Missing required environment variable: ECOWITT_API_KEY");
    });

    it("should validate that application key is not empty", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "";
      process.env.ECOWITT_API_KEY = "valid-key";

      await expect(async () => {
        await import("../config/index.js");
      }).rejects.toThrow("ECOWITT_APPLICATION_KEY cannot be empty");
    });

    it("should validate that API key is not empty", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "valid-key";
      process.env.ECOWITT_API_KEY = "";

      await expect(async () => {
        await import("../config/index.js");
      }).rejects.toThrow("ECOWITT_API_KEY cannot be empty");
    });

    it("should validate base URL format", async () => {
      process.env.ECOWITT_APPLICATION_KEY = "valid-key";
      process.env.ECOWITT_API_KEY = "valid-key";
      process.env.ECOWITT_BASE_URL = "not-a-valid-url";

      await expect(async () => {
        await import("../config/index.js");
      }).rejects.toThrow("Invalid ECOWITT_BASE_URL format");
    });
  });
});
