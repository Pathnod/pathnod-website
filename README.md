# Pathnod website

Public landing page for Pathnod, with two separate entry points: a beta waitlist and conversations with DePIN operators.

## Run locally

Requires Node.js 20 or newer. No package installation is needed.

```sh
npm start
```

Open `http://localhost:3000`. Run `npm test` for the API tests.

## Forms and data

Both forms submit to `POST /api/interest` on the same server. Accepted submissions are appended to `.data/leads.jsonl` by default; set `DATA_DIR` to an absolute path on a persistent volume in production. The data directory is never served publicly. No email provider or SaaS account is required.

The forms collect only contact details and short qualification fields. They use a honeypot, length validation, and basic per-IP rate limiting. This is an early-stage collection service, not a CRM. Before opening registrations publicly, deploy behind HTTPS, choose a persistent volume with restricted access and backups, and establish a real privacy contact and retention process. Do not deploy to an ephemeral/serverless filesystem without replacing the storage adapter.

## Deployment

Run `node server.js` on any Node-compatible host with a persistent disk. Set `PORT` if needed and `DATA_DIR` to the mounted private directory. Keep the site and API on the same origin; no hosting-specific form service is assumed. The default rate limit uses the socket address. Set `TRUST_PROXY=true` only when a trusted reverse proxy sanitizes `X-Forwarded-For`, otherwise users behind one proxy may share a rate limit.

## Project structure

```text
public/          static pages and assets
server.js        static server and form API
server.test.js   API validation and persistence tests
```
