# KDR Wrocław

A friendly catalog of discounts offered by partners of Karta Dużej Rodziny (the Polish Large Family Card) in Wrocław and its surroundings.
Data comes from the official registry on [empatia.gov.pl](https://empatia.gov.pl/znizki-i-ulgi-partnerow-kdr) and is refreshed automatically.

## Features

- search by name, street or discount text, tolerant of Polish diacritics
- tabs: all partners, biggest discounts, fun places (culture, sport, zoo, cafés), new partners, favorites
- category and subcategory filters
- sorting by discount, date, name or distance from you
- map with every partner
- interface in English, Ukrainian or Polish

## Getting started

```sh
nvm use
npm install
npm run sync   # fetch fresh data from the API
npm run dev
```

Other commands: `npm test`, `npm run lint`, `npm run format`, `npm run build`.

## How it works

- `scripts/sync.ts` queries the public Solr index at `https://kdr-api.mrpips.gov.pl` (15 km radius around the Wrocław centre), fetches the discount description of every partner through `/oddzial/{id}` and writes the normalized `public/data/partners.json`.
- `certs/` holds the Certum intermediate certificate that the API server omits from its TLS chain.
- `src/lib/discount.ts` extracts a percentage, an amount or a "free" perk from the discount text and ranks partners by it.
- The app is built with Vite + React, the map uses Leaflet, search uses MiniSearch. Filter state lives in the URL.

## Keeping data fresh

GitHub Actions (`.github/workflows/deploy.yml`) runs `npm run sync` every Monday at 04:00 UTC, commits changes to `public/data/partners.json` and deploys the site to GitHub Pages. To run it by hand: Actions → Sync and deploy → Run workflow.

Data is published under CC BY-NC-ND 3.0 PL by the Ministry of Family, Labour and Social Policy of Poland.
