import { useState, useEffect, useRef, useCallback } from 'react';
import { listTrips, createTrip, deleteTrip } from '../lib/trips';
import type { Trip, TripType } from '../lib/trips';
import { supabase } from '../lib/supabase';

// ── Trip type options ───────────────────────────────────────────────────────
const TRIP_TYPES: { value: TripType; label: string; icon: string }[] = [
  { value: 'solo',    label: 'Solo',    icon: '🧍' },
  { value: 'couple',  label: 'Couple',  icon: '👫' },
  { value: 'friends', label: 'Friends', icon: '👯' },
  { value: 'family',  label: 'Family',  icon: '👨‍👩‍👧' },
  { value: 'work',    label: 'Work',    icon: '💼' },
];

// ── Travel emoji palette ────────────────────────────────────────────────────
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Transport',
    emojis: ['✈️', '🚂', '🚢', '🚁', '🛺', '🛵', '🚗', '🏍️', '🚤', '🛸'],
  },
  {
    label: 'Places',
    emojis: ['🏖️', '🏝️', '🏔️', '🌋', '🏛️', '🕌', '⛩️', '🗼', '🗽', '🏰', '🏯', '🕍', '🛕'],
  },
  {
    label: 'Nature',
    emojis: ['🌊', '🌅', '🌄', '🌿', '🌺', '🌴', '🦋', '🐘', '🦁', '🌌', '🏕️', '🌁'],
  },
  {
    label: 'Activities',
    emojis: ['🤿', '🧗', '🎨', '🎪', '🎭', '🎡', '🎢', '📸', '🗺️', '🎒', '🥂', '🍹', '🍜'],
  },
  {
    label: 'Vibes',
    emojis: ['🌍', '🌏', '🌎', '🌃', '🌆', '🌇', '🌉', '🎑', '⛺', '🎠', '🏟️', '🎿', '🧳'],
  },
];

const BLANK_FORM = () => ({
  name: '',
  destination: '',
  date_from: '',
  date_to: '',
  cover_emoji: '✈️',
  cover_image: '',
  trip_type: '' as TripType | '',
  people_count: 1,
});

interface LocationSuggestion {
  display_name: string;
  place_id: number;
}

interface Props {
  onSelectTrip: (trip: Trip) => void;
}

