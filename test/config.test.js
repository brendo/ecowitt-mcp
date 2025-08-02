import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Configuration", () => {
  // Helper function to test config loading in a separate process
  const testConfigInProcess = (env) => {
    return new Promise((resolve, reject) => {
      const configPath = join(__dirname, "..", "config", "index.js");
      const testScript = `
        try {
          const { config } = await import('${configPath}');
          console.log(JSON.stringify(config));
          process.exit(0);
        } catch (error) {
          console.error(error.message);
          process.exit(1);
        }
      `;

      const child = spawn("node", ["--input-type=module", "-e", testScript], {
        env: { ...process.env, ...env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          try {
            const config = JSON.parse(stdout.trim());
            resolve(config);
          } catch (_error) {
            reject(new Error(`Failed to parse config: ${stdout}`));
          }
        } else {
          reject(new Error(stderr.trim()));
        }
      });

      child.on("error", (error) => {
        reject(error);
      });
    });
  };

  describe("Ecowitt API configuration", () => {
    it("should load required environment variables", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
      });

      expect(config.ecowitt.applicationKey).toBe("test-app-key");
      expect(config.ecowitt.apiKey).toBe("test-api-key");
    });

    it("should use default base URL when not specified", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
      });

      expect(config.ecowitt.baseUrl).toBe("https://api.ecowitt.net/api/v3");
    });

    it("should allow override of base URL", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
        ECOWITT_BASE_URL: "https://custom.api.url/v3",
      });

      expect(config.ecowitt.baseUrl).toBe("https://custom.api.url/v3");
    });
  });

  describe("Server configuration", () => {
    it("should have correct server metadata", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
      });

      expect(config.server.name).toBe("ecowitt-weather-server");
      expect(config.server.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("should have default request timeout", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
      });

      expect(config.server.requestTimeout).toBe(10000);
    });

    it("should allow override of request timeout", async () => {
      const config = await testConfigInProcess({
        ECOWITT_APPLICATION_KEY: "test-app-key",
        ECOWITT_API_KEY: "test-api-key",
        REQUEST_TIMEOUT: "5000",
      });

      expect(config.server.requestTimeout).toBe(5000);
    });
  });

  describe("Validation", () => {
    it("should throw error when application key is missing", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_API_KEY: "test-api-key",
        })
      ).rejects.toThrow("Missing required environment variable: ECOWITT_APPLICATION_KEY");
    });

    it("should throw error when API key is missing", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "test-app-key",
        })
      ).rejects.toThrow("Missing required environment variable: ECOWITT_API_KEY");
    });

    it("should validate that application key is not empty", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "",
          ECOWITT_API_KEY: "valid-key",
        })
      ).rejects.toThrow("ECOWITT_APPLICATION_KEY cannot be empty");
    });

    it("should validate that API key is not empty", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "valid-key",
          ECOWITT_API_KEY: "",
        })
      ).rejects.toThrow("ECOWITT_API_KEY cannot be empty");
    });

    it("should validate base URL format", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "valid-key",
          ECOWITT_API_KEY: "valid-key",
          ECOWITT_BASE_URL: "not-a-valid-url",
        })
      ).rejects.toThrow("Invalid ECOWITT_BASE_URL format");
    });

    it("should validate REQUEST_TIMEOUT is a positive number", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "valid-key",
          ECOWITT_API_KEY: "valid-key",
          REQUEST_TIMEOUT: "invalid",
        })
      ).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });

    it("should validate REQUEST_TIMEOUT is not negative", async () => {
      await expect(
        testConfigInProcess({
          ECOWITT_APPLICATION_KEY: "valid-key",
          ECOWITT_API_KEY: "valid-key",
          REQUEST_TIMEOUT: "-1000",
        })
      ).rejects.toThrow("REQUEST_TIMEOUT must be a positive number");
    });
  });
});
