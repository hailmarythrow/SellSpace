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
    expect(result.sourceNote).toContain("Live pricing unavailable");
  });

  it("only returns synthetic demo comparables when explicitly requested and relevant", async () => {
    const demo = await getResearch("Seiko SNK809 watch", { demo: true });
    expect(demo.source).toBe("demo");
    expect(demo.active.every((listing) => listing.demo && /seiko/i.test(listing.title))).toBe(true);

    const unrelated = await getResearch("OtterBox iPhone case", { demo: true });
    expect(unrelated.active).toEqual([]);
    expect(unrelated.sold).toEqual([]);
  });
});
