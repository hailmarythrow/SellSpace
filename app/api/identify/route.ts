import { NextResponse } from "next/server";
import { identificationSchema, parseImageDataUrl } from "@/lib/identification";
import { parseGeminiFailure } from "@/lib/gemini-errors";
import { resolveGeminiModel } from "@/lib/gemini-models";

const prompt = `Identify the physical product in this photograph for a resale research app. Return ONLY valid JSON with these keys: name, brand, model, category, color, size, confidence, notes. Use empty strings for details that are not visible. Do not guess exact specifications, measurements, or a model number that is not supported by visible evidence. confidence must be a number from 0 to 1.`;

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Gemini identification is not configured on this deployment." }, { status: 503 });
  try {
    const body = await request.json(); const image = parseImageDataUrl(body?.imageDataUrl); const resolution = await resolveGeminiModel();
    if (!resolution.available || !resolution.selectedModel) return NextResponse.json({ error: "No authorized Gemini image-capable model passed the availability and generation checks.", category: resolution.failureCategory ?? "model_unavailable", attempts: resolution.attempts.map((attempt) => ({ model: attempt.model, listed: attempt.listed, supportsGenerateContent: attempt.supportsGenerateContent, probeSucceeded: attempt.probeSucceeded, category: attempt.category })) }, { status: 503 });
    const model = resolution.selectedModel;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: image.mimeType, data: image.data } }, { text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
    if (!response.ok) {
      const failure = parseGeminiFailure(response.status, await response.text());
      console.error("[gemini-identify-upstream-failure]", JSON.stringify({ httpStatus: response.status, providerCode: failure.providerCode, category: failure.category, message: failure.providerMessage, model }));
      const clientStatus = failure.category === "quota_exhausted" ? 429 : failure.category === "temporary_provider_failure" ? 503 : 502;
      return NextResponse.json({ error: failure.userMessage, category: failure.category }, { status: clientStatus });
    }
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return NextResponse.json({ error: "Gemini returned no identification. Try a clearer photo." }, { status: 422 });
    const parsed = identificationSchema.safeParse(JSON.parse(text));
    if (!parsed.success || parsed.data.confidence < 0.25 || !parsed.data.name.trim()) return NextResponse.json({ error: "Gemini could not identify this item with enough confidence. Try a clearer photo or correct it manually." }, { status: 422 });
    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Identification failed.";
    const category = (error as { category?: string }).category;
    if (category) {
      return NextResponse.json({ error: "Gemini model availability could not be verified. Check the deployment configuration and server logs.", category }, { status: 503 });
    }
    const isInputError = message.includes("Upload") || message.includes("image") || message.includes("large");
    return NextResponse.json({ error: isInputError ? message : "Gemini identification failed. Please try again.", ...(isInputError ? {} : { category: "temporary_provider_failure" }) }, { status: isInputError ? 400 : 503 });
  }
}