export default function DashboardPage({ onSelectTrip }: Props) {
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [form, setForm]               = useState(BLANK_FORM());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Location autocomplete
  const [locationQuery, setLocationQuery]           = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationDrop, setShowLocationDrop]     = useState(false);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [coverTab, setCoverTab]               = useState<'emoji' | 'upload'>('emoji');
  const [uploadingCover, setUploadingCover]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchTrips() {
    const data = await listTrips();
    setTrips(data);
    setLoading(false);
  }

  useEffect(() => { fetchTrips(); }, []);

  // ── Location search ─────────────────────────────────────────────────────
  const searchLocation = useCallback((q: string) => {
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    if (!q.trim()) { setLocationSuggestions([]); return; }
    locationDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setLocationSuggestions(data);
        setShowLocationDrop(true);
      } catch { /* ignore */ }
    }, 400);
  }, []);

  function handleLocationInput(val: string) {
    setLocationQuery(val);
    setForm(f => ({ ...f, destination: val }));
    searchLocation(val);
  }

  function pickLocation(s: LocationSuggestion) {
    // Shorten "City, State, Country" to first 2–3 parts
    const parts = s.display_name.split(',').map(p => p.trim());
    const short = parts.slice(0, 3).join(', ');
    setLocationQuery(short);
    setForm(f => ({ ...f, destination: short }));
    setLocationSuggestions([]);
    setShowLocationDrop(false);
  }

  // ── Cover image upload ───────────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    setUploadingCover(true);
    const ext = file.name.split('.').pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('trip-covers').upload(path, file, { upsert: true });
    if (error) {
      console.error('[imageUpload]', error);
      alert('Upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('trip-covers').getPublicUrl(path);
      setForm(f => ({ ...f, cover_image: data.publicUrl, cover_emoji: '' }));
    }
    setUploadingCover(false);
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const trip = await createTrip({
      name:         form.name.trim(),
      destination:  form.destination.trim(),
      date_from:    form.date_from,
      date_to:      form.date_to,
      cover_emoji:  form.cover_emoji || '✈️',
      cover_image:  form.cover_image || undefined,
      trip_type:    (form.trip_type as TripType) || undefined,
      people_count: form.people_count || 1,
    });
    setCreating(false);
    if (trip) {
      setForm(BLANK_FORM());
      setLocationQuery('');
      setShowForm(false);
      setShowEmojiPicker(false);
      setTrips(prev => [trip, ...prev]);
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────
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

  const coverPreview = form.cover_image
    ? <img src={form.cover_image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
    : <span style={{ fontSize: 30 }}>{form.cover_emoji || '✈️'}</span>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-bg)', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <img src="/favicon.png" width={36} height={36} alt="" />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-gold)',
              textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600,
            }}>
              TripTinker
            </span>
          </div>
          <div className="gold-line" />
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--t-fg)', margin: 0 }}>
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
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--t-gold)', background: 'var(--t-gold-10)',
                border: '1px solid var(--t-gold-30)', borderRadius: 3,
                padding: '8px 16px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {showForm ? 'Cancel' : '+ New trip'}
            </button>
          </div>
        </div>

        {/* ── New trip form ─────────────────────────────────────────────── */}
        {showForm && (
          <div className="luxury-card" style={{ padding: '24px', marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--t-fg)', margin: '0 0 20px' }}>
              New trip
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cover + Trip name row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>

                {/* Cover button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <label style={labelStyle}>Cover</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    style={{
                      width: 56, height: 40, borderRadius: 4,
                      border: '1px solid var(--t-w12)',
                      background: 'var(--t-bg)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                    title="Pick emoji or upload logo"
                  >
                    {coverPreview}
                  </button>
                </div>

                {/* Trip name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
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
              </div>

              {/* Emoji / logo picker panel */}
              {showEmojiPicker && (
                <div style={{
                  border: '1px solid var(--t-w12)', borderRadius: 6,
                  background: 'var(--t-card)', padding: 16,
                }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {(['emoji', 'upload'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCoverTab(tab)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          padding: '5px 12px', borderRadius: 3,
                          cursor: 'pointer',
                          color: coverTab === tab ? 'var(--t-gold)' : 'var(--t-muted)',
                          background: coverTab === tab ? 'var(--t-gold-08)' : 'transparent',
                          border: coverTab === tab ? '1px solid var(--t-gold-20)' : '1px solid var(--t-w08)',
                        }}
                      >
                        {tab === 'emoji' ? '😊 Emoji' : '🖼 Upload logo'}
                      </button>
                    ))}
                  </div>

                  {coverTab === 'emoji' && (
                    <div>
                      {EMOJI_GROUPS.map(group => (
                        <div key={group.label} style={{ marginBottom: 12 }}>
                          <div style={{ ...labelStyle, marginBottom: 6 }}>{group.label}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {group.emojis.map(em => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => {
                                  setForm(f => ({ ...f, cover_emoji: em, cover_image: '' }));
                                  setShowEmojiPicker(false);
                                }}
                                style={{
                                  fontSize: 22, lineHeight: 1,
                                  width: 38, height: 38,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  borderRadius: 4, cursor: 'pointer',
                                  border: form.cover_emoji === em && !form.cover_image
                                    ? '2px solid var(--t-gold)'
                                    : '1px solid var(--t-w08)',
                                  background: form.cover_emoji === em && !form.cover_image
                                    ? 'var(--t-gold-08)'
                                    : 'var(--t-bg)',
                                }}
                                title={em}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {coverTab === 'upload' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 12, color: 'var(--t-muted)', margin: 0 }}>
                        Upload a logo or photo for this trip. PNG/JPG, max 200 KB.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 200 * 1024) {
                            alert('Image must be under 200 KB');
                            e.target.value = '';
                            return;
                          }
                          handleImageUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingCover}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'var(--t-fg)', background: 'var(--t-w04)',
                          border: '1px dashed var(--t-w15)',
                          borderRadius: 3, padding: '10px 18px',
                          cursor: uploadingCover ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {uploadingCover ? 'Uploading…' : '↑ Choose image'}
                      </button>
                      {form.cover_image && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={form.cover_image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cover_image: '', cover_emoji: '✈️' }))}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 10,
                              color: 'var(--t-muted)', background: 'transparent',
                              border: '1px solid var(--t-w10)', borderRadius: 3,
                              padding: '4px 10px', cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Location autocomplete */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
                <label style={labelStyle}>Destination</label>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={e => handleLocationInput(e.target.value)}
                  onFocus={() => locationSuggestions.length > 0 && setShowLocationDrop(true)}
                  onBlur={() => setTimeout(() => setShowLocationDrop(false), 150)}
                  placeholder="Search city or place…"
                  style={inputStyle}
                  autoComplete="off"
                />
                {showLocationDrop && locationSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--t-card)', border: '1px solid var(--t-w12)',
                    borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    marginTop: 2,
                  }}>
                    {locationSuggestions.map(s => (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={() => pickLocation(s)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '9px 12px', fontSize: 13, color: 'var(--t-fg)',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--t-w08)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Trip type + people count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>Trip type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TRIP_TYPES.map(tt => (
                      <button
                        key={tt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, trip_type: f.trip_type === tt.value ? '' : tt.value }))}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          padding: '6px 12px', borderRadius: 3, cursor: 'pointer',
                          letterSpacing: '0.06em',
                          color: form.trip_type === tt.value ? 'var(--t-gold)' : 'var(--t-muted)',
                          background: form.trip_type === tt.value ? 'var(--t-gold-08)' : 'var(--t-w04)',
                          border: form.trip_type === tt.value ? '1px solid var(--t-gold-30)' : '1px solid var(--t-w10)',
                        }}
                      >
                        {tt.icon} {tt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>People</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, people_count: Math.max(1, (f.people_count ?? 1) - 1) }))}
                      style={{
                        width: 32, height: 38, fontSize: 18, lineHeight: 1,
                        border: '1px solid var(--t-w12)', borderRadius: 3,
                        background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer',
                      }}
                    >−</button>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                      color: 'var(--t-fg)', minWidth: 28, textAlign: 'center',
                    }}>
                      {form.people_count}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, people_count: (f.people_count ?? 1) + 1 }))}
                      style={{
                        width: 32, height: 38, fontSize: 18, lineHeight: 1,
                        border: '1px solid var(--t-w12)', borderRadius: 3,
                        background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer',
                      }}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>From</label>
                  <input
                    type="date"
                    value={form.date_from}
                    onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>To</label>
                  <input
                    type="date"
                    value={form.date_to}
                    min={form.date_from}
                    onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(BLANK_FORM()); setLocationQuery(''); setShowEmojiPicker(false); }}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--t-muted)', background: 'transparent',
                    border: '1px solid var(--t-w10)', borderRadius: 3,
                    padding: '9px 18px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: creating ? 'var(--t-muted)' : 'var(--t-bg)',
                    background: creating ? 'var(--t-gold-20)' : 'var(--t-gold)',
                    border: 'none', borderRadius: 3, padding: '9px 22px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Creating…' : 'Create trip'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Trip list ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--t-muted)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Loading…
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--t-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✈️</div>
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
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px' }}
              >
                {/* Cover */}
                <div style={{
                  width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--t-gold-08)', fontSize: 28,
                }}>
                  {trip.cover_image
                    ? <img src={trip.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (trip.cover_emoji || '✈️')
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 600, color: 'var(--t-fg)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3,
                  }}>
                    {trip.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)' }}>
                    {trip.destination && <span>{trip.destination}</span>}
                    {trip.destination && (trip.date_from || trip.date_to) && <span style={{ margin: '0 6px' }}>·</span>}
                    {(trip.date_from || trip.date_to) && (
                      <span>
                        {trip.date_from ? new Date(trip.date_from + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' }) : ''}
                        {trip.date_from && trip.date_to ? ' – ' : ''}
                        {trip.date_to ? new Date(trip.date_to + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    )}
                    {(trip.trip_type || trip.people_count) && <span style={{ margin: '0 6px' }}>·</span>}
                    {trip.trip_type && <span style={{ textTransform: 'capitalize' }}>{TRIP_TYPES.find(t => t.value === trip.trip_type)?.icon} {trip.trip_type}</span>}
                    {trip.people_count && trip.people_count > 1 && <span style={{ marginLeft: 6 }}>· {trip.people_count} people</span>}
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
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: 'var(--t-muted)', background: 'transparent',
                          border: '1px solid var(--t-w10)', borderRadius: 3,
                          padding: '6px 12px', cursor: 'pointer',
                        }}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await deleteTrip(trip.id); setDeleteConfirm(null); setTrips(prev => prev.filter(t => t.id !== trip.id)); }}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: '#e07070', background: 'rgba(224,112,112,.08)',
                          border: '1px solid rgba(224,112,112,.3)', borderRadius: 3,
                          padding: '6px 12px', cursor: 'pointer',
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
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'var(--t-gold)', background: 'var(--t-gold-10)',
                          border: '1px solid var(--t-gold-30)', borderRadius: 3,
                          padding: '7px 16px', cursor: 'pointer',
                        }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(trip.id)}
                        aria-label={`Delete ${trip.name}`}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 14,
                          color: 'var(--t-muted)', background: 'var(--t-w04)',
                          border: '1px solid var(--t-w10)', borderRadius: 3,
                          padding: '6px 10px', cursor: 'pointer', lineHeight: 1,
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
