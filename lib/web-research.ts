import type { Item, Listing, ResearchResult } from "./types";
import { resolveGeminiModel } from "./gemini-models";
import { budgetResult, consumeResearchBudget, researchBudget } from "./research-budget";

type GroundingChunk = { web?: { uri?: string; title?: string } };
type Evidence = { title?: unknown; price?: unknown; currency?: unknown; url?: unknown; marketplace?: unknown; date?: unknown; condition?: unknown; priceType?: unknown; evidenceQuote?: unknown };

const cache = new Map<string, { expiresAt: number; result: ResearchResult }>();
const MAX_CACHE = 100;
const timeout = (ms: number) => AbortSignal.timeout(ms);
const clean = (value: unknown, max = 240) => String(value ?? "").trim().slice(0, max);
const safeUrl = (value: unknown) => typeof value === "string" && /^https?:\/\//i.test(value) ? value : "";
type SearchLink = { marketplace: "eBay" | "Mercari" | "Poshmark" | "Depop"; url: string; label: string };
const externalSearchLinks = (query: string): SearchLink[] => { const q = encodeURIComponent(query); return [{ marketplace: "eBay", url: `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1`, label: "Search eBay sold" }, { marketplace: "Mercari", url: `https://www.mercari.com/search/?keyword=${q}`, label: "Search Mercari" }, { marketplace: "Poshmark", url: `https://poshmark.com/search?query=${q}`, label: "Search Poshmark" }, { marketplace: "Depop", url: `https://www.depop.com/search/?q=${q}`, label: "Search Depop" }]; };
const marketplace = (value: unknown): Listing["marketplace"] => {
  const text = clean(value).toLowerCase();
  if (text.includes("ebay")) return "eBay";
  if (text.includes("mercari")) return "Mercari";
  if (text.includes("poshmark")) return "Poshmark";
  if (text.includes("depop")) return "Depop";
  return "Web";
};
const classification = (value: unknown): Listing["classification"] | null => {
  const text = clean(value).toLowerCase().replace(/[ -]/g, "_");
  if (text === "active_asking" || text === "asking") return "active_asking";
  if (text === "displayed_sold" || text === "sold") return "displayed_sold";
  if (text === "verified_transaction" || text === "verified") return "verified_transaction";
  return null;
};

export const researchQuery = (item: Partial<Item>, extra = "") => [item.brand, item.model, item.name, item.category, item.color, item.size, item.notes, extra].map((value) => clean(value, 120)).filter(Boolean).join(" ").replace(/\s+/g, " ").slice(0, 400);

const emptyResult = (query: string, note: string, missingInformation?: string[]): ResearchResult => ({ active: [], sold: [], soldAvailable: false, source: "unavailable", sourceNote: note, externalSearchLinks: externalSearchLinks(query), confidence: "low", researchQueries: query ? [query] : [], missingInformation });

export const parseGroundedEvidence = (raw: unknown, chunks: GroundingChunk[], query: string): ResearchResult => {
  const allowed = new Map<string, string>(chunks.map((chunk): [string, string] => [safeUrl(chunk.web?.uri), clean(chunk.web?.title)]).filter(([url]) => Boolean(url)));
  const rows = Array.isArray(raw) ? raw : (raw && typeof raw === "object" && Array.isArray((raw as { comparables?: unknown }).comparables) ? (raw as { comparables: unknown[] }).comparables : []);
  const listings: Listing[] = [];
  for (const candidate of rows) {
    if (!candidate || typeof candidate !== "object") continue;
    const evidence = candidate as Evidence;
    const url = safeUrl(evidence.url);
    const price = Number(evidence.price);
    const kind = classification(evidence.priceType);
    const title = clean(evidence.title);
    const evidenceQuote = clean(evidence.evidenceQuote, 500);
    if (!url || !allowed.has(url) || !title || !Number.isFinite(price) || price < 0 || !kind || !evidenceQuote || !evidenceQuote.includes(String(evidence.price))) continue;
    const sold = kind !== "active_asking";
    listings.push({ id: `web-${listings.length}-${url}`, title, price, shipping: 0, condition: "Good", url, marketplace: marketplace(evidence.marketplace || allowed.get(url)), kind: sold ? "sold" : "active", classification: kind, verificationStatus: "source_reported", provider: "Gemini Google Search grounding", currency: clean(evidence.currency, 8) || "USD", listingDate: clean(evidence.date) || undefined, soldDate: sold ? clean(evidence.date) || undefined : undefined, retrievedAt: new Date().toISOString() });
  }
  const active = listings.filter((listing) => listing.kind === "active");
  const sold = listings.filter((listing) => listing.kind === "sold");
  const count = active.length + sold.length;
  return { active, sold, soldAvailable: sold.length > 0, source: count ? "web" : "unavailable", sourceNote: count ? `Web research found ${count} source-supported comparable${count === 1 ? "" : "s"}. Asking and sold evidence are shown separately; verify each source before relying on it.` : "No source-supported comparable prices were found. Search marketplaces manually or add a verified comparable.", externalSearchLinks: externalSearchLinks(query), confidence: count >= 8 ? "high" : count >= 3 ? "medium" : "low", researchQueries: [query] };
};

