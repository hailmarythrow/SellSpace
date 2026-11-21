import { z } from "zod";

export const identificationSchema = z.object({
  name: z.string().min(1).max(160), brand: z.string().max(100), model: z.string().max(100),
  category: z.string().min(1).max(100), color: z.string().max(100), size: z.string().max(100),
  confidence: z.number().min(0).max(1), notes: z.string().max(500).optional(),
  missingAttributes: z.array(z.enum(["compatible_phone_model", "size", "shoe_model", "brand", "model_number", "functionality", "edition_or_year"])).max(6).default([])
});
export type Identification = z.infer<typeof identificationSchema>;

export function parseImageDataUrl(value: unknown) {
  if (typeof value !== "string") throw new Error("Upload an image to identify.");
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|heic));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error("Use a JPEG, PNG, WEBP, or HEIC image.");
  if (Buffer.from(match[2], "base64").byteLength > 8 * 1024 * 1024) throw new Error("Image is too large. Please choose one under 8 MB.");
  return { mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase(), data: match[2] };
}
