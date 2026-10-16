# ALBIDA Kitchen

Standalone HTML, CSS and browser JavaScript frontend with a Node.js backend and PDFKit PDF generation.

## Run

```sh
cd albida
npm install
npm start
```

Open http://127.0.0.1:3100. Requires Node.js 20 or newer.

Complete the report, add dish quantities, and select **Submit & open WhatsApp**. Download a PDF from the success message or saved reports list. **View / reuse** loads a saved report; saving it creates a new entry.

Reports persist in `data/reports.json` (excluded from Git). Back up this directory. Optional environment variables: `PORT`, `HOST`, `ALBIDA_DATA_DIR`.

## Deploy to Vercel

The included `vercel.json` serves `public/` and routes API requests to `api/index.js`. The handler does not start a listening server or write to disk during import.

Vercel requires external persistent storage; the local JSON file cannot be used there, and `/tmp` would lose reports. Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your Vercel project's environment variables, then redeploy. The `KV_REST_API_URL` and `KV_REST_API_TOKEN` aliases are also supported. Use a separate database or `ALBIDA_REPORTS_KEY` for preview deployments so they do not share production reports. Keep tokens server-side.

Without these variables the website still loads, but report endpoints return a descriptive 503 until storage is configured. Existing local reports are not automatically migrated to Redis. Redis writes use atomic list operations so concurrent function instances do not overwrite each other's reports.

This version binds to localhost by default and has no authentication. Add access control before exposing it on a shared or public server. Run a single server process against the data directory.

Branding uses the supplied logo's charcoal and white palette, with a CSS/text monogram. Replace the monogram with the original logo image when an asset file is available.

Submitting saves the report, then opens a WhatsApp message addressed to +263 78 561 7589. The user must press Send in WhatsApp and manually attach the downloaded PDF. This is click-to-chat, not automatic API delivery. A fallback Open WhatsApp link is available if popups are blocked. Saved entries also have a sharing link. No message is marked as delivered by the app.

PDFs include a vector recreation of the supplied circular A logo, a branded header, a dish table, section headings and page numbers.
