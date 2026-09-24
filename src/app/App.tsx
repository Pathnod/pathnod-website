import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { BetaPage } from '../pages/BetaPage';
import { HomePage } from '../pages/HomePage';
import { OperatorsPage } from '../pages/OperatorsPage';
import { ThanksPage } from '../pages/ThanksPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { LegalPage } from '../pages/LegalPage';
import type { Page } from './routes';
import { useScrollReveal } from './useScrollReveal';

export function App({ page }: { page: Page }) {
  useScrollReveal(page);
  const content = {
    home: <HomePage />,
    beta: <BetaPage />,
    operators: <OperatorsPage />,
    thanks: <ThanksPage />,
    privacy: <PrivacyPage />,
    legal: <LegalPage />,
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
