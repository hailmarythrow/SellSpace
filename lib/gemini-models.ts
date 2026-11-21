import { parseGeminiFailure } from "./gemini-errors";

type ListedModel = { name?: string; supportedGenerationMethods?: string[] };
type Attempt = { model: string; listed: boolean; supportsGenerateContent: boolean; probeSucceeded: boolean; category?: string; providerCode?: string };
type Resolution = { configured: boolean; available: boolean; preferredModel: string; selectedModel?: string; fallbackUsed: boolean; attempts: Attempt[]; failureCategory?: string };

const defaultPreferred = "gemini-3.5-flash-lite";
const defaultFallbacks = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const probeImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
let cached: { expiresAt: number; keyFingerprint: string; resolution: Resolution } | undefined;

const modelId = (name: string) => name.replace(/^models\//, "");
const keyFingerprint = (key: string) => `${key.length}:${key.slice(0, 3)}:${key.slice(-3)}`;

async function listModels(key: string) {
  const models: ListedModel[] = []; let pageToken = "";
  for (let page = 0; page < 5; page += 1) {
    const query = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=100${query}`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok) { const failure = parseGeminiFailure(response.status, await response.text()); throw Object.assign(new Error(failure.providerMessage), { category: failure.category, providerCode: failure.providerCode }); }
    const payload = await response.json() as { models?: ListedModel[]; nextPageToken?: string }; models.push(...(payload.models ?? [])); pageToken = payload.nextPageToken ?? ""; if (!pageToken) break;
  }
  return models;
}

async function probeModel(key: string, model: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(12000), cache: "no-store", body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "image/png", data: probeImage } }, { text: "Reply with exactly OK." }] }], generationConfig: { maxOutputTokens: 4, temperature: 0 } }) });
  if (response.ok) return { success: true as const };
  const failure = parseGeminiFailure(response.status, await response.text()); return { success: false as const, category: failure.category, providerCode: failure.providerCode };
}

export async function resolveGeminiModel(): Promise<Resolution> {
  const key = process.env.GEMINI_API_KEY; const preferredModel = process.env.GEMINI_MODEL || defaultPreferred;
  if (!key) return { configured: false, available: false, preferredModel, fallbackUsed: false, attempts: [] };
  const fingerprint = keyFingerprint(key); if (cached && cached.expiresAt > Date.now() && cached.keyFingerprint === fingerprint && cached.resolution.preferredModel === preferredModel) return cached.resolution;
  const attempts: Attempt[] = []; let listed: ListedModel[];
  try { listed = await listModels(key); } catch (error) { const failure = error as { category?: string; providerCode?: string }; const resolution = { configured: true, available: false, preferredModel, fallbackUsed: false, attempts, failureCategory: failure.category ?? "temporary_provider_failure" }; console.error("[gemini-model-resolution-failure]", JSON.stringify({ category: resolution.failureCategory, providerCode: failure.providerCode ?? "UNKNOWN", preferredModel })); return resolution; }
  const available = new Map(listed.map((model) => [modelId(model.name ?? ""), model])); const candidates = Array.from(new Set([preferredModel, ...(process.env.GEMINI_FALLBACK_MODELS?.split(",").map((item) => item.trim()).filter(Boolean) ?? defaultFallbacks)]));
  for (const candidate of candidates) {
    const model = available.get(candidate); const supports = Boolean(model?.supportedGenerationMethods?.includes("generateContent")); const attempt: Attempt = { model: candidate, listed: Boolean(model), supportsGenerateContent: supports, probeSucceeded: false };
    if (!model || !supports) { attempt.category = "model_unavailable"; attempts.push(attempt); continue; }
    const probe = await probeModel(key, candidate); attempt.probeSucceeded = probe.success; if (!probe.success) { attempt.category = probe.category; attempt.providerCode = probe.providerCode; attempts.push(attempt); continue; }
    attempts.push(attempt); const resolution = { configured: true, available: true, preferredModel, selectedModel: candidate, fallbackUsed: candidate !== preferredModel, attempts }; cached = { expiresAt: Date.now() + 5 * 60 * 1000, keyFingerprint: fingerprint, resolution }; return resolution;
  }
  const resolution = { configured: true, available: false, preferredModel, fallbackUsed: false, attempts, failureCategory: attempts.at(-1)?.category ?? "model_unavailable" }; console.error("[gemini-model-resolution-failure]", JSON.stringify({ category: resolution.failureCategory, preferredModel, attemptedModels: attempts.map((attempt) => ({ model: attempt.model, listed: attempt.listed, supportsGenerateContent: attempt.supportsGenerateContent, probeSucceeded: attempt.probeSucceeded, category: attempt.category, providerCode: attempt.providerCode })) })); return resolution;
}
