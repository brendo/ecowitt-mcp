// Helper to load the config module fresh for each test
export const loadConfig = async () => {
  const { config } = await import("../../src/config/index.js");
  return config;
};
