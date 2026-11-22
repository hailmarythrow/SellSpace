import { describe, expect, it } from "vitest";
import { parseGroundedEvidence, researchQuery } from "./web-research";

describe("grounded web research normalization", () => {
  const chunks = [{ web: { uri: "https://example.com/item", title: "OtterBox Defender listing" } }];

  it("keeps only prices backed by a grounded source and preserves asking vs sold", () => {
    const result = parseGroundedEvidence({ comparables: [
      { title: "OtterBox Defender case", price: 34.99, url: "https://example.com/item", marketplace: "eBay", priceType: "active_asking", evidenceQuote: "Price $34.99" },
      { title: "Invented unrelated case", price: 999, url: "https://not-grounded.example/item", marketplace: "eBay", priceType: "verified_transaction" },
    ] }, chunks, "OtterBox Defender phone case");
    expect(result.active).toHaveLength(1);
    expect(result.active[0].classification).toBe("active_asking");
    expect(result.sold).toHaveLength(0);
  });

  it("does not accept an unclassified or unsupported price", () => {
    const result = parseGroundedEvidence({ comparables: [{ title: "Case", price: 40, url: "https://example.com/item" }] }, chunks, "case");
    expect(result.active).toHaveLength(0);
    expect(result.sold).toHaveLength(0);
    expect(result.source).toBe("unavailable");
  });

  it("builds targeted queries without inventing missing attributes", () => {
    expect(researchQuery({ brand: "OtterBox", model: "", name: "phone case", category: "Cases", color: "turquoise", size: "", confidence: 0.9, id: "1" })).toBe("OtterBox phone case Cases turquoise");
  });
});
