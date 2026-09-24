import { useCallback, useState, type SubmitEvent } from 'react';
import { TurnstileCheck } from './TurnstileCheck';

type Audience = 'beta' | 'operator';

interface ApiResponse {
  ok?: boolean;
  message?: string;
}

export function InterestForm({ audience }: { audience: Audience }) {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const receiveToken = useCallback((token: string) => setTurnstileToken(token), []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || submitting || !turnstileToken) return;

    const fields = Object.fromEntries(new FormData(form));
    fields['cf-turnstile-response'] = turnstileToken;
    setSubmitting(true);
    setStatus('Sending your details…');

    try {
      const response = await fetch('/api/interest', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'Please try again.');
      window.location.assign(`/thanks/?type=${audience}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Please try again later.');
      setSubmitting(false);
      setTurnstileToken('');
      setVerificationAttempt((attempt) => attempt + 1);
    }
  }

  return (
    <form method="post" action="/api/interest" onSubmit={handleSubmit}>
      <input type="hidden" name="audience" value={audience} />
      <div className="honeypot" aria-hidden="true"><label htmlFor={`${audience}-website`}>Website</label><input id={`${audience}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      {audience === 'beta' ? <BetaFields /> : <OperatorFields />}
      <label className="consent-row">
        <input type="checkbox" name="consent" value="yes" required />
        <span>{audience === 'beta'
          ? 'I agree that Pathnod may store these details and contact me about beta testing. I can decline an invitation at any time. *'
          : 'I agree that Pathnod may store these details and contact me about this research conversation. Participation is voluntary. *'} Read our <a href="/privacy/">privacy notice</a>.</span>
      </label>
      <TurnstileCheck key={verificationAttempt} action={`interest_${audience}`} onToken={receiveToken} />
      <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />
      <button className="form-submit" type="submit" disabled={submitting || !turnstileToken}>
        <span>{audience === 'beta' ? 'Join the beta waitlist' : 'Request a conversation'}</span><span aria-hidden="true">↗</span>
      </button>
      <p className="form-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}

function BetaFields() {
  return (
    <>
      <div className="field"><label htmlFor="beta-email">Email address *</label><input id="beta-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /><small>Only for beta invitations and updates related to this test.</small></div>
      <fieldset className="field fieldset-options"><legend>Do you have an iPhone available for testing? *</legend><div className="radio-row">
        <label className="radio-card"><input type="radio" name="iphone" value="yes" required /> Yes</label>
        <label className="radio-card"><input type="radio" name="iphone" value="no" /> No</label>
        <label className="radio-card"><input type="radio" name="iphone" value="unsure" /> Not sure</label>
      </div></fieldset>
      <div className="field"><label htmlFor="beta-country">Country <small>(optional)</small></label><input id="beta-country" name="country" type="text" autoComplete="country-name" maxLength={80} placeholder="Where would you test from?" /></div>
    </>
  );
}

function OperatorFields() {
  return (
    <>
      <div className="form-row"><div className="field"><label htmlFor="operator-name">Name <small>(optional)</small></label><input id="operator-name" name="name" type="text" autoComplete="name" maxLength={100} placeholder="Your name" /></div><div className="field"><label htmlFor="operator-email">Work email *</label><input id="operator-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@network.com" /></div></div>
      <div className="form-row"><div className="field"><label htmlFor="operator-org">Organization *</label><input id="operator-org" name="organization" type="text" autoComplete="organization" required maxLength={120} placeholder="Network or company" /></div><div className="field"><label htmlFor="operator-role">Your role <small>(optional)</small></label><input id="operator-role" name="role" type="text" autoComplete="organization-title" maxLength={100} placeholder="e.g. Network operations" /></div></div>
      <div className="field"><label htmlFor="operator-fleet">How many physical devices do you operate? *</label><select id="operator-fleet" name="fleetSize" required defaultValue=""><option value="" disabled>Select a range</option><option value="under-100">Fewer than 100</option><option value="100-1000">100–1,000</option><option value="over-1000">More than 1,000</option><option value="exploring">Exploring / not yet deployed</option></select></div>
      <div className="field"><label htmlFor="operator-challenge">What is your biggest verification challenge? *</label><textarea id="operator-challenge" name="challenge" required maxLength={600} placeholder="How do you know devices are present, active, and where they claim to be?" /></div>
    </>
  );
}
