import { describe, expect, it } from "vitest";
import { listingFromScan } from "./listing";
import type { Scan } from "./types";

const scan: Scan = {
  id: "scan-1", ownerId: "local-owner", createdAt: "2026-01-01T00:00:00.000Z", photoUrl: "data:image/png;base64,photo",
  item: { id: "item-1", name: "Vintage jacket", brand: "Acme", model: "A-1", category: "Outerwear", color: "Brown", size: "M", confidence: 0.9 },
  research: { active: [{ id: "a", title: "Active", price: 120, shipping: 0, condition: "Good", imageUrl: "https://example.com/a.jpg", url: "https://example.com/a", marketplace: "eBay", kind: "active" }], sold: [], soldAvailable: false, source: "unavailable", sourceNote: "Live pricing unavailable" },
  purchaseCost: 25
};

describe("listing draft conversion", () => {
  it("copies scan identity, photo, purchase cost, and research-based price", () => {
    const listing = listingFromScan(scan);
    expect(listing.sourceScanId).toBe(scan.id);
    expect(listing.photoUrls).toEqual([scan.photoUrl]);
    expect(listing.purchasePrice).toBe(25);
    expect(listing.targetPrice).toBe(120);
    expect(listing.status).toBe("Draft");
  });
  it("reuses an existing listing id when converting twice", () => {
    const first = listingFromScan(scan);
    const second = listingFromScan(scan, { ...first, title: "Edited title" });
    expect(second.id).toBe(first.id);
    expect(second.title).toBe("Edited title");
  });
});
