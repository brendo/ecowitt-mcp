import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = "test";

  // Mock console methods to reduce noise during tests
  global.originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
});

afterAll(() => {
  // Restore console methods
  if (global.originalConsole) {
    console.log = global.originalConsole.log;
    console.warn = global.originalConsole.warn;
    console.error = global.originalConsole.error;
  }
});

beforeEach(() => {
  // Reset any mocks or test state before each test
});

afterEach(() => {
  // Clean up after each test
});

// Import fixture helpers
import {
  cloneFixture,
  loadCategoryFixtures,
  loadFixture,
  loadFixtures,
  mergeFixture,
} from "./helpers/fixtures.js";
import {
  createEcowittErrorResponse,
  createEcowittSuccessResponse,
  createHttpErrorResponse,
  createMockMalformedResponse,
  createMockNetworkError,
  createMockResponse,
  createMockTimeoutError,
  EcowittErrors,
  HttpErrors,
} from "./helpers/mock-responses.js";

// Global test utilities
global.testConfig = {
  ecowitt: {
    applicationKey: "test-app-key",
    apiKey: "test-api-key",
    baseUrl: "https://api.ecowitt.net/api/v3",
  },
  timeout: 5000,
};

// Make fixture helpers available globally for convenience
global.fixtures = {
  load: loadFixture,
  loadMultiple: loadFixtures,
  loadCategory: loadCategoryFixtures,
  clone: cloneFixture,
  merge: mergeFixture,
};

// Make mock response helpers available globally
global.mocks = {
  response: createMockResponse,
  networkError: createMockNetworkError,
  timeoutError: createMockTimeoutError,
  malformedResponse: createMockMalformedResponse,
  ecowittSuccess: createEcowittSuccessResponse,
  ecowittError: createEcowittErrorResponse,
  httpError: createHttpErrorResponse,
  EcowittErrors,
  HttpErrors,
};
