import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a fixture file from the fixtures directory
 * @param {string} category - Category subdirectory (e.g., 'ecowitt')
 * @param {string} name - Fixture file name without extension
 * @returns {Object} Parsed JSON fixture data
 */
export function loadFixture(category, name) {
  const fixturePath = join(__dirname, "..", "fixtures", category, `${name}.json`);
  const content = readFileSync(fixturePath, "utf8");
  return JSON.parse(content);
}

/**
 * Load multiple fixtures at once
 * @param {Object} fixtures - Object mapping names to [category, filename] pairs
 * @returns {Object} Object with fixture data keyed by name
 *
 * @example
 * const fixtures = loadFixtures({
 *   deviceListSuccess: ['ecowitt', 'device-list-success'],
 *   deviceListEmpty: ['ecowitt', 'device-list-empty'],
 * });
 */
export function loadFixtures(fixtures) {
  const result = {};
  for (const [name, [category, filename]] of Object.entries(fixtures)) {
    result[name] = loadFixture(category, filename);
  }
  return result;
}

/**
 * Load all fixtures from a category
 * @param {string} category - Category subdirectory
 * @returns {Object} Object with all fixtures in the category
 */
export function loadCategoryFixtures(category) {
  // This is a simple implementation - could be enhanced to auto-discover files
  switch (category) {
    case "ecowitt":
      return loadFixtures({
        deviceListSuccess: ["ecowitt", "device-list-success"],
        deviceListEmpty: ["ecowitt", "device-list-empty"],
        deviceListError: ["ecowitt", "device-list-error"],
        deviceInfoSuccess: ["ecowitt", "device-info-success"],
      });
    default:
      throw new Error(`Unknown fixture category: ${category}`);
  }
}

/**
 * Create a deep clone of fixture data to avoid mutations between tests
 * @param {Object} fixture - Fixture data to clone
 * @returns {Object} Deep cloned fixture data
 */
export function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture));
}

/**
 * Merge fixture data with overrides
 * @param {Object} fixture - Base fixture data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Merged fixture data
 */
export function mergeFixture(fixture, overrides) {
  const cloned = cloneFixture(fixture);
  return { ...cloned, ...overrides };
}
