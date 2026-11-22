import { NextResponse } from "next/server";
import { getResearch } from "@/lib/providers";
import { getWebResearch } from "@/lib/web-research";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  try {
    const liveConfigured = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) || Boolean(process.env.SOLDGRAPH_API_KEY);
    if (!liveConfigured) return NextResponse.json(await getWebResearch({ ...(body.item ?? {}), name: body.item?.name || query }));
    return NextResponse.json(await getResearch(query));
  } catch { return NextResponse.json({ error: "Configured research providers are unavailable." }, { status: 502 }); }
}
