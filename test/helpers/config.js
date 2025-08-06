// Helper to load the config module fresh for each test
export const loadConfig = async () => {
  const { getConfig, clearConfigCache } = await import("../../src/config/index.js");
  // Clear cache to ensure fresh config for each test
  clearConfigCache();
  return getConfig();
};
