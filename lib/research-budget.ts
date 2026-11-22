const DEFAULT_LIMIT = 5;
let windowState: { day: string; used: number } = { day: "", used: 0 };

const today = () => new Date().toISOString().slice(0, 10);
const limit = () => { const configured = Number(process.env.GEMINI_WEB_RESEARCH_DAILY_LIMIT ?? DEFAULT_LIMIT); return Number.isInteger(configured) && configured > 0 ? Math.min(configured, 5) : DEFAULT_LIMIT; };

export const researchBudget = () => {
  const day = today();
  if (windowState.day !== day) windowState = { day, used: 0 };
  return { day, used: windowState.used, limit: limit(), remaining: Math.max(0, limit() - windowState.used) };
};

export const consumeResearchBudget = () => {
  const status = researchBudget();
  if (status.remaining <= 0) return { allowed: false, ...status };
  windowState.used += 1;
  return { allowed: true, ...researchBudget() };
};

export const budgetResult = (query: string, links: (query: string) => { marketplace: "eBay" | "Mercari" | "Poshmark" | "Depop"; url: string; label: string }[]) => ({ active: [], sold: [], soldAvailable: false, source: "unavailable" as const, sourceNote: "Daily automated web-research limit reached. No paid fallback was used; use the marketplace links or add evidence manually.", externalSearchLinks: links(query), confidence: "low" as const, researchQueries: query ? [query] : [] });
