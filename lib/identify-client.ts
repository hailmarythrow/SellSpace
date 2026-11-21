import type { Identification } from "./identification";

export async function identifyImage(imageDataUrl: string): Promise<Identification> {
  const response = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl }) });
  const payload = await response.json() as { error?: string } & Partial<Identification>;
  if (!response.ok) throw new Error(payload.error ?? "Gemini identification failed.");
  return payload as Identification;
}
