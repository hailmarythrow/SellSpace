import { resolveGeminiModel } from "./gemini-models";

export async function checkGeminiModel() {
  const resolution = await resolveGeminiModel();
  return { configured: resolution.configured, available: resolution.available, model: resolution.selectedModel ?? resolution.preferredModel, preferredModel: resolution.preferredModel, fallbackUsed: resolution.fallbackUsed, attempts: resolution.attempts, category: resolution.failureCategory };
}
