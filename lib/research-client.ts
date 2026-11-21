import type { ResearchResult } from "./types";

export async function requestResearch(query: string, options: { demo?: boolean } = {}): Promise<ResearchResult> {
  const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, demo: options.demo === true }) });
  if (!response.ok) throw new Error("Research request failed");
  return response.json() as Promise<ResearchResult>;
}
