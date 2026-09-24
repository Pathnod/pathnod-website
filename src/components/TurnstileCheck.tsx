import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Verification unavailable.'));
    script.onerror = () => reject(new Error('Verification unavailable.'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptPromise = undefined;
    throw error;
  });
  return scriptPromise;
}

export function TurnstileCheck({ action, onToken }: { action: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const siteKey = document.querySelector<HTMLMetaElement>('meta[name="turnstile-site-key"]')?.content;
    if (!siteKey || siteKey.includes('%VITE_TURNSTILE_SITE_KEY%')) {
      setError('Verification is not configured yet.');
      return;
    }
    let cancelled = false;
    let widgetId: string | undefined;
    loadTurnstile().then((api) => {
      if (cancelled || !container.current) return;
      widgetId = api.render(container.current, {
        sitekey: siteKey,
        action,
        responseField: false,
        callback: (token: string) => { setError(''); onToken(token); },
        'expired-callback': () => onToken(''),
        'error-callback': () => { onToken(''); setError('Verification failed. Please retry.'); },
      });
    }).catch(() => { if (!cancelled) setError('Verification unavailable. Please reload the page.'); });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onToken('');
    };
  }, [action, onToken]);

  return <div className="turnstile-check"><div ref={container} /><p role="status">{error}</p></div>;
}
