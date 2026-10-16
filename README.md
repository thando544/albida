# ALBIDA Kitchen

A service report form that opens WhatsApp addressed to +263 78 561 7589 with the completed report. Press **Send** in WhatsApp to deliver it. The website does not send messages automatically or confirm delivery.

## Run

```sh
npm install
npm start
```

Open http://127.0.0.1:3100. Requires Node.js 20 or newer. Run checks with `npm test`.

## Reports and deployment

Reports are composed in the browser and passed directly to WhatsApp. No report API request, database, Redis configuration, browser storage, or PDF attachment is needed. Closing or refreshing the page discards the form. Existing `data/reports.json` contents are not read or modified.

Deploy using the included Vercel configuration. No Upstash environment variables are required. The former report storage endpoints are disabled.
