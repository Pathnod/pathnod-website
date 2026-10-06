export function StepSymbol({ kind }: { kind: 'discover' | 'challenge' | 'signals' }) {
  return <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true" focusable="false">
    {kind === 'discover' ? <><circle cx="32" cy="32" r="24" /><circle cx="32" cy="32" r="12" /><circle cx="32" cy="32" r="2" /></> : kind === 'challenge' ? <path d="M10 20 32 34V20l22 14v10L32 30v14L10 30Z" fill="currentColor" stroke="none" /> : <path d="M32 8v48M8 32h48M15 15l34 34M15 49l34-34" />}
  </svg>;
}
