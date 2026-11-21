import type { ListingDraft, Scan } from "./types";

const SCANS_KEY = "sellerapp:saved-scans";
const LISTINGS_KEY = "sellerapp:listing-drafts";
export const OWNER_ID = "local-owner";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}
function write<T>(key: string, value: T[]) { window.localStorage.setItem(key, JSON.stringify(value)); }

export const getScans = () => read<Scan>(SCANS_KEY);
export const saveScan = (scan: Scan) => { const scans = getScans().filter((entry) => entry.id !== scan.id); write(SCANS_KEY, [scan, ...scans]); return scan; };
export const deleteScan = (id: string) => write(SCANS_KEY, getScans().filter((scan) => scan.id !== id));
export const getListings = () => read<ListingDraft>(LISTINGS_KEY);
export const saveListing = (listing: ListingDraft) => { const listings = getListings().filter((entry) => entry.id !== listing.id); write(LISTINGS_KEY, [listing, ...listings]); return listing; };
export const getListingForScan = (scanId: string) => getListings().find((listing) => listing.sourceScanId === scanId);
export const deleteListing = (id: string) => write(LISTINGS_KEY, getListings().filter((listing) => listing.id !== id));
export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