export async function getWebResearch(item: Partial<Item>, extra = ""): Promise<ResearchResult> {
  const query = researchQuery(item, extra);
  if (!query) return emptyResult(query, "Add more product details before researching prices.", ["brand or model"]);
  if (process.env.GEMINI_WEB_RESEARCH_ENABLED !== "true") return emptyResult(query, "Automated web research is currently disabled. No prices were estimated. Use the marketplace links or add a verified comparable.");
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const budget = consumeResearchBudget();
  if (!budget.allowed) return budgetResult(query, externalSearchLinks);
  const modelResolution = await resolveGeminiModel();
  if (!modelResolution.available || !modelResolution.selectedModel) return emptyResult(query, "Gemini Search Grounding is unavailable for the configured model. No prices were estimated.");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return emptyResult(query, "Gemini web research is not configured. No prices were estimated.");
  const prompt = `Research resale evidence for exactly this item: ${query}. Use Google Search grounding. Return ONLY JSON in the shape {"comparables":[{"title":"...","price":0,"currency":"USD","url":"https://...","marketplace":"eBay|Mercari|Poshmark|Depop|other","date":"...","condition":"...","priceType":"active_asking|displayed_sold|verified_transaction","evidenceQuote":"short source-supported text containing the exact price"}]}. Include a comparable only when the grounded source visibly supports the exact title/model and numeric price; evidenceQuote must contain the exact numeric price as shown by the source. Exclude unrelated models, bundles, accessories, parts, category matches, and prices you cannot verify from a grounded source. Never invent URLs, prices, dates, transaction status, or quotes. Use displayed_sold when a marketplace page labels an item sold but does not prove a completed transaction; use verified_transaction only when the source explicitly proves a transaction.`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelResolution.selectedModel)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, signal: timeout(15000), cache: "no-store", body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 2500 } }) });
    if (!response.ok) return emptyResult(query, "Gemini Search Grounding could not complete this research request. No prices were estimated.");
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: GroundingChunk[] } }[] };
    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return emptyResult(query, "No grounded web evidence was returned. Search marketplaces manually or add a verified comparable.");
    const parsed = parseGroundedEvidence(JSON.parse(text), candidate?.groundingMetadata?.groundingChunks ?? [], query);
    cache.set(key, { expiresAt: Date.now() + 5 * 60 * 1000, result: parsed });
    while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string);
    return parsed;
  } catch {
    return emptyResult(query, "Web research timed out or returned invalid evidence. No prices were estimated.");
  }
}

export const webResearchHealth = () => ({ configured: Boolean(process.env.GEMINI_API_KEY), enabled: process.env.GEMINI_WEB_RESEARCH_ENABLED === "true", model: process.env.GEMINI_MODEL || "auto", budget: researchBudget(), note: "Google Search grounding is opt-in because it can consume quota and may incur charges; the server resolves and probes an authorized image-capable model before use." });
