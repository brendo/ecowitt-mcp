import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

const packageJsonPath = join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "test/**", "vitest.config.js", "biome.json", "**/*.test.js"],
    },
    setupFiles: ["./test/setup.js"],
    testTimeout: 10000,
    hookTimeout: 10000,
    provide: {
      APP_VERSION: packageJson.version,
    },
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});
