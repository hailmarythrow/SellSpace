import type { ResearchResult } from "./types";
import type { Item } from "./types";

export async function requestResearch(query: string, item?: Partial<Item>): Promise<ResearchResult> {
  const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, item }) });
  if (!response.ok) throw new Error("Research request failed");
  return response.json() as Promise<ResearchResult>;
}
