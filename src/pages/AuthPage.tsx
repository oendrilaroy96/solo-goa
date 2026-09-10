import { useState } from 'react';
import { signInWithMagicLink } from '../lib/auth';

export default function AuthPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--t-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <img src="/favicon.png" width={48} height={48} alt="" style={{ display: 'inline-block', marginBottom: 16 }} />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--t-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
            }}
          >
            Trip Planner
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '32px 28px' }}>
          <div className="gold-line" style={{ marginBottom: 28 }} />

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>✉</div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: 'var(--t-fg)',
                  margin: '0 0 12px',
                }}
              >
                Check your email
              </h2>
              <p style={{ fontSize: 13, color: 'var(--t-muted)', lineHeight: 1.6, margin: 0 }}>
                A magic link has been sent to{' '}
                <strong style={{ color: 'var(--t-fg)' }}>{email}</strong>.
                Click it to sign in — no password needed.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                style={{
                  marginTop: 24,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--t-muted)',
                  background: 'transparent',
                  border: '1px solid var(--t-w10)',
                  borderRadius: 3,
                  padding: '8px 20px',
                  cursor: 'pointer',
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: 'var(--t-fg)',
                  margin: '0 0 4px',
                }}
              >
                Sign in
              </h2>
              <p style={{ fontSize: 13, color: 'var(--t-muted)', margin: 0, lineHeight: 1.5 }}>
                Enter your email and we'll send you a magic link.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  htmlFor="auth-email"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--t-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    background: 'var(--t-bg)',
                    border: '1px solid var(--t-w12)',
                    borderRadius: 2,
                    padding: '10px 12px',
                    color: 'var(--t-fg)',
                    fontSize: 14,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <p style={{ color: '#e07070', fontSize: 12, margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: loading ? 'var(--t-muted)' : 'var(--t-bg)',
                  background: loading ? 'var(--t-gold-20)' : 'var(--t-gold)',
                  border: 'none',
                  borderRadius: 3,
                  padding: '12px 24px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                }}
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
