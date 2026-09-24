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

function request(fields, options = {}) {
  const { contentType = 'application/json', accept = 'application/json', address = '127.0.0.1' } = options;
  return new Request('https://pathnod.com/api/interest', {
    method: 'POST',
    headers: { 'Content-Type': contentType, Accept: accept, 'CF-Connecting-IP': address },
    body: contentType === 'application/json' ? JSON.stringify(fields) : new URLSearchParams(fields),
  });
}

const beta = { audience: 'beta', email: 'BETA@example.com', iphone: 'yes', country: 'France', consent: 'yes' };
const operator = { audience: 'operator', email: 'ops@example.com', name: 'Alex', organization: 'Example Network', role: 'Operations', fleetSize: '100-1000', challenge: 'GPS reports are unreliable.', consent: 'yes' };

test('Cloudflare function persists both form types in D1', async () => {
  const DB = new TestDatabase();
  const env = { DB, RATE_LIMIT_SECRET: secret };
  const betaResponse = await onRequest({ request: request(beta), env });
  const operatorResponse = await onRequest({ request: request(operator, { address: '127.0.0.2' }), env });
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
    env: { DB, RATE_LIMIT_SECRET: secret },
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/thanks/?type=beta');
  assert.equal(DB.leads.length, 1);
});

test('Cloudflare function fails closed without storage or private secret', async () => {
  const missingStorage = await onRequest({ request: request(beta), env: { RATE_LIMIT_SECRET: secret } });
  const missingSecret = await onRequest({ request: request(beta), env: { DB: new TestDatabase() } });
  assert.equal(missingStorage.status, 503);
  assert.equal(missingSecret.status, 503);
});

test('Cloudflare function rejects invalid and oversized submissions without saving them', async () => {
  const DB = new TestDatabase();
  const env = { DB, RATE_LIMIT_SECRET: secret };
  const invalid = await onRequest({ request: request({ ...beta, consent: 'no' }), env });
  const oversized = await onRequest({ request: request({ ...beta, country: 'x'.repeat(9_000) }), env });
  const honeypot = await onRequest({ request: request({ ...beta, website: 'spam' }), env });
  assert.equal(invalid.status, 400);
  assert.equal(oversized.status, 413);
  assert.equal(honeypot.status, 200);
  assert.equal(DB.leads.length, 0);
});

test('Cloudflare function rate limits repeated submissions per visitor', async () => {
  const DB = new TestDatabase();
  const env = { DB, RATE_LIMIT_SECRET: secret };
  for (let count = 0; count < 5; count++) {
    assert.equal((await onRequest({ request: request(beta), env })).status, 200);
  }
  assert.equal((await onRequest({ request: request(beta), env })).status, 429);
  assert.equal(DB.leads.length, 5);
});

test('Cloudflare function rejects other methods', async () => {
  const response = await onRequest({ request: new Request('https://pathnod.com/api/interest'), env: {} });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});
