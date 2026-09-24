export type Page = 'home' | 'beta' | 'operators' | 'thanks';

export function pageFromPath(pathname: string): Page {
  if (pathname === '/beta' || pathname === '/beta/') return 'beta';
  if (pathname === '/operators' || pathname === '/operators/') return 'operators';
  if (pathname === '/thanks' || pathname === '/thanks/') return 'thanks';
  return 'home';
}
