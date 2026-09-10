import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Props {
  user: User;
}

export default function SetNamePage({ user }: Props) {
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setSaving(false);
    if (err) setError(err.message);
    // On success, onAuthStateChange in App.tsx fires and re-renders with updated user
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px', background: 'var(--t-bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/favicon.png" width={48} height={48} alt="" style={{ display: 'inline-block', marginBottom: 14 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
            TripTinker
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '32px 28px' }}>
          <div className="gold-line" style={{ marginBottom: 28 }} />

          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--t-fg)', margin: '0 0 8px' }}>
            Welcome!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            You're signed in as <strong style={{ color: 'var(--t-fg)' }}>{user.email}</strong>.<br />
            What should we call you?
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="full-name"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                Your name
              </label>
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Oendrila"
                required
                style={{
                  background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2,
                  padding: '10px 12px', color: 'var(--t-fg)', fontSize: 14,
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && <p style={{ color: '#e07070', fontSize: 12, margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: saving ? 'var(--t-muted)' : 'var(--t-bg)',
                background: saving ? 'var(--t-gold-20)' : 'var(--t-gold)',
                border: 'none', borderRadius: 3, padding: '12px 24px',
                cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
              }}
            >
              {saving ? 'Saving…' : 'Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
