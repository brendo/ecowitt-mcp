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
