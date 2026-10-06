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

test('new branding assets and favicon are available on every page', async () => {
  for (const route of ['/', '/beta/', '/operators/', '/privacy/', '/legal/']) {
    const html = await (await fetch(`${baseUrl}${route}`)).text();
    assert.match(html, /rel="icon" href="\/assets\/pathnod-favicon-v2\.png"/);
    assert.match(html, /rel="apple-touch-icon" href="\/assets\/pathnod-favicon-v2\.png"/);
    assert.doesNotMatch(html, /class="footer-banner"|class="footer-identity"/);
    assert.match(html, /Trust what is on the ground\./);
  }
  for (const asset of ['pathnod-favicon-v2.png', 'pathnod-mark-v2.png']) {
    const response = await fetch(`${baseUrl}/assets/${asset}`, { method: 'HEAD' });
    assert.equal(response.status, 200, asset);
    assert.equal(response.headers.get('content-type'), 'image/png');
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

test('home page includes team, project context, FAQ and accurate prototype scope', async () => {
  const html = await (await fetch(`${baseUrl}/`)).text();
  for (const text of ['Théo Dubois', 'Zakaria Chaikhi', 'Antonin Chaikhi', 'Building on Solana', 'Colosseum hackathon project', 'For network operators', 'What does Pathnod actually check?', 'WHAT THIS DOES NOT CLAIM']) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /href="https:\/\/x\.com\/pathnod"/);
  assert.match(html, /href="https:\/\/colosseum\.com\/arena\/projects\/sovel"/);
  assert.equal((html.match(/class="faq-item"/g) || []).length, 6);
  assert.equal((html.match(/class="team-card"/g) || []).length, 3);
  assert.doesNotMatch(html, /CORROBORATE|Operate a DePIN network|◎|✳/);
  for (const name of ['theo', 'zak', 'antonin']) {
    const response = await fetch(`${baseUrl}/assets/team-${name}.jpg`, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/jpeg');
  }
});

test('hardware demo is self-hosted, labelled and does not autoplay', async () => {
  const html = await (await fetch(`${baseUrl}/`)).text();
  const videos = [...html.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/g)].map(match => match[0]);
  assert.equal(videos.length, 2);
  for (const video of videos) {
    assert.match(video, /controls/);
    assert.match(video, /preload="none"/);
    assert.doesNotMatch(video, /autoplay/i);
    const caption = video.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(caption && html.includes(`id="${caption}"`));
  }
  assert.match(html, /not an end-to-end Solana demonstration/);
  assert.match(html, /src="\/assets\/iphone-esp32-demo-v2\.mp4"/);
  assert.match(html, /class="hardware-demo-stage"/);
  assert.match(html, /aria-label="What the demonstration shows"/);
  for (const label of ['Bluetooth discovery', 'Signed challenge', 'Signature verified']) {
    assert.ok(html.includes(label), label);
  }
  const response = await fetch(`${baseUrl}/assets/iphone-esp32-demo-v2.mp4`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  const poster = await fetch(`${baseUrl}/assets/iphone-esp32-demo-v2-poster.jpg`, { method: 'HEAD' });
  assert.equal(poster.status, 200);
});

test('hardware MP4 uses browser-compatible H.264 High and fast-start metadata', async () => {
  const data = await readFile(path.join(process.cwd(), 'dist/assets/iphone-esp32-demo-v2.mp4'));
  const avcConfig = data.indexOf(Buffer.from('avcC'));
  const moov = data.indexOf(Buffer.from('moov'));
  const mdat = data.indexOf(Buffer.from('mdat'));
  assert.ok(avcConfig > 0);
  assert.equal(data[avcConfig + 4], 1, 'AVC configuration version');
  assert.equal(data[avcConfig + 5], 100, 'H.264 High, not unsupported High 10');
  assert.ok(moov > 0 && mdat > moov, 'metadata must precede video for progressive playback');
});

test('beta explains iOS scope without excluding other waitlist users', async () => {
  const html = await (await fetch(`${baseUrl}/beta/`)).text();
  assert.match(html, /Android support has no announced date/);
  assert.match(html, /name="iphone" value="no"/);
  assert.match(html, /No rewards are promised/);
});

test('home page embeds the self-hosted concept video without autoplay', async () => {
  const html = await (await fetch(`${baseUrl}/`)).text();
  const video = html.match(/<video\b[^>]*>[\s\S]*?<\/video>/)?.[0];
  assert.ok(video);
  assert.match(video, /controls/);
  assert.match(video, /playsInline/i);
  assert.match(video, /preload="none"/);
  assert.doesNotMatch(video, /autoplay/i);
  assert.match(video, /src="\/assets\/pathnod-motion\.mp4"/);
  assert.match(html, /not a live product demo/);
  const media = await fetch(`${baseUrl}/assets/pathnod-motion.mp4`, { method: 'HEAD' });
  assert.equal(media.status, 200);
  assert.equal(media.headers.get('content-type'), 'video/mp4');
  const poster = await fetch(`${baseUrl}/assets/pathnod-motion-poster.jpg`, { method: 'HEAD' });
  assert.equal(poster.status, 200);
  assert.equal(poster.headers.get('content-type'), 'image/jpeg');
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
