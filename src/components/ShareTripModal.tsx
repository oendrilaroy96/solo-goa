import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Trip } from '../lib/trips';

interface Invite {
  id: string;
  invited_email: string;
  role: 'viewer' | 'editor';
  accepted_at: string | null;
}

interface Props {
  trip: Trip;
  onClose: () => void;
}

const INPUT: React.CSSProperties = {
  background: 'var(--t-bg)',
  border: '1px solid var(--t-w12)',
  borderRadius: 3,
  padding: '9px 12px',
  color: 'var(--t-fg)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const LBL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--t-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

export default function ShareTripModal({ trip, onClose }: Props) {
  const [invites, setInvites]     = useState<Invite[]>([]);
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState<'viewer' | 'editor'>('editor');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => {
    supabase
      .from('trip_invites')
      .select('id, invited_email, role, accepted_at')
      .eq('itinerary_id', trip.id)
      .order('created_at')
      .then(({ data, error: e }) => {
        if (e) console.error(e);
        setInvites((data ?? []) as Invite[]);
        setLoading(false);
      });
  }, [trip.id]);

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid email address.'); return; }
    if (invites.some(i => i.invited_email === trimmed)) { setError('This person is already invited.'); return; }
    setError(''); setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: e } = await supabase
      .from('trip_invites')
      .insert({ itinerary_id: trip.id, invited_email: trimmed, role, invited_by: user!.id })
      .select('id, invited_email, role, accepted_at')
      .single();
    setSaving(false);
    if (e) { setError(e.message); return; }
    setInvites(prev => [...prev, data as Invite]);
    setEmail('');
    setSuccess(`Invite sent to ${trimmed}. They'll see this trip when they log in.`);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function handleRemove(id: string) {
    await supabase.from('trip_invites').delete().eq('id', id);
    setInvites(prev => prev.filter(i => i.id !== id));
  }

  async function handleRoleChange(id: string, newRole: 'viewer' | 'editor') {
    await supabase.from('trip_invites').update({ role: newRole }).eq('id', id);
    setInvites(prev => prev.map(i => i.id === id ? { ...i, role: newRole } : i));
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        className="luxury-card"
        style={{ width: '100%', maxWidth: 480, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Share trip
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-fg)' }}>{trip.name}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--t-muted)', lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>

        {/* Invite form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={LBL}>Invite by email</label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
              style={INPUT}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={LBL}>Role</label>
            {(['editor', 'viewer'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
                  border: role === r ? '1px solid var(--t-gold-60)' : '1px solid var(--t-w10)',
                  background: role === r ? 'var(--t-gold-12)' : 'var(--t-w03)',
                  color: role === r ? 'var(--t-gold)' : 'var(--t-muted)',
                }}
              >
                {r === 'editor' ? '✏ Editor' : '👁 Viewer'}
              </button>
            ))}
            <span style={{ fontSize: 11, color: 'var(--t-muted)', marginLeft: 4 }}>
              {role === 'editor' ? 'Can edit the itinerary' : 'Can view only'}
            </span>
          </div>

          {error   && <p style={{ margin: 0, fontSize: 12, color: '#e07070' }}>{error}</p>}
          {success && <p style={{ margin: 0, fontSize: 12, color: 'var(--t-gold)' }}>{success}</p>}

          <button
            type="button"
            onClick={handleInvite}
            disabled={saving || !email.trim()}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: (saving || !email.trim()) ? 'var(--t-muted)' : 'var(--t-bg)',
              background: (saving || !email.trim()) ? 'var(--t-gold-20)' : 'var(--t-gold)',
              border: 'none', borderRadius: 3, padding: '10px 20px',
              cursor: (saving || !email.trim()) ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {saving ? 'Sending…' : '+ Invite'}
          </button>
        </div>

        {/* People list */}
        {loading ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--t-muted)' }}>Loading…</p>
        ) : invites.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              People with access
            </div>
            {invites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--t-w03)', border: '1px solid var(--t-w08)', borderRadius: 3 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--t-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.invited_email}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: inv.accepted_at ? 'var(--t-gold)' : 'var(--t-muted)', marginTop: 2 }}>
                    {inv.accepted_at ? '✓ Accepted' : '⏳ Pending'}
                  </div>
                </div>
                {/* Role toggle */}
                <select
                  value={inv.role}
                  onChange={e => handleRoleChange(inv.id, e.target.value as 'viewer' | 'editor')}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--t-bg)', border: '1px solid var(--t-w10)', borderRadius: 2, padding: '4px 6px', color: 'var(--t-muted)', cursor: 'pointer' }}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="button" onClick={() => handleRemove(inv.id)} title="Remove"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                >×</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
            No one else has access yet. Invite someone above — they'll see this trip as soon as they log in with that email.
          </p>
        )}
      </div>
    </div>
  );
}
