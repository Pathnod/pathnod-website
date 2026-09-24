import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from './functions/api/interest.js';

class TestDatabase {
  constructor() {
    this.leads = [];
    this.limits = new Map();
  }

  prepare(sql) {
    return {
      bind: (...values) => ({
        first: async () => {
          assert.match(sql, /INSERT INTO submission_rate_limits/);
          const [key, windowStart] = values;
          assert.doesNotMatch(key, /127\.0\.0\.1/);
          const attempts = (this.limits.get(key)?.attempts ?? 0) + 1;
          this.limits.set(key, { windowStart, attempts });
          return attempts;
        },
        run: async () => {
          if (sql.includes('INSERT INTO leads')) {
            this.leads.push(JSON.parse(values[3]));
          } else if (sql.includes('DELETE FROM leads')) {
            this.leads = this.leads.filter((lead) => lead.submittedAt >= values[0]);
          } else if (sql.includes('DELETE FROM submission_rate_limits')) {
            for (const [key, value] of this.limits) {
              if (value.windowStart < values[0]) this.limits.delete(key);
            }
          } else {
            assert.fail(`Unexpected statement: ${sql}`);
          }
        },
      }),
    };
  }
}

const secret = 'test-only-secret-with-at-least-32-characters';
const turnstileSecret = 'test-turnstile-secret';
const validSiteverify = async (_url, options) => {
  const form = new URLSearchParams(options.body);
  return Response.json({ success: form.get('response') === 'valid-token', hostname: 'pathnod.com',
    action: form.get('response') === 'valid-token' ? 'interest_beta' : '' });
};
const validOperatorSiteverify = async () => Response.json({ success: true, hostname: 'pathnod.com', action: 'interest_operator' });
const settings = (DB, fetcher = validSiteverify) => ({ env: { DB, RATE_LIMIT_SECRET: secret, TURNSTILE_SECRET_KEY: turnstileSecret }, fetcher });

function request(fields, options = {}) {
  const { contentType = 'application/json', accept = 'application/json', address = '127.0.0.1' } = options;
  return new Request('https://pathnod.com/api/interest', {
    method: 'POST',
    headers: { 'Content-Type': contentType, Accept: accept, 'CF-Connecting-IP': address },
    body: contentType === 'application/json' ? JSON.stringify(fields) : new URLSearchParams(fields),
  });
}

const beta = { audience: 'beta', email: 'BETA@example.com', iphone: 'yes', country: 'France', consent: 'yes', 'cf-turnstile-response': 'valid-token' };
const operator = { audience: 'operator', email: 'ops@example.com', name: 'Alex', organization: 'Example Network', role: 'Operations', fleetSize: '100-1000', challenge: 'GPS reports are unreliable.', consent: 'yes', 'cf-turnstile-response': 'valid-token' };

test('Cloudflare function persists both form types in D1', async () => {
  const DB = new TestDatabase();
  const betaResponse = await onRequest({ request: request(beta), ...settings(DB) });
  const operatorResponse = await onRequest({ request: request(operator, { address: '127.0.0.2' }), ...settings(DB, validOperatorSiteverify) });
  assert.equal(betaResponse.status, 200);
  assert.equal(operatorResponse.status, 200);
  assert.deepEqual(DB.leads.map((lead) => lead.audience), ['beta', 'operator']);
  assert.equal(DB.leads[0].email, 'beta@example.com');
  assert.equal(DB.leads[1].organization, 'Example Network');
  assert.equal('ip' in DB.leads[0], false);
});

test('Cloudflare function supports native HTML form submission', async () => {
  const DB = new TestDatabase();
  const response = await onRequest({
    request: request(beta, { contentType: 'application/x-www-form-urlencoded', accept: 'text/html' }),
    ...settings(DB),
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/thanks/?type=beta');
  assert.equal(DB.leads.length, 1);
});

test('Cloudflare function fails closed without storage or private secret', async () => {
  const missingStorage = await onRequest({ request: request(beta), env: { RATE_LIMIT_SECRET: secret, TURNSTILE_SECRET_KEY: turnstileSecret } });
  const missingSecret = await onRequest({ request: request(beta), env: { DB: new TestDatabase() } });
  const missingTurnstile = await onRequest({ request: request(beta), env: { DB: new TestDatabase(), RATE_LIMIT_SECRET: secret } });
  assert.equal(missingStorage.status, 503);
  assert.equal(missingSecret.status, 503);
  assert.equal(missingTurnstile.status, 503);
});

test('Cloudflare function rejects invalid and oversized submissions without saving them', async () => {
  const DB = new TestDatabase();
  const invalid = await onRequest({ request: request({ ...beta, consent: 'no' }), ...settings(DB) });
  const oversized = await onRequest({ request: request({ ...beta, country: 'x'.repeat(9_000) }), ...settings(DB) });
  const honeypot = await onRequest({ request: request({ ...beta, website: 'spam' }), ...settings(DB) });
  assert.equal(invalid.status, 400);
  assert.equal(oversized.status, 413);
  assert.equal(honeypot.status, 200);
  assert.equal(DB.leads.length, 0);
});

test('Cloudflare function rate limits repeated submissions per visitor', async () => {
  const DB = new TestDatabase();
  for (let count = 0; count < 5; count++) {
    assert.equal((await onRequest({ request: request(beta), ...settings(DB) })).status, 200);
  }
  assert.equal((await onRequest({ request: request(beta), ...settings(DB) })).status, 429);
  assert.equal(DB.leads.length, 5);
});

test('Cloudflare function rejects missing, invalid, or wrong-domain Turnstile proofs', async () => {
  const DB = new TestDatabase();
  const missing = await onRequest({ request: request({ ...beta, 'cf-turnstile-response': '' }), ...settings(DB) });
  const invalid = await onRequest({ request: request({ ...beta, 'cf-turnstile-response': 'bad' }), ...settings(DB) });
  const wrongDomain = await onRequest({ request: request(beta), ...settings(DB, async () => Response.json({ success: true, hostname: 'attacker.example', action: 'interest_beta' })) });
  const wrongAction = await onRequest({ request: request(beta), ...settings(DB, validOperatorSiteverify) });
  assert.deepEqual([missing.status, invalid.status, wrongDomain.status, wrongAction.status], [400, 400, 400, 400]);
  assert.equal(DB.leads.length, 0);
});

test('Cloudflare function rejects other methods', async () => {
  const response = await onRequest({ request: new Request('https://pathnod.com/api/interest'), env: {} });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});
