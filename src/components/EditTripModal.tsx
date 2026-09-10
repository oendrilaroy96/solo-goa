import { useState, useRef, useCallback } from 'react';
import type { Trip, TripType } from '../lib/trips';
import { updateTrip } from '../lib/trips';
import { supabase } from '../lib/supabase';

const TRAVEL_MODES: { value: string; label: string; icon: string }[] = [
  { value: 'flight', label: 'Flight',  icon: '✈️' },
  { value: 'train',  label: 'Train',   icon: '🚂' },
  { value: 'bus',    label: 'Bus',     icon: '🚌' },
  { value: 'car',    label: 'Car',     icon: '🚗' },
  { value: 'ferry',  label: 'Ferry',   icon: '🚢' },
];

const TRIP_TYPES: { value: TripType; label: string; icon: string }[] = [
  { value: 'solo',    label: 'Solo',    icon: '🧍' },
  { value: 'couple',  label: 'Couple',  icon: '👫' },
  { value: 'friends', label: 'Friends', icon: '👯' },
  { value: 'family',  label: 'Family',  icon: '👨‍👩‍👧' },
  { value: 'work',    label: 'Work',    icon: '💼' },
];

const EMOJI_GROUPS = [
  { label: 'Transport',  emojis: ['✈️','🚂','🚢','🚁','🛺','🛵','🚗','🏍️','🚤','🛸'] },
  { label: 'Places',     emojis: ['🏖️','🏝️','🏔️','🌋','🏛️','🕌','⛩️','🗼','🗽','🏰','🏯','🕍','🛕'] },
  { label: 'Nature',     emojis: ['🌊','🌅','🌄','🌿','🌺','🌴','🦋','🐘','🦁','🌌','🏕️','🌁'] },
  { label: 'Activities', emojis: ['🤿','🧗','🎨','🎪','🎭','🎡','🎢','📸','🗺️','🎒','🥂','🍹','🍜'] },
  { label: 'Vibes',      emojis: ['🌍','🌏','🌎','🌃','🌆','🌇','🌉','🎑','⛺','🎠','🏟️','🎿','🧳'] },
];

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const [a, b] = code.toUpperCase();
  return String.fromCodePoint(0x1F1E6 + (a.charCodeAt(0) - 65)) +
         String.fromCodePoint(0x1F1E6 + (b.charCodeAt(0) - 65));
}

interface LocationSuggestion {
  display_name: string;
  place_id: number;
  lat?: string;
  lon?: string;
  address?: {
    city?: string; town?: string; village?: string; county?: string;
    suburb?: string; state?: string; region?: string;
    country?: string; country_code?: string;
  };
}

interface Props {
  trip: Trip;
  onClose: () => void;
  onSave: (updated: Trip) => void;
}

