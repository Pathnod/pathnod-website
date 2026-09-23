import { createServer as createHttpServer } from 'node:http';
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const defaultPublicDir = path.join(rootDir, 'dist');
const defaultDataDir = path.join(rootDir, '.data');
const maxBodyBytes = 8_192;
const windowMs = 10 * 60 * 1_000;
const maxSubmissionsPerWindow = 5;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function reply(response, status, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function result(response, request, status, message, destination) {
  if (request.headers.accept?.includes('application/json')) {
    reply(response, status, JSON.stringify({ ok: status < 400, message }), 'application/json; charset=utf-8');
    return;
  }
  if (status < 400) {
    response.writeHead(303, { Location: destination, 'Cache-Control': 'no-store' });
    response.end();
    return;
  }
  reply(response, status, `Submission failed: ${message}`);
}

function text(value, maxLength) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean.length <= maxLength ? clean : null;
}

export function validateSubmission(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'Invalid form data.' };
  if (raw.website) return { ignored: true };

  const audience = text(raw.audience, 20);
  const email = text(raw.email, 254)?.toLowerCase();
  if (audience !== 'beta' && audience !== 'operator') return { error: 'Choose an application type.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (raw.consent !== 'yes') return { error: 'Please confirm how we may use your details.' };

  const common = { audience, email, submittedAt: new Date().toISOString() };
  if (audience === 'beta') {
    const iphone = text(raw.iphone, 10);
    const country = text(raw.country ?? '', 80);
    if (!['yes', 'no', 'unsure'].includes(iphone)) return { error: 'Choose an iPhone availability option.' };
    if (country === null) return { error: 'Country is too long.' };
    return { value: { ...common, iphone, country } };
  }

  const name = text(raw.name ?? '', 100);
  const organization = text(raw.organization, 120);
  const role = text(raw.role ?? '', 100);
  const fleetSize = text(raw.fleetSize, 30);
  const challenge = text(raw.challenge, 600);
  if (name === null || role === null || !organization || !challenge ||
      !['under-100', '100-1000', 'over-1000', 'exploring'].includes(fleetSize)) {
    return { error: 'Complete the required operator fields.' };
  }
  return { value: { ...common, name, organization, role, fleetSize, challenge } };
}

async function readBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) throw new Error('Payload too large.');
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  const contentType = request.headers['content-type']?.split(';', 1)[0];
  if (contentType === 'application/json') return JSON.parse(body);
  if (contentType === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(body));
  throw new Error('Unsupported content type.');
}

export function createPathnodServer({ publicDir = defaultPublicDir, dataDir = defaultDataDir, trustProxy = false } = {}) {
  const recentByAddress = new Map();
  const resolvedPublicDir = path.resolve(publicDir);

  return createHttpServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");

    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (pathname === '/api/interest') {
      if (request.method !== 'POST') return reply(response, 405, 'Method not allowed.');
      try {
        const raw = await readBody(request);
        const submission = validateSubmission(raw);
        if (submission.ignored) return result(response, request, 200, 'Thank you.', '/thanks/');
        if (submission.error) return result(response, request, 400, submission.error);

        const forwarded = request.headers['x-forwarded-for'];
        const address = (trustProxy && typeof forwarded === 'string' && forwarded.split(',').at(-1)?.trim()) || request.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const recent = (recentByAddress.get(address) ?? []).filter((time) => now - time < windowMs);
        if (recent.length >= maxSubmissionsPerWindow) return result(response, request, 429, 'Too many submissions. Please try again later.');
        await mkdir(dataDir, { recursive: true, mode: 0o700 });
        await appendFile(path.join(dataDir, 'leads.jsonl'), JSON.stringify(submission.value) + '\n', { mode: 0o600 });
        recent.push(now);
        recentByAddress.set(address, recent);
        if (recentByAddress.size > 1_000) {
          for (const [key, times] of recentByAddress) {
            if (times.every((time) => now - time >= windowMs)) recentByAddress.delete(key);
          }
        }
        return result(response, request, 200, 'Thank you. We will be in touch.', `/thanks/?type=${submission.value.audience}`);
      } catch (error) {
        if (error instanceof SyntaxError) return result(response, request, 400, 'Invalid form data.');
        if (error instanceof Error && error.message === 'Payload too large.') return result(response, request, 413, error.message);
        if (error instanceof Error && error.message === 'Unsupported content type.') return result(response, request, 415, error.message);
        console.error('Form submission failed:', error);
        return result(response, request, 500, 'Please try again later.');
      }
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return reply(response, 405, 'Method not allowed.');
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      return reply(response, 400, 'Invalid path.');
    }
    const candidate = path.resolve(resolvedPublicDir, `.${decodedPath}`);
    if (candidate !== resolvedPublicDir && !candidate.startsWith(resolvedPublicDir + path.sep)) {
      return reply(response, 404, 'Not found.');
    }
    try {
      const filePath = (await stat(candidate)).isDirectory() ? path.join(candidate, 'index.html') : candidate;
      const data = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filePath)] ?? 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch {
      reply(response, 404, 'Not found.');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  createPathnodServer({ dataDir: process.env.DATA_DIR || defaultDataDir, trustProxy: process.env.TRUST_PROXY === 'true' }).listen(port, () => {
    console.log(`Pathnod website listening on http://localhost:${port}`);
  });
}
