"use client";
import Link from "next/link";
import { useState } from "react";
import { calculateProfit, summarizePrices } from "@/lib/pricing";
import { requestResearch } from "@/lib/research-client";
import type { ResearchResult } from "@/lib/types";

const money = (value: number | null) => value === null ? "—" : `$${Math.round(value).toLocaleString()}`;
export function Dashboard() {
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const runDemo = async () => { setLoading(true); try { setResearch(await requestResearch("Seiko 5 green dial watch", { demo: true })); } finally { setLoading(false); } };
  const active = research ? summarizePrices(research.active) : { median: null, count: 0 };
  const sold = research ? summarizePrices(research.sold) : { median: null, count: 0 };
  const profit = calculateProfit(sold.median ?? 0, { purchase: 55, fees: 20, shipping: 12, other: 0 });
  return <div className="space-y-6">
    <section className="grain overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="max-w-xl"><span className="rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald">Built for the next flip</span><h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">Know what it’s worth before you list.</h2><p className="mt-3 max-w-md leading-6 text-muted">Snap a photo, identify the item, and make a confident buy or pass decision.</p><Link href="/scan" className="mt-6 inline-flex items-center rounded-xl bg-emerald px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald/20">Start a new scan <span className="ml-3">→</span></Link></div></section>
    <section className="grid gap-4 sm:grid-cols-3"><Metric label="Active median" value={money(active.median)} note={active.count ? "DEMO asking listings" : "No research yet"} /><Metric label="Sold median" value={money(sold.median)} note={sold.count ? "DEMO sold comparables" : "No research yet"} /><Metric label="Est. profit" value={research ? money(profit.profit) : "—"} note={research ? "DEMO example only" : "Complete a scan"} /></section>
    <section className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Try the demo research</h2><p className="mt-1 text-sm text-muted">See the asking vs. sold workflow with labeled sample data.</p></div><button onClick={runDemo} disabled={loading} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Researching…" : "Run demo"}</button></div>{research && <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-canvas p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Asking prices</p><p className="mt-2 text-2xl font-bold">{money(active.median)}</p><p className="text-sm text-muted">{active.count} active comps</p></div><div className="rounded-xl bg-mint p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald">Verified sold</p><p className="mt-2 text-2xl font-bold">{money(sold.median)}</p><p className="text-sm text-muted">{sold.count} manual comps · DEMO</p></div></div>}</section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent research</h2><Link href="/saved" className="text-sm font-semibold text-emerald">View all →</Link></div><div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-2xl">⌁</div><p className="mt-3 font-semibold">Your saved research will appear here</p><p className="mt-1 text-sm text-muted">Keep your best finds organized for later.</p></div></section>
  </div>;
}
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold text-emerald">{note}</p></div>; }
