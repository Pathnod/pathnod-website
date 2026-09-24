# Pathnod website

Public landing page for Pathnod, with two separate entry points: a beta waitlist and conversations with DePIN operators.

## Run locally

Requires Node.js 20 or newer.

```sh
pnpm install --frozen-lockfile
pnpm run dev:api
```

In a second terminal, run `pnpm run dev` and open `http://localhost:5173`.
Vite proxies `/api` to the Node server on port 3000. Run `pnpm test` for the
production build and API/page tests.

## Architecture

The UI is a small React + TypeScript application. `src/pages/` contains the four
routes; `src/components/` holds shared navigation, footer, form, and subpage
layout. `src/app/` chooses the page based on the URL. The original colors, CSS,
copy, and logo remain in `public/assets/`.

`pnpm run build` uses Vite to bundle the client and then pre-renders each route
as HTML. React hydrates those pages in the browser. This keeps the landing page
readable without JavaScript and gives each route its own title and description.
Navigation uses ordinary links; no client-side router or external form service
is required.

## Forms and data

Both forms submit to `POST /api/interest`. `lib/submission.js` provides the same
validation to the local Node server and the Cloudflare Pages Function. The forms
collect only contact and qualification details, use a honeypot and length
validation, and limit repeated submissions per visitor. The Cloudflare Function
stores leads in D1, not in a deployment's ephemeral filesystem. Rate-limit keys
are HMAC hashes of the visitor IP and time window; raw IPs are not stored.

This is an early-stage collection service, not a CRM. Before opening registrations
publicly, establish a privacy contact, a retention/deletion process, and restricted
access plus backups for the D1 database. The beta and operator forms contain
personal data; do not point preview deployments at the production D1 database.

## Deploy on Cloudflare Pages

1. Connect this GitHub repository to a Pages project. Set the production branch
   to `main`, build command to `pnpm run build`, and output directory to `dist`.
   Use the Pages v3 build image with `PNPM_VERSION=11.27.1`; its default Node 22
   is sufficient. The `functions/` directory is discovered automatically and
   `public/_routes.json` ensures only `/api/interest` invokes a Function.
2. Create a D1 database (for example `pathnod-leads`) in Cloudflare. In its SQL
   console, run the statements in `cloudflare/schema.sql` before enabling the
   forms. The schema creates the `leads` and `submission_rate_limits` tables.
3. Under the Pages project's **Settings → Bindings**, add a D1 binding named
   exactly `DB` and select that database. Under **Settings → Variables and
   Secrets**, add a secret named `RATE_LIMIT_SECRET` with at least 32 random
   characters. Generate it locally with `openssl rand -hex 32`; do not commit
   or paste its value into the repository.
4. Redeploy after adding the binding and secret. If preview builds are enabled,
   create a separate preview D1 database with the same schema and bind it as `DB`
   in the Preview environment; also set a separate preview `RATE_LIMIT_SECRET`.
   Without these, preview form submissions fail closed with HTTP 503.
5. Submit one beta and one operator test form on the production URL. Confirm the
   thank-you page appears and two rows are present in D1 (`SELECT audience,
   email, submitted_at FROM leads ORDER BY id DESC LIMIT 2;`). Remove these test
   rows afterwards if they contain real personal data.

The Pages Function returns HTTP 503 if the D1 binding, secret, or Cloudflare
visitor IP is absent: a green deployment alone does **not** mean signups are
working. The Pages site and D1 free tiers have usage limits.

For local development, `pnpm run dev:api` keeps using `server.js` and writes
`.data/leads.jsonl` outside the public build. On another Node-compatible host,
run `pnpm install --frozen-lockfile && pnpm build && pnpm start` with `DATA_DIR`
set to a private persistent volume. Set `TRUST_PROXY=true` only behind a trusted
reverse proxy that sanitizes `X-Forwarded-For`.

## Project structure

```text
src/app/         app shell and route selection
src/components/  shared UI and form behavior
src/pages/       home, beta, operator, and thank-you pages
public/assets/   original CSS and logo
scripts/         static HTML pre-render step
functions/       Cloudflare Pages form endpoint
cloudflare/       D1 schema
lib/             shared form validation
public/_routes.json  invoke Functions only for the form API
server.js        production static server and form API
server.test.js   API and rendered-page tests
```
