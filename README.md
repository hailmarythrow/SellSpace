# SellerApp

SellerApp is a mobile-first AI-assisted resale research workspace. It quick-scans an item, corrects editable identification, retrieves authorized marketplace comparables, estimates net profit only from real sold evidence, saves the scan, and converts it into an internal listing draft.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure authorized marketplace credentials when available.
4. Run `npm run dev` and open `http://localhost:3000`.

All marketplace results must come from authorized providers or user-entered comparables. The provider interfaces in `lib/providers.ts` are the extension point for authenticated eBay Browse API active searches, authorized sold sources, and future providers.

Saved scans and listing drafts currently persist in browser `localStorage` with stable IDs, ownership fields, and source-scan links. This keeps the app credential-free locally while leaving a straightforward migration path to Supabase tables for scans, inventory items, listings, marketplace listings, and sale records.

## Live research providers

The research request now runs through `/api/research`, so provider keys remain server-only. With no live marketplace keys configured, SellerApp shows `Live marketplace pricing is currently unavailable.` and external marketplace links. It does not silently substitute fabricated prices. When a live provider is configured, the app returns only live/provider-reported data.

Quick Scan image identification runs through `/api/identify` using `GEMINI_API_KEY`. The preferred model is `gemini-3.5-flash-lite`. Before identification, the server queries Google's model endpoint, verifies `generateContent` support, and makes a small real image-generation probe. If the preferred model is unavailable to the key, `GEMINI_FALLBACK_MODELS` is tried in order. Keep the key server-side; it is never exposed to browser code. `/api/health` reports the selected model, fallback use, and probe attempts without returning secrets. The route validates image type/size and the structured identification response; failures stop the workflow with an error and do not trigger research.

- eBay Browse API: set `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, and optionally `EBAY_MARKETPLACE_ID`. This supports active listing search through eBay's official Browse API. The Browse API does not provide a general historical sold-search endpoint.
- Soldgraph: set `SOLDGRAPH_API_KEY` to query eBay, Mercari, Poshmark, and Depop routes from one server-side provider. Depop is active-listings-only in the current adapter. Poshmark sold prices are classified as displayed sold/listing asks, not verified transactions.
- Scavio: `SCAVIO_API_KEY` is reserved for a future adapter behind the same provider interface; it is not called until its response contract is explicitly implemented and tested.

`/api/health` reports whether OpenAI, eBay, Soldgraph, and Supabase variables are configured in the current environment. It does not return secret values.

### Optional automated web research

SellerApp includes an opt-in Gemini Google Search Grounding adapter. Set `GEMINI_WEB_RESEARCH_ENABLED=true` only after confirming billing, quota, and model support for the deployment; it is `false` by default so scans never activate a potentially billable search tool unexpectedly. Grounded results are accepted only when Gemini returns a numeric price, classification, and URL that also appears in grounding metadata. Unsupported or restricted marketplace pages are not scraped or bypassed. If grounding is disabled or unavailable, the app shows an honest empty state with external marketplace links and supports user-assisted URL, observed-price, or screenshot evidence in the research workspace.

Automated grounding is limited to five operations per UTC day by default with `GEMINI_WEB_RESEARCH_DAILY_LIMIT=5`; the limit is capped at five and has no paid fallback. The in-memory counter protects a warm server instance. A future shared deployment should move the counter to Supabase or another shared store for a global cross-instance quota.

Google's current [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search) documentation should be reviewed before enabling this optional service.

## Private Vercel preview deployment

This project is configured for Vercel with `vercel.json`. Import the repository as a **private** GitHub repository and use a Vercel Preview deployment for phone testing. Add the values from `.env.example` in Vercel Project Settings → Environment Variables, selecting Preview for credentials you want available there.

For a protected preview, set `VERCEL_PREVIEW_USERNAME` and `VERCEL_PREVIEW_PASSWORD` as Vercel Preview-only variables. The included middleware adds HTTP Basic Auth to Preview deployments only; it does not affect local development or production unless the environment is explicitly Preview.

The current Saved Scans and Listings persistence uses browser `localStorage`. A scan saved on your computer will not automatically appear on your phone. Cross-device synchronization requires connecting the existing ownership-aware model to Supabase.

### Mobile smoke test

Open the Vercel HTTPS Preview URL on the phone, authenticate with the preview credentials, then verify: Scan → identify/research → Save for Later → Saved → Convert to Listing → edit/save → Listings. Camera capture uses the browser file input with `capture="environment"`; the browser may ask for camera/photo permission.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture notes

- `lib/types.ts` defines provider, listing, item, and cost contracts.
- `lib/schemas.ts` validates external listing payloads with Zod.
- `lib/pricing.ts` keeps median, profit, and ROI calculations pure and testable.
- `lib/storage.ts` provides the local persistence repository for saved scans and listing drafts.
- `lib/listing.ts` converts a scan into a reusable listing draft without duplicating it on repeat conversion.
- Secrets belong only in server environment variables. The API route is the intended boundary for future OpenAI, eBay, and Supabase calls.
- Saved items currently have an intentional empty state; persistence and private photo storage can be added with Supabase without changing the UI contracts.
