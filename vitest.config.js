import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

const packageJsonPath = join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // We can't use `--env-file` to load environment variables in Vitest so manually
    // specify them here.
    env: {
      ECOWITT_APPLICATION_KEY: "test-app-key",
      ECOWITT_API_KEY: "test-api-key",
      ECOWITT_BASE_URL: "https://api.ecowitt.net/api/v3",
      REQUEST_TIMEOUT: "1000",
    },
    provide: {
      APP_VERSION: packageJson.version,
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
