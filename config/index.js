import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidUrl, validateRequired } from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json for version info
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Validate required environment variables
const applicationKey = process.env.ECOWITT_APPLICATION_KEY;
const apiKey = process.env.ECOWITT_API_KEY;

validateRequired("ECOWITT_APPLICATION_KEY", applicationKey, "environment variable");
validateRequired("ECOWITT_API_KEY", apiKey, "environment variable");

// Validate optional base URL if provided
const baseUrl = process.env.ECOWITT_BASE_URL || "https://api.ecowitt.net/api/v3";
if (!isValidUrl(baseUrl)) {
  throw new Error("Invalid ECOWITT_BASE_URL format");
}

// Parse timeout value
const requestTimeout = process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT, 10) : 10000;

if (Number.isNaN(requestTimeout) || requestTimeout <= 0) {
  throw new Error("REQUEST_TIMEOUT must be a positive number");
}

export const config = {
  ecowitt: {
    applicationKey,
    apiKey,
    baseUrl,
  },
  server: {
    name: "ecowitt-weather-server",
    version: packageJson.version,
    requestTimeout,
  },
  debug: {
    enabled: process.env.DEBUG?.includes("ecowitt"),
    logLevel: process.env.LOG_LEVEL || "info",
  },
};
