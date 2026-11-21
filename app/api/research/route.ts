import { NextResponse } from "next/server";
import { getResearch } from "@/lib/providers";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  try { return NextResponse.json(await getResearch(query, { demo: body.demo === true })); } catch { return NextResponse.json({ error: "Configured research providers are unavailable." }, { status: 502 }); }
}
