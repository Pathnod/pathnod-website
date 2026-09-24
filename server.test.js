import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createPathnodServer, validateSubmission } from './server.js';

let server;
let baseUrl;
let dataDir;

before(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'pathnod-website-test-'));
  server = createPathnodServer({ dataDir, turnstileSecret: 'test-secret', fetcher: async (_url, options) => {
    const form = new URLSearchParams(options.body);
    const audience = form.get('response')?.split(':')[1];
    return Response.json({ success: true, hostname: '127.0.0.1', action: `interest_${audience}` });
  } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
});

async function submit(fields) {
  return fetch(`${baseUrl}/api/interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ 'cf-turnstile-response': `valid:${fields.audience}`, ...fields }),
  });
}

test('beta validation rejects missing consent and invalid email', () => {
  assert.match(validateSubmission({ audience: 'beta', email: 'not-an-email', iphone: 'yes', consent: 'yes' }).error, /email/);
  assert.match(validateSubmission({ audience: 'beta', email: 'person@example.com', iphone: 'yes' }).error, /confirm/);
});

test('operator validation rejects incomplete qualification', () => {
  assert.match(validateSubmission({ audience: 'operator', email: 'person@example.com', consent: 'yes' }).error, /operator/);
});

test('serves pre-rendered pages with their route-specific content', async () => {
  const pages = [
    ['/', 'Pathnod — Trust what is on the ground', 'The blind spot'],
    ['/beta/', 'Join the beta waitlist — Pathnod', 'name="audience" value="beta"'],
    ['/operators/', 'For network operators — Pathnod', 'name="audience" value="operator"'],
    ['/thanks/', 'Thank you — Pathnod', 'Message received'],
    ['/privacy/', 'Privacy notice — Pathnod', 'pathnod@protonmail.com'],
    ['/legal/', 'Legal notice — Pathnod', 'Cloudflare'],
  ];
  for (const [route, title, content] of pages) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.ok(html.includes(`<title>${title}</title>`));
    assert.ok(html.includes(content));
    assert.match(html, /<div id="root">.+<\/div>/s);
  }
});

test('static pages declare security headers for Cloudflare Pages', async () => {
  const headers = await readFile(path.join(process.cwd(), 'dist/_headers'), 'utf8');
  assert.match(headers, /Content-Security-Policy:.*frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Permissions-Policy:/);
  const response = await fetch(`${baseUrl}/privacy/`);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});

test('local API rejects a missing Turnstile token', async () => {
  const response = await submit({ audience: 'beta', email: 'person@example.com', iphone: 'yes', consent: 'yes', 'cf-turnstile-response': '' });
  assert.equal(response.status, 400);
});

test('stores beta and operator submissions separately without logging IPs', async () => {
  const beta = await submit({ audience: 'beta', email: 'BETA@example.com', iphone: 'yes', country: 'France', consent: 'yes' });
  assert.equal(beta.status, 200);
  assert.equal((await beta.json()).ok, true);

  const operator = await submit({ audience: 'operator', email: 'ops@example.com', name: 'Alex', organization: 'Example Network', role: 'Operations', fleetSize: '100-1000', challenge: 'GPS reports are unreliable.', consent: 'yes' });
  assert.equal(operator.status, 200);
  const entries = (await readFile(path.join(dataDir, 'leads.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(entries.map((entry) => entry.audience), ['beta', 'operator']);
  assert.equal(entries[0].email, 'beta@example.com');
  assert.equal(entries[1].organization, 'Example Network');
  assert.equal('ip' in entries[0], false);
});

test('rejects malformed submissions and does not persist a honeypot submission', async () => {
  const bad = await submit({ audience: 'beta', email: 'person@example.com', iphone: 'maybe', consent: 'yes' });
  assert.equal(bad.status, 400);
  const honeypot = await submit({ website: 'spam', audience: 'beta' });
  assert.equal(honeypot.status, 200);
  const entries = (await readFile(path.join(dataDir, 'leads.jsonl'), 'utf8')).trim().split('\n');
  assert.equal(entries.length, 2);
});

test('does not expose private data or allow path traversal', async () => {
  assert.equal((await fetch(`${baseUrl}/.data/leads.jsonl`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/%2e%2e/server.js`)).status, 404);
});
