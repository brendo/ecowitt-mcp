import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json for version info
const packageJsonPath = join(__dirname, "../..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Environment variables schema
const EnvSchema = z.object({
  ECOWITT_APPLICATION_KEY: z.string().min(1, "ECOWITT_APPLICATION_KEY is required").trim(),
  ECOWITT_API_KEY: z.string().min(1, "ECOWITT_API_KEY is required").trim(),
  ECOWITT_BASE_URL: z.string().url().optional().default("https://api.ecowitt.net/api/v3"),
  REQUEST_TIMEOUT: z
    .string()
    .optional()
    .default("10000")
    .pipe(
      z.coerce
        .number()
        .positive("REQUEST_TIMEOUT must be a positive number")
        .max(300000, "REQUEST_TIMEOUT cannot exceed 5 minutes")
    ),
});

// Validate environment variables with better error handling
let env;
try {
  env = EnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }
  throw error;
}

/**
 * Application configuration object combining environment variables and package metadata
 * @type {Object}
 * @property {Object} ecowitt - Ecowitt API configuration
 * @property {string} ecowitt.applicationKey - Ecowitt application key from ECOWITT_APPLICATION_KEY env var
 * @property {string} ecowitt.apiKey - Ecowitt API key from ECOWITT_API_KEY env var
 * @property {string} ecowitt.baseUrl - Base URL for Ecowitt API (default: https://api.ecowitt.net/api/v3)
 * @property {number} ecowitt.requestTimeout - Request timeout in milliseconds (default: 10000)
 * @property {Object} server - Server configuration
 * @property {string} server.name - MCP server name
 * @property {string} server.version - Server version from package.json
 */
export const config = {
  ecowitt: {
    applicationKey: env.ECOWITT_APPLICATION_KEY,
    apiKey: env.ECOWITT_API_KEY,
    baseUrl: env.ECOWITT_BASE_URL,
    requestTimeout: env.REQUEST_TIMEOUT,
  },
  server: {
    name: "ecowitt-weather-server",
    version: packageJson.version,
  },
};
