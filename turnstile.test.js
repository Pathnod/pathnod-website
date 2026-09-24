import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyTurnstile } from './lib/turnstile.js';

const input = { token: 'valid-token', secret: 'test-secret', hostname: 'pathnod.com', action: 'interest_beta' };

test('Turnstile verification sends the token to Siteverify and checks hostname and action', async () => {
  let call;
  const verified = await verifyTurnstile({ ...input, fetcher: async (url, options) => {
    call = { url, options };
    return Response.json({ success: true, hostname: 'pathnod.com', action: 'interest_beta' });
  } });
  assert.equal(verified, true);
  assert.equal(call.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(new URLSearchParams(call.options.body).get('response'), 'valid-token');
  assert.equal(new URLSearchParams(call.options.body).get('secret'), 'test-secret');
});

test('Turnstile verification fails closed on missing token, mismatch, or network error', async () => {
  const fetcher = async () => Response.json({ success: true, hostname: 'wrong.example', action: 'interest_beta' });
  assert.equal(await verifyTurnstile({ ...input, token: '', fetcher }), false);
  assert.equal(await verifyTurnstile({ ...input, fetcher }), false);
  assert.equal(await verifyTurnstile({ ...input, fetcher: async () => { throw new Error('offline'); } }), false);
});
