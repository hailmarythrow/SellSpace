export type GeminiFailureCategory = "invalid_credentials" | "model_unavailable" | "quota_exhausted" | "temporary_provider_failure" | "upstream_rejected";

type GeminiErrorPayload = { error?: { code?: number | string; message?: string; status?: string } };

export function sanitizeGeminiMessage(value: unknown) {
  return String(value ?? "Gemini request failed.")
    .replace(/x-goog-api-key\s*[:=]\s*[^\s,]+/gi, "x-goog-api-key=[redacted]")
    .replace(/(?:key|api[_-]?key|token)=[^\s&]+/gi, "$1=[redacted]")
    .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, "[image redacted]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}

export function classifyGeminiFailure(httpStatus: number, providerStatus?: string): GeminiFailureCategory {
  if (httpStatus === 401 || httpStatus === 403 || providerStatus === "UNAUTHENTICATED" || providerStatus === "PERMISSION_DENIED") return "invalid_credentials";
  if (httpStatus === 404 || providerStatus === "NOT_FOUND") return "model_unavailable";
  if (httpStatus === 429 || providerStatus === "RESOURCE_EXHAUSTED") return "quota_exhausted";
  if (httpStatus >= 500 || providerStatus === "UNAVAILABLE" || providerStatus === "DEADLINE_EXCEEDED") return "temporary_provider_failure";
  return "upstream_rejected";
}

export function parseGeminiFailure(httpStatus: number, rawBody: string) {
  let payload: GeminiErrorPayload = {};
  try { payload = JSON.parse(rawBody) as GeminiErrorPayload; } catch { /* keep a sanitized text fallback */ }
  const providerCode = payload.error?.status ?? (typeof payload.error?.code === "string" ? payload.error.code : undefined);
  const category = classifyGeminiFailure(httpStatus, providerCode);
  const providerMessage = sanitizeGeminiMessage(payload.error?.message ?? rawBody);
  const userMessage = {
    invalid_credentials: "Gemini rejected the API key or its permissions. Check GEMINI_API_KEY and the Generative Language API access.",
    model_unavailable: "The configured Gemini model is unavailable to this API key. Check GEMINI_MODEL and the model access.",
    quota_exhausted: "Gemini quota or rate limits were exceeded. Check the Gemini project billing and usage limits.",
    temporary_provider_failure: "Gemini is temporarily unavailable. Please retry in a moment.",
    upstream_rejected: "Gemini rejected the identification request. Check the provider details in the server logs."
  }[category];
  return { category, providerCode: providerCode ?? "UNKNOWN", providerMessage, userMessage };
}
