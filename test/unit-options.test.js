import { describe, expect, it } from "vitest";
import { UnitOptionsZod } from "../src/utils/unit_options.js";

describe("UnitOptionsZod", () => {
  it("maps all temperature units correctly", () => {
    expect(UnitOptionsZod.parse({ temp_unitid: "C" })).toEqual({ temp_unitid: 1 });
    expect(UnitOptionsZod.parse({ temp_unitid: "F" })).toEqual({ temp_unitid: 2 });
  });

  it("maps all pressure units correctly", () => {
    expect(UnitOptionsZod.parse({ pressure_unitid: "hPa" })).toEqual({ pressure_unitid: 3 });
    expect(UnitOptionsZod.parse({ pressure_unitid: "inHg" })).toEqual({ pressure_unitid: 4 });
    expect(UnitOptionsZod.parse({ pressure_unitid: "mmHg" })).toEqual({ pressure_unitid: 5 });
  });

  it("maps all wind speed units correctly", () => {
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "mps" })).toEqual({ wind_speed_unitid: 6 });
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "kmh" })).toEqual({ wind_speed_unitid: 7 });
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "knots" })).toEqual({ wind_speed_unitid: 8 });
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "mph" })).toEqual({ wind_speed_unitid: 9 });
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "bft" })).toEqual({ wind_speed_unitid: 10 });
    expect(UnitOptionsZod.parse({ wind_speed_unitid: "fpm" })).toEqual({ wind_speed_unitid: 11 });
  });

  it("maps all rainfall units correctly", () => {
    expect(UnitOptionsZod.parse({ rainfall_unitid: "mm" })).toEqual({ rainfall_unitid: 12 });
    expect(UnitOptionsZod.parse({ rainfall_unitid: "in" })).toEqual({ rainfall_unitid: 13 });
  });

  it("maps all solar irradiance units correctly", () => {
    expect(UnitOptionsZod.parse({ solar_irradiance_unitid: "lux" })).toEqual({ solar_irradiance_unitid: 14 });
    expect(UnitOptionsZod.parse({ solar_irradiance_unitid: "fc" })).toEqual({ solar_irradiance_unitid: 15 });
    expect(UnitOptionsZod.parse({ solar_irradiance_unitid: "Wm2" })).toEqual({ solar_irradiance_unitid: 16 });
  });

  it("maps all capacity units correctly", () => {
    expect(UnitOptionsZod.parse({ capacity_unitid: "L" })).toEqual({ capacity_unitid: 24 });
    expect(UnitOptionsZod.parse({ capacity_unitid: "m3" })).toEqual({ capacity_unitid: 25 });
    expect(UnitOptionsZod.parse({ capacity_unitid: "gal" })).toEqual({ capacity_unitid: 26 });
  });

  it("allows all unit options to be omitted", () => {
    const result = UnitOptionsZod.parse({});
    expect(result).toEqual({});
  });

  it("rejects invalid enum values for each unit type", () => {
    expect(() => UnitOptionsZod.parse({ temp_unitid: "K" })).toThrow();
    expect(() => UnitOptionsZod.parse({ pressure_unitid: "bar" })).toThrow();
    expect(() => UnitOptionsZod.parse({ wind_speed_unitid: "ms" })).toThrow();
    expect(() => UnitOptionsZod.parse({ rainfall_unitid: "cm" })).toThrow();
    expect(() => UnitOptionsZod.parse({ solar_irradiance_unitid: "W/m2" })).toThrow();
    expect(() => UnitOptionsZod.parse({ capacity_unitid: "litres" })).toThrow();
  });
});
