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

Both forms submit to `POST /api/interest` on the same server. Accepted submissions are appended to `.data/leads.jsonl` by default; set `DATA_DIR` to an absolute path on a persistent volume in production. The data directory is never served publicly. No email provider or SaaS account is required.

The forms collect only contact details and short qualification fields. They use a honeypot, length validation, and basic per-IP rate limiting. This is an early-stage collection service, not a CRM. Before opening registrations publicly, deploy behind HTTPS, choose a persistent volume with restricted access and backups, and establish a real privacy contact and retention process. Do not deploy to an ephemeral/serverless filesystem without replacing the storage adapter.

## Deployment

Run `pnpm install --frozen-lockfile && pnpm build && pnpm start` on any Node-compatible host with a
persistent disk. The server serves `dist/` and the form API from the same origin.
Set `PORT` if needed and `DATA_DIR` to the mounted private directory; no
hosting-specific form service is assumed. The default rate limit uses the socket
address. Set `TRUST_PROXY=true` only when a trusted reverse proxy sanitizes
`X-Forwarded-For`, otherwise users behind one proxy may share a rate limit.

## Project structure

```text
src/app/         app shell and route selection
src/components/  shared UI and form behavior
src/pages/       home, beta, operator, and thank-you pages
public/assets/   original CSS and logo
scripts/         static HTML pre-render step
server.js        production static server and form API
server.test.js   API and rendered-page tests
```
