import type { Costs, Listing } from "./types";

export const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const summarizePrices = (listings: Listing[]) => ({
  median: median(listings.map((listing) => listing.price)), count: listings.length
});

export const calculateProfit = (salePrice: number, costs: Costs) => {
  const totalCosts = costs.purchase + costs.fees + costs.shipping + costs.other;
  const profit = salePrice - totalCosts;
  return { totalCosts, profit, roi: costs.purchase > 0 ? (profit / costs.purchase) * 100 : null };
};

export const calculateActualProfit = (salePrice: number, purchasePrice = 0, fees = 0, costs = 0) =>
  calculateProfit(salePrice, { purchase: purchasePrice, fees, shipping: costs, other: 0 });
