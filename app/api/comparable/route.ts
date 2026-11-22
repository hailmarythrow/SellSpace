import { NextResponse } from "next/server";
import { parseImageDataUrl } from "@/lib/identification";
import { resolveGeminiModel } from "@/lib/gemini-models";

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Gemini is not configured for screenshot extraction." }, { status: 503 });
  try {
    const body = await request.json();
    const image = parseImageDataUrl(body?.imageDataUrl);
    const resolution = await resolveGeminiModel();
    if (!resolution.selectedModel) return NextResponse.json({ error: "No authorized Gemini model is available." }, { status: 503 });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolution.selectedModel)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: image.mimeType, data: image.data } }, { text: "Read this listing screenshot. Return only JSON with title, price, currency, sourceUrl, marketplace, priceType, date. Use empty strings when text is not visible. Never guess a price, URL, sold status, or product details. priceType must be active_asking, displayed_sold, or verified_transaction." }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
    if (!response.ok) return NextResponse.json({ error: "Gemini could not read this comparable screenshot." }, { status: 502 });
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return NextResponse.json({ error: "No comparable details were found in the screenshot." }, { status: 422 });
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "The comparable screenshot could not be processed." }, { status: 422 });
  }
}
