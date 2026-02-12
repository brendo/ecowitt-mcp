import { z } from "zod";

/**
 * Shared schema and utilities for Ecowitt unit options.
 * Provides Zod schemas and utilities for handling unit conversion parameters
 * in Ecowitt API requests.
 *
 * @fileoverview This module exports:
 * - UnitOptionsSchema: Object with individual Zod schemas for spreading into tool schemas
 * - UnitOptionsZod: Complete Zod object schema for standalone validation
 * - unitOptionKeys: Array of valid unit option key names
 * - extractUnitOptions(): Function to filter unit options from objects
 */

export const UnitOptionsSchema = {
  temp_unitid: z
    .number()
    .int()
    .min(1)
    .max(2)
    .optional()
    .describe("Temperature unit (optional): 1 = °C, 2 = °F (default if omitted)."),
  pressure_unitid: z
    .number()
    .int()
    .min(3)
    .max(5)
    .optional()
    .describe("Pressure unit (optional): 3 = hPa, 4 = inHg (default), 5 = mmHg."),
  wind_speed_unitid: z
    .number()
    .int()
    .min(6)
    .max(11)
    .optional()
    .describe(
      "Wind speed unit (optional): 6 = m/s, 7 = km/h, 8 = knots, 9 = mph (default), 10 = BFT, 11 = fpm."
    ),
  rainfall_unitid: z
    .number()
    .int()
    .min(12)
    .max(13)
    .optional()
    .describe("Rain unit (optional): 12 = mm, 13 = in (default)."),
  solar_irradiance_unitid: z
    .number()
    .int()
    .min(14)
    .max(16)
    .optional()
    .describe("Solar irradiance unit (optional): 14 = lux, 15 = fc, 16 = W/m² (default)."),
  capacity_unitid: z
    .number()
    .int()
    .min(24)
    .max(26)
    .optional()
    .describe("Capacity unit (optional): 24 = L (default), 25 = m³, 26 = gal."),
};

/**
 * Complete Zod schema for validating unit options objects.
 * Use this for standalone validation of unit option parameters.
 * @type {z.ZodObject}
 */
export const UnitOptionsZod = z.object(UnitOptionsSchema);

/**
 * Array of all valid unit option key names for filtering and validation.
 * @type {string[]}
 */
export const unitOptionKeys = Object.keys(UnitOptionsSchema);

/**
 * Extract only unit option keys from an object.
 * Filters the input object to return a new object containing only properties
 * that match valid Ecowitt unit option parameter names.
 *
 * @param {Object} obj - The object to extract unit options from (e.g., tool arguments)
 * @returns {Object} New object containing only unit option keys and their values
 *
 * @example
 * const args = { mac: "AA:BB:CC", temp_unitid: 1, callback: "outdoor", pressure_unitid: 3 };
 * const units = extractUnitOptions(args);
 * // Result: { temp_unitid: 1, pressure_unitid: 3 }
 */
export function extractUnitOptions(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => unitOptionKeys.includes(key)));
}
