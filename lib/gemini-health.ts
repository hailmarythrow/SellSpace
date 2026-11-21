import { parseGeminiFailure } from "./gemini-errors";

export async function checkGeminiModel() {
  const key = process.env.GEMINI_API_KEY; const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  if (!key) return { configured: false, available: false, model, category: "not_configured" as const };
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (response.ok) return { configured: true, available: true, model };
    const failure = parseGeminiFailure(response.status, await response.text());
    console.error("[gemini-model-health-failure]", JSON.stringify({ httpStatus: response.status, providerCode: failure.providerCode, category: failure.category, message: failure.providerMessage, model }));
    return { configured: true, available: false, model, category: failure.category };
  } catch {
    return { configured: true, available: false, model, category: "temporary_provider_failure" as const };
  }
}
