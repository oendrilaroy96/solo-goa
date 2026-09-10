import { useState, useEffect } from 'react';
import { listTrips, createTrip, deleteTrip } from '../lib/trips';
import type { Trip } from '../lib/trips';

const BLANK_FORM = () => ({
  name: '',
  destination: '',
  date_from: '',
  date_to: '',
  cover_emoji: '✈',
});

interface Props {
  onSelectTrip: (trip: Trip) => void;
}

export default function DashboardPage({ onSelectTrip }: Props) {
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState(BLANK_FORM());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchTrips() {
    const data = await listTrips();
    setTrips(data);
    setLoading(false);
  }

  useEffect(() => { fetchTrips(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const trip = await createTrip({
      name: form.name.trim(),
      destination: form.destination.trim(),
      date_from: form.date_from,
      date_to: form.date_to,
      cover_emoji: form.cover_emoji.trim() || '✈',
    });
    setCreating(false);
    if (trip) {
      setForm(BLANK_FORM());
      setShowForm(false);
      setTrips(prev => [trip, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    await deleteTrip(id);
    setDeleteConfirm(null);
    setTrips(prev => prev.filter(t => t.id !== id));
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--t-bg)',
    border: '1px solid var(--t-w12)',
    borderRadius: 2,
    padding: '9px 12px',
    color: 'var(--t-fg)',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--t-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--t-bg)',
        padding: '40px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <img src="/favicon.png" width={36} height={36} alt="" />
            <span
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
            </span>
          </div>
          <div className="gold-line" />
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 28,
                  color: 'var(--t-fg)',
                  margin: 0,
                }}
              >
                Your trips
              </h1>
              <p style={{ fontSize: 13, color: 'var(--t-muted)', margin: '6px 0 0' }}>
                Select a trip to open it, or create a new one.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(f => !f)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--t-gold)',
                background: 'var(--t-gold-10)',
                border: '1px solid var(--t-gold-30)',
                borderRadius: 3,
                padding: '8px 16px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {showForm ? 'Cancel' : '+ New trip'}
            </button>
          </div>
        </div>

        {/* New trip form */}
        {showForm && (
          <div
            className="luxury-card"
            style={{ padding: '24px', marginBottom: 32 }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 18,
                color: 'var(--t-fg)',
                margin: '0 0 20px',
              }}
            >
              New trip
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Trip name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Goa September 2026"
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Emoji</label>
                  <input
                    type="text"
                    value={form.cover_emoji}
                    onChange={e => setForm(f => ({ ...f, cover_emoji: e.target.value }))}
                    placeholder="✈"
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 20 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Destination</label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="e.g. Goa, India"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>From</label>
                  <input
                    type="text"
                    value={form.date_from}
                    onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))}
                    placeholder="e.g. 14 Sep"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>To</label>
                  <input
                    type="text"
                    value={form.date_to}
                    onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))}
                    placeholder="e.g. 18 Sep"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(BLANK_FORM()); }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--t-muted)',
                    background: 'transparent',
                    border: '1px solid var(--t-w10)',
                    borderRadius: 3,
                    padding: '9px 18px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: creating ? 'var(--t-muted)' : 'var(--t-bg)',
                    background: creating ? 'var(--t-gold-20)' : 'var(--t-gold)',
                    border: 'none',
                    borderRadius: 3,
                    padding: '9px 22px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Creating…' : 'Create trip'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trip list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--t-muted)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Loading…
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--t-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✈</div>
            <p style={{ fontSize: 15, color: 'var(--t-fg)', marginBottom: 8 }}>No trips yet</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
              Tap <strong style={{ color: 'var(--t-gold)' }}>+ New trip</strong> to plan your first adventure.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                className="luxury-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                }}
              >
                {/* Emoji */}
                <div
                  style={{
                    fontSize: 32,
                    lineHeight: 1,
                    flexShrink: 0,
                    width: 48,
                    textAlign: 'center',
                  }}
                >
                  {trip.cover_emoji || '✈'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--t-fg)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 3,
                    }}
                  >
                    {trip.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--t-muted)',
                    }}
                  >
                    {trip.destination && <span>{trip.destination}</span>}
                    {trip.destination && (trip.date_from || trip.date_to) && <span style={{ margin: '0 6px' }}>·</span>}
                    {(trip.date_from || trip.date_to) && (
                      <span>{trip.date_from}{trip.date_from && trip.date_to ? '–' : ''}{trip.date_to}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {deleteConfirm === trip.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--t-muted)',
                          background: 'transparent',
                          border: '1px solid var(--t-w10)',
                          borderRadius: 3,
                          padding: '6px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(trip.id)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#e07070',
                          background: 'rgba(224,112,112,.08)',
                          border: '1px solid rgba(224,112,112,.3)',
                          borderRadius: 3,
                          padding: '6px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectTrip(trip)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--t-gold)',
                          background: 'var(--t-gold-10)',
                          border: '1px solid var(--t-gold-30)',
                          borderRadius: 3,
                          padding: '7px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(trip.id)}
                        aria-label={`Delete ${trip.name}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 14,
                          color: 'var(--t-muted)',
                          background: 'var(--t-w04)',
                          border: '1px solid var(--t-w10)',
                          borderRadius: 3,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
