export function PrivacyPage() {
  return (
    <main id="main" className="shell policy-page">
      <p className="eyebrow"><span className="eyebrow-line" /> Your data</p>
      <h1>Privacy notice</h1>
      <p className="policy-intro">This notice explains how the Pathnod beta waitlist and operator research forms use your information. Last updated 24 September 2026.</p>

      <section><h2>Who is responsible?</h2><p>Pathnod is a hackathon project based in France, not an incorporated company. Contact: <a href="mailto:pathnod@protonmail.com">pathnod@protonmail.com</a>. The identity and postal address of the person responsible for the site and its data collection must be completed before public launch; see <a href="/legal/">legal notice</a>.</p></section>
      <section><h2>What we collect and why</h2><p>For the beta waitlist, we collect your email address, whether you have an iPhone, and your country if you provide it. We use these details only to organize beta testing and send related invitations or updates.</p><p>For operator research, we collect your work email, organization, fleet-size range, verification challenge, and optionally your name and role. We use these details only to arrange a research conversation and understand potential operator needs. Participation is voluntary.</p><p>The basis for these contacts is your consent, given with the form checkbox. You can withdraw it at any time by emailing us; withdrawal does not affect processing already carried out.</p></section>
      <section><h2>Security and service providers</h2><p>Cloudflare hosts this site and stores form submissions in a D1 database. Cloudflare Turnstile checks submissions for automated abuse and may process technical information needed for that security check. Our rate limit uses a short-lived, pseudonymous key derived from your IP address; the raw IP address is not saved in the leads database. If you email us, Proton Mail processes that correspondence. We do not use advertising trackers or sell your information.</p></section>
      <section><h2>How long we keep it</h2><p>Form submissions are scheduled for deletion 12 months after submission, unless you ask us to delete them sooner. We review and delete expired records from the database at least monthly. Pseudonymous rate-limit keys expire after 24 hours and are removed during cleanup.</p></section>
      <section><h2>Your choices and rights</h2><p>You may request access, correction, deletion, or a copy of your data, object to processing where applicable, or withdraw your consent by contacting <a href="mailto:pathnod@protonmail.com">pathnod@protonmail.com</a>. If you are in the EU, you can also lodge a complaint with your data-protection authority, including the <a href="https://www.cnil.fr/en/contact-cnil" target="_blank" rel="noopener noreferrer">CNIL</a> in France.</p></section>
    </main>
  );
}
