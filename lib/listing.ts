import type { ListingDraft, Scan } from "./types";
import { makeId, OWNER_ID } from "./storage";

export function listingFromScan(scan: Scan, existing?: ListingDraft): ListingDraft {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? makeId("listing"), ownerId: OWNER_ID, sourceScanId: scan.id,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
    title: existing?.title ?? `${scan.item.brand} ${scan.item.model || scan.item.name}`.trim(),
    brand: existing?.brand ?? scan.item.brand, model: existing?.model ?? scan.item.model,
    category: existing?.category ?? scan.item.category, size: existing?.size ?? scan.item.size,
    measurements: existing?.measurements ?? "", condition: existing?.condition ?? "Needs verification",
    description: existing?.description ?? `Research notes for ${scan.item.name}. Verify condition, measurements, and specifications before publishing.`,
    photoUrls: existing?.photoUrls?.length ? existing.photoUrls : scan.photoUrls?.length ? scan.photoUrls : scan.photoUrl ? [scan.photoUrl] : [],
    purchasePrice: existing?.purchasePrice ?? scan.purchaseCost,
    targetPrice: existing?.targetPrice ?? scan.research.sold[0]?.price ?? scan.research.active[0]?.price,
    marketplace: existing?.marketplace ?? "eBay", marketplaceUrl: existing?.marketplaceUrl ?? "",
    status: existing?.status ?? "Draft", actualSalePrice: existing?.actualSalePrice,
    saleFees: existing?.saleFees ?? 0, saleCosts: existing?.saleCosts ?? 0
  };
}
