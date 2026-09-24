const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile({ token, secret, hostname, action, fetcher = fetch }) {
  if (typeof token !== 'string' || !token || token.length > 2048 ||
      typeof secret !== 'string' || !secret || !hostname || !action) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetcher(siteverifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && result.hostname === hostname && result.action === action;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
