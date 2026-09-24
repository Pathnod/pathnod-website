export const maxBodyBytes = 8_192;
export const windowMs = 10 * 60 * 1_000;
export const maxSubmissionsPerWindow = 5;

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
