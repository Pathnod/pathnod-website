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

The UI is a small React + TypeScript application. `src/pages/` contains the six
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
collect only contact and qualification details, use a honeypot, length
validation, a Turnstile challenge, and limit repeated submissions per visitor.
Turnstile verification happens server-side, and the response must match the
request hostname and the form action. The Cloudflare Function
stores leads in D1, not in a deployment's ephemeral filesystem. Rate-limit keys
are HMAC hashes of the visitor IP and time window; raw IPs are not stored.

This is an early-stage collection service, not a CRM. The privacy contact is
`pathnod@protonmail.com`. Restrict access to the D1 database and keep backups.
The beta and operator forms contain personal data; do not point preview
deployments at the production D1 database. At least monthly, execute
`cloudflare/retention.sql` in each D1 database to remove expired leads and
rate-limit keys. Fulfil deletion requests promptly by locating the relevant
email in D1 and deleting its rows. The legal publisher identity and postal
address are not yet known and **must be completed in the legal and privacy
pages before public launch**.

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
4. Create a Cloudflare Turnstile widget for the production hostname(s), including
   the exact `pathnod-website.pages.dev` hostname and later the custom domain if used.
   Set its public site key as the Pages build variable `VITE_TURNSTILE_SITE_KEY`.
   Set its private key as the Pages runtime secret `TURNSTILE_SECRET_KEY`.
   Configure these in both Production and Preview environments as appropriate;
   use separate preview keys. Never commit the private key. If either key is
   missing, forms will not accept submissions. The site build warns when the
   public key is absent.
5. Redeploy after adding the binding and secrets. If preview builds are enabled,
   create a separate preview D1 database with the same schema and bind it as `DB`
   in the Preview environment; also set a separate preview `RATE_LIMIT_SECRET`.
   Without these, preview form submissions fail closed with HTTP 503.
6. Submit one beta and one operator test form on the production URL. Confirm the
   thank-you page appears and two rows are present in D1 (`SELECT audience,
   email, submitted_at FROM leads ORDER BY id DESC LIMIT 2;`). Remove these test
   rows afterwards if they contain real personal data.

The Pages Function returns HTTP 503 if the D1 binding, either secret, or Cloudflare
visitor IP is absent: a green deployment alone does **not** mean signups are
working. The Pages site and D1 free tiers have usage limits. Cloudflare Pages
applies `public/_headers` to static responses; the Function sets its own API
response headers. Test both after deployment.

For local development, set `VITE_TURNSTILE_SITE_KEY` in the terminal running
Vite and `TURNSTILE_SECRET_KEY` in the terminal running the API. Use a localhost
widget or the [Cloudflare Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
`pnpm run dev:api` keeps using `server.js` and writes
`.data/leads.jsonl` outside the public build. On another Node-compatible host,
run `pnpm install --frozen-lockfile && pnpm build && pnpm start` with `DATA_DIR`
set to a private persistent volume. Set `TRUST_PROXY=true` only behind a trusted
reverse proxy that sanitizes `X-Forwarded-For`.

## Project structure

```text
src/app/         app shell and route selection
src/components/  shared UI and form behavior
src/pages/       home, beta, operator, thank-you, privacy, and legal pages
public/assets/   original CSS and logo
scripts/         static HTML pre-render step
functions/       Cloudflare Pages form endpoint
cloudflare/       D1 schema
public/_headers  static response security headers on Cloudflare Pages
lib/             shared form validation
public/_routes.json  invoke Functions only for the form API
server.js        production static server and form API
server.test.js   API and rendered-page tests
```
