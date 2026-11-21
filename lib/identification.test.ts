import { describe, expect, it } from "vitest";
import { identificationSchema, parseImageDataUrl } from "./identification";

describe("Gemini identification validation", () => {
  it("accepts supported image data URLs", () => {
    expect(parseImageDataUrl("data:image/jpeg;base64,SGVsbG8=").mimeType).toBe("image/jpeg");
  });
  it("rejects non-image uploads", () => {
    expect(() => parseImageDataUrl("data:text/plain;base64,SGVsbG8=")).toThrow(/image/i);
  });
  it("rejects low-confidence identification responses", () => {
    expect(identificationSchema.safeParse({ name: "", brand: "", model: "", category: "", color: "", size: "", confidence: 0.1 }).success).toBe(false);
  });
});
