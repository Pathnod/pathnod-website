import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { BetaPage } from '../pages/BetaPage';
import { HomePage } from '../pages/HomePage';
import { OperatorsPage } from '../pages/OperatorsPage';
import { ThanksPage } from '../pages/ThanksPage';
import type { Page } from './routes';

export function App({ page }: { page: Page }) {
  const content = {
    home: <HomePage />,
    beta: <BetaPage />,
    operators: <OperatorsPage />,
    thanks: <ThanksPage />,
  }[page];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader page={page} />
      {content}
      <SiteFooter />
    </>
  );
}
