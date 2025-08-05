import { z } from "zod";

/**
 * Shared schema and utilities for Ecowitt unit options.
 *
 * - Use UnitOptionsSchema to spread into Zod schemas for tool input validation.
 * - Use UnitOptionsZod for standalone validation.
 * - Use extractUnitOptions(obj) to pick only unit option keys from any object.
 */

export const UnitOptionsSchema = {
  temp_unitid: z.number().int().min(1).max(2).optional().describe("Temperature unit: 1 for °C, 2 for °F (default)"),
  pressure_unitid: z
    .number()
    .int()
    .min(3)
    .max(5)
    .optional()
    .describe("Pressure unit: 3 for hPa, 4 for inHg (default), 5 for mmHg"),
  wind_speed_unitid: z
    .number()
    .int()
    .min(6)
    .max(11)
    .optional()
    .describe("Wind speed unit: 6 for m/s, 7 for km/h, 8 for knots, 9 for mph (default), 10 for BFT, 11 for fpm"),
  rainfall_unitid: z.number().int().min(12).max(13).optional().describe("Rain unit: 12 for mm, 13 for in (default)"),
  solar_irradiance_unitid: z
    .number()
    .int()
    .min(14)
    .max(16)
    .optional()
    .describe("Solar Irradiance unit: 14 for lux, 15 for fc, 16 for W/m² (default)"),
  capacity_unitid: z
    .number()
    .int()
    .min(24)
    .max(26)
    .optional()
    .describe("Capacity unit: 24 for L (default), 25 for m³, 26 for gal"),
};

export const UnitOptionsZod = z.object(UnitOptionsSchema);

export const unitOptionKeys = Object.keys(UnitOptionsSchema);

/**
 * Extract only unit option keys from an object.
 * @param {Object} obj - The object to extract from.
 * @returns {Object} New object with only unit option keys.
 */
export function extractUnitOptions(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => unitOptionKeys.includes(key)));
}
