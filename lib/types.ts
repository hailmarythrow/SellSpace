export type Condition = "New" | "Like new" | "Good" | "Fair";
export type Marketplace = "eBay" | "Mercari" | "Poshmark" | "Depop" | "Manual";
export type ListingKind = "active" | "sold";
export type PriceClassification = "active_asking" | "displayed_sold" | "verified_transaction";

export type Listing = {
  id: string; title: string; price: number; shipping: number; condition: Condition;
  imageUrl?: string; url: string; marketplace: Marketplace; kind: ListingKind;
  verified?: boolean; demo?: boolean; currency?: string; classification?: PriceClassification;
  brand?: string; model?: string; size?: string; listingDate?: string; soldDate?: string;
  retrievedAt?: string; provider?: string; verificationStatus?: "unverified" | "source_reported" | "verified";
};

export type Item = {
  id: string; name: string; brand: string; model: string; category: string;
  color: string; size: string; confidence: number; imageUrl?: string;
};

export type Costs = { purchase: number; fees: number; shipping: number; other: number };

export type ResearchSource = "live" | "manual" | "unavailable" | "legacy";
export type ResearchResult = { active: Listing[]; sold: Listing[]; soldAvailable: boolean; source?: ResearchSource; sourceNote: string; externalSearchLinks?: { marketplace: Marketplace; url: string; label: string }[]; confidence?: "low" | "medium" | "high"; resaleRange?: { low: number; high: number; currency: string } };
export const researchSource = (research: ResearchResult): ResearchSource => { const storedSource = (research as unknown as { source?: string }).source; if (storedSource === "legacy" || storedSource === "demo") return "legacy"; if (research.source) return research.source; return research.active.some((listing) => listing.demo) || research.sold.some((listing) => listing.demo) ? "legacy" : research.active.length || research.sold.length ? "live" : "unavailable"; };

export type Scan = {
  id: string;
  ownerId: string;
  photoUrl?: string;
  createdAt: string;
  item: Item;
  research: ResearchResult;
  purchaseCost?: number;
};

export type ListingStatus = "Draft" | "Ready to List" | "Active" | "Sold" | "Archived";

export type ListingDraft = {
  id: string;
  ownerId: string;
  sourceScanId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  size: string;
  measurements: string;
  condition: string;
  description: string;
  photoUrls: string[];
  purchasePrice?: number;
  targetPrice?: number;
  marketplace: Marketplace;
  marketplaceUrl: string;
  status: ListingStatus;
  actualSalePrice?: number;
  saleFees: number;
  saleCosts: number;
};

export type MarketplaceProvider = {
  name: string; capabilities: { active: boolean; sold: boolean };
  searchActive(query: string): Promise<Listing[]>;
  searchSold(query: string): Promise<Listing[]>;
};
