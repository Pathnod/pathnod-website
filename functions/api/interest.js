import { maxBodyBytes, maxSubmissionsPerWindow, validateSubmission, windowMs } from '../../lib/submission.js';

function respond(request, status, message, audience) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ ok: status < 400, message }, { status, headers });
  }
  if (status < 400) {
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: audience ? `/thanks/?type=${audience}` : '/thanks/' },
    });
  }
  return new Response(`Submission failed: ${message}`, {
    status,
    headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function readBody(request) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json' && contentType !== 'application/x-www-form-urlencoded') {
    return { error: 'Unsupported content type.', status: 415 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: 'Invalid form data.', status: 400 };
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBodyBytes) {
        await reader.cancel();
        return { error: 'Payload too large.', status: 413 };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  try {
    return { value: contentType === 'application/json'
      ? JSON.parse(body)
      : Object.fromEntries(new URLSearchParams(body)) };
  } catch {
    return { error: 'Invalid form data.', status: 400 };
  }
}

async function rateLimitKey(address, secret, windowStart) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${windowStart}:${address}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed.', { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const parsed = await readBody(request);
    if (parsed.error) return respond(request, parsed.status, parsed.error);
    const submission = validateSubmission(parsed.value);
    if (submission.ignored) return respond(request, 200, 'Thank you.');
    if (submission.error) return respond(request, 400, submission.error);

    // Fail closed if the persistent store or private rate-limit key is not configured.
    if (!env.DB || typeof env.RATE_LIMIT_SECRET !== 'string' || env.RATE_LIMIT_SECRET.length < 32) {
      return respond(request, 503, 'The form is temporarily unavailable.');
    }
    const address = request.headers.get('CF-Connecting-IP');
    if (!address) return respond(request, 503, 'The form is temporarily unavailable.');

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = await rateLimitKey(address, env.RATE_LIMIT_SECRET, windowStart);
    const attempts = await env.DB.prepare(`
      INSERT INTO submission_rate_limits (key, window_start, attempts)
      VALUES (?1, ?2, 1)
      ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1
      RETURNING attempts
    `).bind(key, windowStart).first('attempts');
    if (!Number.isInteger(attempts)) throw new Error('Rate limit could not be recorded.');
    if (attempts > maxSubmissionsPerWindow) {
      return respond(request, 429, 'Too many submissions. Please try again later.');
    }

    const lead = submission.value;
    await env.DB.prepare(`
      INSERT INTO leads (audience, email, submitted_at, payload)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(lead.audience, lead.email, lead.submittedAt, JSON.stringify(lead)).run();

    // Also prune on active traffic; monthly maintenance covers idle databases.
    try {
      const retentionCutoff = new Date(now);
      retentionCutoff.setUTCFullYear(retentionCutoff.getUTCFullYear() - 1);
      await env.DB.prepare('DELETE FROM leads WHERE submitted_at < ?1')
        .bind(retentionCutoff.toISOString()).run();
    } catch (error) {
      console.error('Lead retention cleanup failed:', error);
    }

    // Keep only recent pseudonymous rate-limit keys; never store a raw IP address.
    if (Math.random() < 0.01) {
      try {
        await env.DB.prepare('DELETE FROM submission_rate_limits WHERE window_start < ?1')
          .bind(now - 24 * 60 * 60 * 1_000).run();
      } catch (error) {
        console.error('Rate-limit cleanup failed:', error);
      }
    }
    return respond(request, 200, 'Thank you. We will be in touch.', lead.audience);
  } catch (error) {
    console.error('Form submission failed:', error);
    return respond(request, 500, 'Please try again later.');
  }
}
