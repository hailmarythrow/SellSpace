import { describe, expect, it } from "vitest";
import { calculateActualProfit, calculateProfit, median } from "./pricing";

describe("pricing", () => {
  it("calculates a median for odd and even samples", () => {
    expect(median([100, 200, 150])).toBe(150);
    expect(median([100, 200, 150, 50])).toBe(125);
  });
  it("calculates net profit and ROI from entered costs", () => {
    expect(calculateProfit(200, { purchase: 80, fees: 20, shipping: 10, other: 5 })).toEqual({ totalCosts: 115, profit: 85, roi: 106.25 });
  });
  it("does not calculate ROI when there is no purchase cost", () => {
    expect(calculateProfit(100, { purchase: 0, fees: 10, shipping: 0, other: 0 }).roi).toBeNull();
  });
  it("calculates actual sold profit from recorded sale costs", () => {
    expect(calculateActualProfit(250, 80, 25, 15)).toMatchObject({ totalCosts: 120, profit: 130, roi: 162.5 });
  });
});
