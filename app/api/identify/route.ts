import { NextResponse } from "next/server";
import { identificationSchema, parseImageDataUrl } from "@/lib/identification";

const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const prompt = `Identify the physical product in this photograph for a resale research app. Return ONLY valid JSON with these keys: name, brand, model, category, color, size, confidence, notes. Use empty strings for details that are not visible. Do not guess exact specifications, measurements, or a model number that is not supported by visible evidence. confidence must be a number from 0 to 1.`;

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Gemini identification is not configured on this deployment." }, { status: 503 });
  try {
    const body = await request.json(); const image = parseImageDataUrl(body?.imageDataUrl);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: image.mimeType, data: image.data } }, { text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
    if (!response.ok) return NextResponse.json({ error: "Gemini could not identify this image right now. Try a clearer photo." }, { status: 502 });
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return NextResponse.json({ error: "Gemini returned no identification. Try a clearer photo." }, { status: 422 });
    const parsed = identificationSchema.safeParse(JSON.parse(text));
    if (!parsed.success || parsed.data.confidence < 0.25 || !parsed.data.name.trim()) return NextResponse.json({ error: "Gemini could not identify this item with enough confidence. Try a clearer photo or correct it manually." }, { status: 422 });
    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Identification failed.";
    return NextResponse.json({ error: message.includes("Upload") || message.includes("image") || message.includes("large") ? message : "Gemini identification failed. Please try again." }, { status: 400 });
  }
}
