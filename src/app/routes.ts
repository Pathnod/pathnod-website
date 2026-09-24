export type Page = 'home' | 'beta' | 'operators' | 'thanks' | 'privacy' | 'legal';

export function pageFromPath(pathname: string): Page {
  if (pathname === '/beta' || pathname === '/beta/') return 'beta';
  if (pathname === '/operators' || pathname === '/operators/') return 'operators';
  if (pathname === '/thanks' || pathname === '/thanks/') return 'thanks';
  if (pathname === '/privacy' || pathname === '/privacy/') return 'privacy';
  if (pathname === '/legal' || pathname === '/legal/') return 'legal';
  return 'home';
}
