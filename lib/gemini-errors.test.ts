import { describe, expect, it } from "vitest";
import { parseGeminiFailure, sanitizeGeminiMessage } from "./gemini-errors";

describe("Gemini upstream error handling", () => {
  it("classifies invalid credentials and returns a configuration message", () => {
    const result = parseGeminiFailure(401, JSON.stringify({ error: { code: 401, status: "UNAUTHENTICATED", message: "API key rejected" } }));
    expect(result.category).toBe("invalid_credentials");
    expect(result.userMessage).toMatch(/API key|permissions/i);
  });
  it("classifies unavailable models", () => {
    expect(parseGeminiFailure(404, JSON.stringify({ error: { status: "NOT_FOUND", message: "models/not-real not found" } })).category).toBe("model_unavailable");
  });
  it("classifies quota exhaustion", () => {
    expect(parseGeminiFailure(429, JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "quota exceeded" } })).category).toBe("quota_exhausted");
  });
  it("classifies provider failures and redacts sensitive text", () => {
    const result = parseGeminiFailure(503, "x-goog-api-key=secret data:image/jpeg;base64,SGVsbG8=");
    expect(result.category).toBe("temporary_provider_failure");
    expect(sanitizeGeminiMessage("x-goog-api-key=secret")).not.toContain("secret");
    expect(result.providerMessage).not.toContain("SGVsbG8=");
  });
});
