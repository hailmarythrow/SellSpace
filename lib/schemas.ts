import { z } from "zod";

export const listingSchema = z.object({
  id: z.string(), title: z.string().min(1), price: z.number().nonnegative(), shipping: z.number().nonnegative(),
  condition: z.enum(["New", "Like new", "Good", "Fair"]), imageUrl: z.string().url().optional(), url: z.string().url(),
  marketplace: z.enum(["eBay", "Mercari", "Poshmark", "Depop", "Manual"]), kind: z.enum(["active", "sold"]),
  verified: z.boolean().optional(), demo: z.boolean().optional(), currency: z.string().optional(),
  classification: z.enum(["active_asking", "displayed_sold", "verified_transaction"]).optional(),
  brand: z.string().optional(), model: z.string().optional(), size: z.string().optional(),
  listingDate: z.string().optional(), soldDate: z.string().optional(), retrievedAt: z.string().optional(),
  provider: z.string().optional(), verificationStatus: z.enum(["unverified", "source_reported", "verified"]).optional()
});
export const listingArraySchema = z.array(listingSchema);
