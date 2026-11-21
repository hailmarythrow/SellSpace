import { afterEach, describe, expect, it, vi } from "vitest";
import { getResearch } from "./providers";

afterEach(() => vi.unstubAllEnvs());

describe("marketplace research source rules", () => {
  it("returns no fictional prices when live credentials are absent", async () => {
    vi.stubEnv("EBAY_CLIENT_ID", "");
    vi.stubEnv("EBAY_CLIENT_SECRET", "");
    vi.stubEnv("SOLDGRAPH_API_KEY", "");
    const result = await getResearch("OtterBox iPhone case");
    expect(result.source).toBe("unavailable");
    expect(result.active).toEqual([]);
    expect(result.sold).toEqual([]);
    expect(result.sourceNote).toBe("Live marketplace pricing is currently unavailable.");
  });

  it("does not return fictional comparables for an unrelated product", async () => {
    const unrelated = await getResearch("OtterBox iPhone case");
    expect(unrelated.active).toEqual([]);
    expect(unrelated.sold).toEqual([]);
  });
});
