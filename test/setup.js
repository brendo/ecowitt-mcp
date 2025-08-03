import { afterAll, beforeAll } from "vitest";

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
