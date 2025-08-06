import { describe, expect, it } from "vitest";
import { clearConfigCache, getConfig } from "../src/config/index.js";
import { createMCPServer } from "../src/server/index.js";

describe("Integration Tests", () => {
  describe("Server Creation with Lazy-Loaded Config", () => {
    it("should create MCP server with lazily loaded config", async () => {
      // Clear any cached config to ensure fresh load
      clearConfigCache();

      // Get config using the lazy loader
      const config = getConfig();

      // Verify config has expected properties
      expect(config).toHaveProperty("ecowitt");
      expect(config).toHaveProperty("server");
      expect(config.ecowitt).toHaveProperty("applicationKey");
      expect(config.ecowitt).toHaveProperty("apiKey");
      expect(config.server).toHaveProperty("name");
      expect(config.server).toHaveProperty("version");

      // Create server with the config
      const server = await createMCPServer(config);
      expect(server).toBeDefined();
    });
  });
});
