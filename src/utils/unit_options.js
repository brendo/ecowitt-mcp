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

const TempUnitSchema = z
  .enum(["C", "F"])
  .describe("Temperature unit (optional): 'C' = °C, 'F' = °F (default if omitted).");

const PressureUnitSchema = z
  .enum(["hPa", "inHg", "mmHg"])
  .describe("Pressure unit (optional): 'hPa', 'inHg' (default), or 'mmHg'.");

const WindSpeedUnitSchema = z
  .enum(["mps", "kmh", "knots", "mph", "bft", "fpm"])
  .describe("Wind speed unit (optional): 'mps', 'kmh', 'knots', 'mph' (default), 'bft', or 'fpm'.");

const RainfallUnitSchema = z.enum(["mm", "in"]).describe("Rain unit (optional): 'mm' or 'in' (default).");

const SolarIrradianceUnitSchema = z
  .enum(["lux", "fc", "Wm2"])
  .describe("Solar irradiance unit (optional): 'lux', 'fc', or 'Wm2' (default).");

const CapacityUnitSchema = z
  .enum(["L", "m3", "gal"])
  .describe("Capacity unit (optional): 'L' (default), 'm3', or 'gal'.");

export const UnitOptionsSchema = {
  temp_unitid: TempUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    return u === "C" ? 1 : 2;
  }),
  pressure_unitid: PressureUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    switch (u) {
      case "hPa":
        return 3;
      case "inHg":
        return 4;
      case "mmHg":
        return 5;
      default:
        return undefined;
    }
  }),
  wind_speed_unitid: WindSpeedUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    switch (u) {
      case "mps":
        return 6;
      case "kmh":
        return 7;
      case "knots":
        return 8;
      case "mph":
        return 9;
      case "bft":
        return 10;
      case "fpm":
        return 11;
      default:
        return undefined;
    }
  }),
  rainfall_unitid: RainfallUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    return u === "mm" ? 12 : 13;
  }),
  solar_irradiance_unitid: SolarIrradianceUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    switch (u) {
      case "lux":
        return 14;
      case "fc":
        return 15;
      case "Wm2":
        return 16;
      default:
        return undefined;
    }
  }),
  capacity_unitid: CapacityUnitSchema.optional().transform((u) => {
    if (u === undefined) return undefined;
    switch (u) {
      case "L":
        return 24;
      case "m3":
        return 25;
      case "gal":
        return 26;
      default:
        return undefined;
    }
  }),
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