export default function EditTripModal({ trip, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name:             trip.name,
    destination:      trip.destination ?? '',
    date_from:        trip.date_from ?? '',
    date_to:          trip.date_to ?? '',
    cover_emoji:      trip.cover_emoji ?? '✈️',
    cover_image:      trip.cover_image ?? '',
    trip_type:        (trip.trip_type ?? '') as TripType | '',
    people_count:     trip.people_count ?? 1,
    geo_country:      trip.geo_country ?? '',
    geo_country_code: trip.geo_country_code ?? '',
    geo_state:        trip.geo_state ?? '',
    geo_city:         trip.geo_city ?? '',
    geo_lat:          trip.geo_lat ?? null as number | null,
    geo_lon:          trip.geo_lon ?? null as number | null,
    travel_mode: (trip.travel_mode ?? '') as 'flight' | 'train' | 'bus' | 'car' | 'ferry' | '',
    travel_from: trip.travel_from ?? '',
  });
  const [locQuery, setLocQuery]           = useState(trip.destination ?? '');
  const [suggestions, setSuggestions]     = useState<LocationSuggestion[]>([]);
  const [showDrop, setShowDrop]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [coverTab, setCoverTab]           = useState<'emoji' | 'upload'>('emoji');
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocation = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(await res.json());
        setShowDrop(true);
      } catch { /* ignore */ }
    }, 400);
  }, []);

  function pickLocation(s: LocationSuggestion) {
    const parts = s.display_name.split(',').map(p => p.trim());
    const short = parts.slice(0, 3).join(', ');
    const addr  = s.address ?? {};
    const city  = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.suburb ?? '';
    const state = addr.state ?? addr.region ?? '';
    setLocQuery(short);
    setForm(f => ({
      ...f,
      destination: short,
      geo_country: addr.country ?? '', geo_country_code: addr.country_code ?? '',
      geo_state: state, geo_city: city,
      geo_lat: s.lat ? parseFloat(s.lat) : null,
      geo_lon: s.lon ? parseFloat(s.lon) : null,
    }));
    setSuggestions([]); setShowDrop(false);
  }

  async function handleImageUpload(file: File) {
    setUploadingCover(true);
    const ext  = file.name.split('.').pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('trip-covers').upload(path, file, { upsert: true });
    if (error) { alert('Upload failed: ' + error.message); }
    else {
      const { data } = supabase.storage.from('trip-covers').getPublicUrl(path);
      setForm(f => ({ ...f, cover_image: data.publicUrl, cover_emoji: '' }));
    }
    setUploadingCover(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await updateTrip(trip.id, {
      name:             form.name.trim(),
      destination:      form.destination,
      date_from:        form.date_from,
      date_to:          form.date_to,
      cover_emoji:      form.cover_emoji || '✈️',
      cover_image:      form.cover_image || undefined,
      trip_type:        (form.trip_type as TripType) || undefined,
      people_count:     form.people_count,
      geo_country:      form.geo_country  || undefined,
      geo_country_code: form.geo_country_code || undefined,
      geo_state:        form.geo_state    || undefined,
      geo_city:         form.geo_city     || undefined,
      geo_lat:          form.geo_lat      ?? undefined,
      geo_lon:          form.geo_lon      ?? undefined,
      travel_mode: (form.travel_mode as Trip['travel_mode']) || undefined,
      travel_from: form.travel_from || undefined,
    });
    setSaving(false);
    onSave({
      ...trip,
      name: form.name.trim(), destination: form.destination,
      date_from: form.date_from, date_to: form.date_to,
      cover_emoji: form.cover_emoji || '✈️', cover_image: form.cover_image || undefined,
      trip_type: (form.trip_type as TripType) || undefined,
      people_count: form.people_count,
      geo_country: form.geo_country || undefined, geo_country_code: form.geo_country_code || undefined,
      geo_state: form.geo_state || undefined, geo_city: form.geo_city || undefined,
      geo_lat: form.geo_lat ?? undefined, geo_lon: form.geo_lon ?? undefined,
      travel_mode: (form.travel_mode as Trip['travel_mode']) || undefined,
      travel_from: form.travel_from || undefined,
    });
  }

  const lbl: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };
  const inp: React.CSSProperties = {
    background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2,
    padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  const coverPreview = form.cover_image
    ? <img src={form.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : <span style={{ fontSize: 28 }}>{form.cover_emoji || '✈️'}</span>;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="luxury-card" style={{ width: '100%', maxWidth: 540, padding: 'clamp(20px, 5vw, 32px)', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--t-fg)', margin: 0 }}>Edit trip</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cover + name */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
              <label style={lbl}>Cover</label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(p => !p)}
                style={{ width: 56, height: 40, borderRadius: 4, border: '1px solid var(--t-w12)', background: 'var(--t-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
              >
                {coverPreview}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
              <label style={lbl}>Trip name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={inp} />
            </div>
          </div>

          {/* Emoji / upload picker */}
          {showEmojiPicker && (
            <div style={{ border: '1px solid var(--t-w12)', borderRadius: 6, background: 'var(--t-card)', padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {(['emoji', 'upload'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setCoverTab(tab)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 3, cursor: 'pointer', color: coverTab === tab ? 'var(--t-gold)' : 'var(--t-muted)', background: coverTab === tab ? 'var(--t-gold-08)' : 'transparent', border: coverTab === tab ? '1px solid var(--t-gold-20)' : '1px solid var(--t-w08)' }}>
                    {tab === 'emoji' ? '😊 Emoji' : '🖼 Upload'}
                  </button>
                ))}
              </div>
              {coverTab === 'emoji' && EMOJI_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 10 }}>
                  <div style={{ ...lbl, marginBottom: 6 }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {group.emojis.map(em => (
                      <button key={em} type="button"
                        onClick={() => { setForm(f => ({ ...f, cover_emoji: em, cover_image: '' })); setShowEmojiPicker(false); }}
                        style={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', border: form.cover_emoji === em && !form.cover_image ? '2px solid var(--t-gold)' : '1px solid var(--t-w08)', background: form.cover_emoji === em && !form.cover_image ? 'var(--t-gold-08)' : 'var(--t-bg)' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {coverTab === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--t-muted)', margin: 0 }}>PNG/JPG, max 200 KB.</p>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 200 * 1024) { alert('Image must be under 200 KB'); e.target.value = ''; return; }
                      handleImageUpload(file);
                    }} />
                  <button type="button" disabled={uploadingCover} onClick={() => fileRef.current?.click()}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-fg)', background: 'var(--t-w04)', border: '1px dashed var(--t-w15)', borderRadius: 3, padding: '10px 18px', cursor: uploadingCover ? 'not-allowed' : 'pointer' }}>
                    {uploadingCover ? 'Uploading…' : '↑ Choose image'}
                  </button>
                  {form.cover_image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={form.cover_image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                      <button type="button" onClick={() => setForm(f => ({ ...f, cover_image: '', cover_emoji: '✈️' }))}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Destination */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
            <label style={lbl}>Destination</label>
            <input type="text" value={locQuery}
              onChange={e => { setLocQuery(e.target.value); setForm(f => ({ ...f, destination: e.target.value, geo_country: '', geo_state: '', geo_city: '', geo_country_code: '', geo_lat: null, geo_lon: null })); searchLocation(e.target.value); }}
              onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Search city or place…" style={inp} autoComplete="off" />
            {form.geo_country && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{countryFlag(form.geo_country_code)}</span>
                {[form.geo_country, form.geo_state, form.geo_city].filter(Boolean).map((p, i, arr) => <span key={i}>{p}{i < arr.length - 1 ? ' ›' : ''}</span>)}
              </div>
            )}
            {showDrop && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--t-card)', border: '1px solid var(--t-w12)', borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 2 }}>
                {suggestions.map(s => {
                  const flag = countryFlag(s.address?.country_code ?? '');
                  return (
                    <button key={s.place_id} type="button" onMouseDown={() => pickLocation(s)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, color: 'var(--t-fg)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--t-w08)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {flag && <span style={{ marginRight: 6 }}>{flag}</span>}{s.display_name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trip type + people */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={lbl}>Trip type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TRIP_TYPES.map(tt => (
                  <button key={tt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, trip_type: f.trip_type === tt.value ? '' : tt.value }))}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.06em', color: form.trip_type === tt.value ? 'var(--t-gold)' : 'var(--t-muted)', background: form.trip_type === tt.value ? 'var(--t-gold-08)' : 'var(--t-w04)', border: form.trip_type === tt.value ? '1px solid var(--t-gold-30)' : '1px solid var(--t-w10)' }}>
                    {tt.icon} {tt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={lbl}>People</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, people_count: Math.max(1, (f.people_count ?? 1) - 1) }))} style={{ width: 32, height: 38, fontSize: 18, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--t-fg)', minWidth: 28, textAlign: 'center' }}>{form.people_count}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, people_count: (f.people_count ?? 1) + 1 }))} style={{ width: 32, height: 38, fontSize: 18, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>+</button>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={lbl}>From</label>
              <input type="date" value={form.date_from} onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={lbl}>To</label>
              <input type="date" value={form.date_to} min={form.date_from} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Travel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={lbl}>How are you getting there?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TRAVEL_MODES.map(tm => (
                <button key={tm.value} type="button"
                  onClick={() => setForm(f => ({ ...f, travel_mode: f.travel_mode === tm.value ? '' : tm.value as typeof f.travel_mode }))}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.06em', color: form.travel_mode === tm.value ? 'var(--t-gold)' : 'var(--t-muted)', background: form.travel_mode === tm.value ? 'var(--t-gold-08)' : 'var(--t-w04)', border: form.travel_mode === tm.value ? '1px solid var(--t-gold-30)' : '1px solid var(--t-w10)' }}>
                  {tm.icon} {tm.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={lbl}>Traveling from</label>
            <input type="text" value={form.travel_from} onChange={e => setForm(f => ({ ...f, travel_from: e.target.value }))} placeholder="e.g. Mumbai, Bangalore…" style={inp} />
          </div>

          {/* Notes / description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={lbl}>Trip notes</label>
            <textarea
              value={(form as Record<string, unknown>).notes as string ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Add any notes, reminders, or details about this trip…"
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '9px 18px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving || !form.name.trim()} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: saving ? 'var(--t-muted)' : 'var(--t-bg)', background: saving ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '9px 22px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
