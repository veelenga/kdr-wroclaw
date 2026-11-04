# kdr-wroclaw

Catalog of Karta Dużej Rodziny partner discounts in Wrocław. Data comes from the public Solr index at kdr-api.mrpips.gov.pl, the same API that empatia.gov.pl uses.

- `npm run sync` rewrites `public/data/partners.json`; normalization lives in `scripts/lib/normalize.ts`, so changes there need a re-sync.
- The API server omits its intermediate certificate; `certs/certum-ov-tls-g2-r39.pem` is passed via `NODE_EXTRA_CA_CERTS` in the sync script.
- UI copy lives in `src/i18n/{en,uk,pl}.ts`; every string must exist in all three. Code, comments, docs and commit messages are in English.
- Run `npm run lint` and `npm test` before committing.
