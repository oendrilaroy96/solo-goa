import { useState, useEffect, useRef, useCallback } from 'react';
import { listTrips, createTrip, deleteTrip, updateTrip } from '../lib/trips';
import type { Trip, TripType } from '../lib/trips';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
  { label: 'Transport',  emojis: ['✈️','🚂','🚢','🚁','🛺','🛵','🚗','🏍️','🚤','🛸'] },
  { label: 'Places',     emojis: ['🏖️','🏝️','🏔️','🌋','🏛️','🕌','⛩️','🗼','🗽','🏰','🏯','🕍','🛕'] },
  { label: 'Nature',     emojis: ['🌊','🌅','🌄','🌿','🌺','🌴','🦋','🐘','🦁','🌌','🏕️','🌁'] },
  { label: 'Activities', emojis: ['🤿','🧗','🎨','🎪','🎭','🎡','🎢','📸','🗺️','🎒','🥂','🍹','🍜'] },
  { label: 'Vibes',      emojis: ['🌍','🌏','🌎','🌃','🌆','🌇','🌉','🎑','⛺','🎠','🏟️','🎿','🧳'] },
];

// ── Geo helpers ─────────────────────────────────────────────────────────────
const CONTINENT_MAP: Record<string, string> = {
  India:'Asia', China:'Asia', Japan:'Asia', Thailand:'Asia', Indonesia:'Asia',
  Vietnam:'Asia', 'Sri Lanka':'Asia', Nepal:'Asia', Bhutan:'Asia', Maldives:'Asia',
  Singapore:'Asia', Malaysia:'Asia', Philippines:'Asia', Cambodia:'Asia', Myanmar:'Asia',
  'South Korea':'Asia', Taiwan:'Asia', Bangladesh:'Asia', Pakistan:'Asia', Turkey:'Asia',
  Israel:'Asia', Jordan:'Asia', 'United Arab Emirates':'Asia', UAE:'Asia', Qatar:'Asia',
  'Saudi Arabia':'Asia', Oman:'Asia', Georgia:'Asia', Armenia:'Asia', Azerbaijan:'Asia',
  Laos:'Asia', Mongolia:'Asia', Kazakhstan:'Asia', Uzbekistan:'Asia', Iran:'Asia',
  France:'Europe', Italy:'Europe', Spain:'Europe', 'United Kingdom':'Europe',
  Germany:'Europe', Portugal:'Europe', Greece:'Europe', Netherlands:'Europe',
  Switzerland:'Europe', Austria:'Europe', 'Czech Republic':'Europe', Czechia:'Europe',
  Hungary:'Europe', Croatia:'Europe', Poland:'Europe', Sweden:'Europe',
  Norway:'Europe', Denmark:'Europe', Finland:'Europe', Iceland:'Europe',
  Ireland:'Europe', Belgium:'Europe', Romania:'Europe', Bulgaria:'Europe',
  Serbia:'Europe', Albania:'Europe', Montenegro:'Europe', Bosnia:'Europe',
  'North Macedonia':'Europe', Slovenia:'Europe', Slovakia:'Europe', Latvia:'Europe',
  Lithuania:'Europe', Estonia:'Europe', Ukraine:'Europe', Russia:'Europe',
  'United States':'North America', 'United States of America':'North America',
  Canada:'North America', Mexico:'North America', Cuba:'North America',
  'Costa Rica':'North America', Panama:'North America', 'Dominican Republic':'North America',
  Jamaica:'North America', Guatemala:'North America', Belize:'North America',
  Brazil:'South America', Argentina:'South America', Peru:'South America',
  Colombia:'South America', Chile:'South America', Ecuador:'South America',
  Bolivia:'South America', Uruguay:'South America', Paraguay:'South America',
  Venezuela:'South America', Guyana:'South America', Suriname:'South America',
  Australia:'Oceania', 'New Zealand':'Oceania', Fiji:'Oceania',
  'Papua New Guinea':'Oceania', Vanuatu:'Oceania', Samoa:'Oceania',
  Kenya:'Africa', 'South Africa':'Africa', Morocco:'Africa', Egypt:'Africa',
  Tanzania:'Africa', Ethiopia:'Africa', Ghana:'Africa', Nigeria:'Africa',
  Uganda:'Africa', Rwanda:'Africa', Zimbabwe:'Africa', Zambia:'Africa',
  Mozambique:'Africa', Madagascar:'Africa', Mauritius:'Africa',
};

const CONTINENT_ORDER = ['Asia','Europe','North America','South America','Oceania','Africa','Other'];

function getContinent(country: string): string {
  return CONTINENT_MAP[country] ?? 'Other';
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const [a, b] = code.toUpperCase();
  return (
    String.fromCodePoint(0x1F1E6 + (a.charCodeAt(0) - 65)) +
    String.fromCodePoint(0x1F1E6 + (b.charCodeAt(0) - 65))
  );
}

interface CityGroup   { state: string; city: string; trips: Trip[] }
interface CountryGroup { country: string; code: string; continent: string; cities: CityGroup[] }
interface ContinentGroup { continent: string; countries: CountryGroup[] }

function groupTrips(trips: Trip[]): { grouped: ContinentGroup[]; ungrouped: Trip[] } {
  const ungrouped: Trip[] = [];
  // continent → country → `${state}|||${city}` → trips
  const tree = new Map<string, Map<string, { code: string; byCity: Map<string, { state: string; city: string; trips: Trip[] }> }>>();

  for (const trip of trips) {
    if (!trip.geo_country) { ungrouped.push(trip); continue; }
    const continent = getContinent(trip.geo_country);
    const country   = trip.geo_country;
    const code      = trip.geo_country_code ?? '';
    const state     = trip.geo_state ?? '';
    const city      = trip.geo_city  ?? '';
    const key       = `${state}|||${city}`;

    if (!tree.has(continent)) tree.set(continent, new Map());
    const cm = tree.get(continent)!;
    if (!cm.has(country)) cm.set(country, { code, byCity: new Map() });
    const { byCity } = cm.get(country)!;
    if (!byCity.has(key)) byCity.set(key, { state, city, trips: [] });
    byCity.get(key)!.trips.push(trip);
  }

  const grouped: ContinentGroup[] = [];
  for (const [continent, cm] of tree) {
    const countries: CountryGroup[] = [];
    for (const [country, { code, byCity }] of cm) {
      const cities: CityGroup[] = [...byCity.values()];
      countries.push({ country, code, continent, cities });
    }
    grouped.push({ continent, countries });
  }
  // Sort continents by preferred order
  grouped.sort((a, b) => CONTINENT_ORDER.indexOf(a.continent) - CONTINENT_ORDER.indexOf(b.continent));

  return { grouped, ungrouped };
}

// ── Form blank ──────────────────────────────────────────────────────────────
const BLANK_FORM = () => ({
  name: '',
  destination: '',
  date_from: '',
  date_to: '',
  cover_emoji: '✈️',
  cover_image: '',
  trip_type: '' as TripType | '',
  people_count: 1,
  geo_country: '',
  geo_country_code: '',
  geo_state: '',
  geo_city: '',
  geo_lat: null as number | null,
  geo_lon: null as number | null,
});

interface LocationSuggestion {
  display_name: string;
  place_id: number;
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    suburb?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}

interface Props {
  user: User;
  onSelectTrip: (trip: Trip) => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function DashboardPage({ user, onSelectTrip, onSignOut, theme, onToggleTheme }: Props) {
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [form, setForm]               = useState(BLANK_FORM());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingTrip,  setEditingTrip]  = useState<Trip | null>(null);
  const [editForm,     setEditForm]     = useState(BLANK_FORM());
  const [editLocQuery, setEditLocQuery] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Nested tree collapsed state
  const [collapsedContinents, setCollapsedContinents] = useState<Set<string>>(new Set());
  const [collapsedCountries,  setCollapsedCountries]  = useState<Set<string>>(new Set());

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Location autocomplete
  const [locationQuery, setLocationQuery]             = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationDrop, setShowLocationDrop]       = useState(false);
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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
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
    setForm(f => ({ ...f, destination: val, geo_country: '', geo_state: '', geo_city: '', geo_country_code: '' }));
    searchLocation(val);
  }

  function pickLocation(s: LocationSuggestion) {
    const parts = s.display_name.split(',').map(p => p.trim());
    const short = parts.slice(0, 3).join(', ');
    const addr  = s.address ?? {};
    const city  = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.suburb ?? '';
    const state = addr.state ?? addr.region ?? '';
    setLocationQuery(short);
    setForm(f => ({
      ...f,
      destination:       short,
      geo_country:       addr.country ?? '',
      geo_country_code:  addr.country_code ?? '',
      geo_state:         state,
      geo_city:          city,
      geo_lat:           s.lat ? parseFloat(s.lat) : null,
      geo_lon:           s.lon ? parseFloat(s.lon) : null,
    }));
    setLocationSuggestions([]);
    setShowLocationDrop(false);
  }

  // ── Cover image upload ───────────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    setUploadingCover(true);
    const ext  = file.name.split('.').pop();
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
      name:             form.name.trim(),
      destination:      form.destination.trim(),
      date_from:        form.date_from,
      date_to:          form.date_to,
      cover_emoji:      form.cover_emoji || '✈️',
      cover_image:      form.cover_image || undefined,
      trip_type:        (form.trip_type as TripType) || undefined,
      people_count:     form.people_count || 1,
      geo_country:      form.geo_country  || undefined,
      geo_country_code: form.geo_country_code || undefined,
      geo_state:        form.geo_state    || undefined,
      geo_city:         form.geo_city     || undefined,
      geo_lat:          form.geo_lat      ?? undefined,
      geo_lon:          form.geo_lon      ?? undefined,
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

  // ── Edit trip ────────────────────────────────────────────────────────────
  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setEditLocQuery(trip.destination ?? '');
    setEditForm({
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
      geo_lat:          trip.geo_lat ?? null,
      geo_lon:          trip.geo_lon ?? null,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTrip || !editForm.name.trim()) return;
    setSaving(true);
    await updateTrip(editingTrip.id, {
      name:             editForm.name.trim(),
      destination:      editForm.destination.trim(),
      date_from:        editForm.date_from,
      date_to:          editForm.date_to,
      cover_emoji:      editForm.cover_emoji || '✈️',
      cover_image:      editForm.cover_image || undefined,
      trip_type:        (editForm.trip_type as TripType) || undefined,
      people_count:     editForm.people_count || 1,
      geo_country:      editForm.geo_country  || undefined,
      geo_country_code: editForm.geo_country_code || undefined,
      geo_state:        editForm.geo_state    || undefined,
      geo_city:         editForm.geo_city     || undefined,
      geo_lat:          editForm.geo_lat      ?? undefined,
      geo_lon:          editForm.geo_lon      ?? undefined,
    });
    setSaving(false);
    setTrips(prev => prev.map(t =>
      t.id === editingTrip.id
        ? { ...t, name: editForm.name.trim(), destination: editForm.destination, date_from: editForm.date_from, date_to: editForm.date_to, cover_emoji: editForm.cover_emoji, cover_image: editForm.cover_image || undefined, trip_type: (editForm.trip_type as TripType) || undefined, people_count: editForm.people_count, geo_country: editForm.geo_country || undefined, geo_country_code: editForm.geo_country_code || undefined, geo_state: editForm.geo_state || undefined, geo_city: editForm.geo_city || undefined, geo_lat: editForm.geo_lat ?? undefined, geo_lon: editForm.geo_lon ?? undefined }
        : t
    ));
    setEditingTrip(null);
  }

  // ── Tree toggle helpers ──────────────────────────────────────────────────
  function toggleContinent(c: string) {
    setCollapsedContinents(prev => { const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s; });
  }
  function toggleCountry(key: string) {
    setCollapsedCountries(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2,
    padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };

  const coverPreview = form.cover_image
    ? <img src={form.cover_image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
    : <span style={{ fontSize: 30 }}>{form.cover_emoji || '✈️'}</span>;

  const { grouped, ungrouped } = groupTrips(trips);

  return (
    <>
    <div className="px-4 pt-16 pb-20 sm:px-6 sm:pt-10 sm:pb-20" style={{ minHeight: '100vh', background: 'var(--t-bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          {/* Top bar: logo + compact profile */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/favicon.png" width={32} height={32} alt="" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                TripTinker
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Theme toggle */}
              <button type="button" onClick={onToggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                style={{ background: 'var(--t-w04)', border: '1px solid var(--t-w10)', borderRadius: 20, padding: '5px 9px', cursor: 'pointer', fontSize: 13, lineHeight: 1, color: 'var(--t-muted)' }}>
                {theme === 'dark' ? '☀' : '🌙'}
              </button>

              {/* Avatar dropdown */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(p => !p)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--t-gold-20)', border: '1px solid var(--t-gold-30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                    color: 'var(--t-gold)', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  title="Account"
                >
                  {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?')}
                </button>

                {showProfileMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
                    background: 'var(--t-card)', border: '1px solid var(--t-w12)',
                    borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,.4)',
                    minWidth: 220,
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--t-w08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--t-gold-20)', border: '1px solid var(--t-gold-30)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                          color: 'var(--t-gold)', textTransform: 'uppercase',
                        }}>
                          {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?')}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-fg)' }}>
                            {user.user_metadata?.full_name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)', marginTop: 1 }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                      <button
                        type="button"
                        onClick={() => { setShowProfileMenu(false); setEditName(user.user_metadata?.full_name ?? ''); setShowAccountModal(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-fg)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>👤</span> My account
                      </button>
                      <div style={{ height: 1, background: 'var(--t-w08)', margin: '4px 0' }} />
                      <button
                        type="button"
                        onClick={() => { setShowProfileMenu(false); onSignOut(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#e07070', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>↩</span> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="gold-line" />
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
              + New trip
            </button>
          </div>
        </div>

        {/* ── New trip form — overlay modal ─────────────────────────── */}
        {showForm && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setForm(BLANK_FORM()); setLocationQuery(''); setShowEmojiPicker(false); } }}
          >
          <div className="luxury-card" style={{ width: '100%', maxWidth: 540, padding: 'clamp(20px, 5vw, 32px)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--t-fg)', margin: 0 }}>
                New trip
              </h3>
              <button type="button" onClick={() => { setShowForm(false); setForm(BLANK_FORM()); setLocationQuery(''); setShowEmojiPicker(false); }} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cover + Trip name row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <label style={labelStyle}>Cover</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    style={{ width: 56, height: 40, borderRadius: 4, border: '1px solid var(--t-w12)', background: 'var(--t-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                    title="Pick emoji or upload logo"
                  >
                    {coverPreview}
                  </button>
                </div>
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
                <div style={{ border: '1px solid var(--t-w12)', borderRadius: 6, background: 'var(--t-card)', padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {(['emoji', 'upload'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCoverTab(tab)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
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
                                onClick={() => { setForm(f => ({ ...f, cover_emoji: em, cover_image: '' })); setShowEmojiPicker(false); }}
                                style={{
                                  fontSize: 22, lineHeight: 1,
                                  width: 38, height: 38,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  borderRadius: 4, cursor: 'pointer',
                                  border: form.cover_emoji === em && !form.cover_image ? '2px solid var(--t-gold)' : '1px solid var(--t-w08)',
                                  background: form.cover_emoji === em && !form.cover_image ? 'var(--t-gold-08)' : 'var(--t-bg)',
                                }}
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
                          if (file.size > 200 * 1024) { alert('Image must be under 200 KB'); e.target.value = ''; return; }
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
                          border: '1px dashed var(--t-w15)', borderRadius: 3,
                          padding: '10px 18px', cursor: uploadingCover ? 'not-allowed' : 'pointer',
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
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '4px 10px', cursor: 'pointer' }}
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
                {/* Breadcrumb of selected geo */}
                {form.geo_country && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span>{countryFlag(form.geo_country_code)}</span>
                    {[form.geo_country, form.geo_state, form.geo_city].filter(Boolean).map((part, i, arr) => (
                      <span key={i}>{part}{i < arr.length - 1 ? ' ›' : ''}</span>
                    ))}
                  </div>
                )}
                {showLocationDrop && locationSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--t-card)', border: '1px solid var(--t-w12)',
                    borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 2,
                  }}>
                    {locationSuggestions.map(s => {
                      const addr = s.address ?? {};
                      const flag = countryFlag(addr.country_code ?? '');
                      return (
                        <button
                          key={s.place_id}
                          type="button"
                          onMouseDown={() => pickLocation(s)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, color: 'var(--t-fg)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--t-w08)', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {flag && <span style={{ marginRight: 6 }}>{flag}</span>}
                          {s.display_name}
                        </button>
                      );
                    })}
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
                          padding: '6px 12px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.06em',
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
                    <button type="button" onClick={() => setForm(f => ({ ...f, people_count: Math.max(1, (f.people_count ?? 1) - 1) }))} style={{ width: 32, height: 38, fontSize: 18, lineHeight: 1, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>−</button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--t-fg)', minWidth: 28, textAlign: 'center' }}>{form.people_count}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, people_count: (f.people_count ?? 1) + 1 }))} style={{ width: 32, height: 38, fontSize: 18, lineHeight: 1, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>From</label>
                  <input type="date" value={form.date_from} onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={labelStyle}>To</label>
                  <input type="date" value={form.date_to} min={form.date_from} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(BLANK_FORM()); setLocationQuery(''); setShowEmojiPicker(false); }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '9px 18px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: creating ? 'var(--t-muted)' : 'var(--t-bg)', background: creating ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '9px 22px', cursor: creating ? 'not-allowed' : 'pointer' }}
                >
                  {creating ? 'Creating…' : 'Create trip'}
                </button>
              </div>
            </form>
          </div>
          </div>
        )}

        {/* ── Trip list ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--t-muted)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Loading…</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Nested geo tree ── */}
            {grouped.map(cg => {
              const continentCollapsed = collapsedContinents.has(cg.continent);
              return (
                <div key={cg.continent} style={{ marginBottom: 28 }}>
                  {/* Continent header */}
                  <button
                    type="button"
                    onClick={() => toggleContinent(cg.continent)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '0 0 8px',
                      borderBottom: '1px solid var(--t-gold-20)',
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--t-gold)' }}>
                      {cg.continent}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted-35)', marginLeft: 'auto' }}>
                      {continentCollapsed ? '▸' : '▾'}
                    </span>
                  </button>

                  {!continentCollapsed && cg.countries.map(country => {
                    const countryKey = `${cg.continent}/${country.country}`;
                    const countryCollapsed = collapsedCountries.has(countryKey);
                    const flag = countryFlag(country.code);
                    return (
                      <div key={country.country} style={{ marginBottom: 20, paddingLeft: 12, borderLeft: '2px solid var(--t-w07)' }}>
                        {/* Country header */}
                        <button
                          type="button"
                          onClick={() => toggleCountry(countryKey)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '4px 0 10px', width: '100%', textAlign: 'left',
                          }}
                        >
                          {flag && <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--t-fg)', letterSpacing: '0.04em' }}>
                            {country.country}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted-35)', marginLeft: 'auto' }}>
                            {countryCollapsed ? '▸' : '▾'}
                          </span>
                        </button>

                        {!countryCollapsed && country.cities.map(cg2 => (
                          <div key={`${cg2.state}/${cg2.city}`} style={{ marginBottom: 16 }}>
                            {/* State › City breadcrumb */}
                            {(cg2.state || cg2.city) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, paddingLeft: 12 }}>
                                {cg2.state && (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px solid var(--t-w08)', borderRadius: 2, padding: '2px 7px' }}>
                                    {cg2.state}
                                  </span>
                                )}
                                {cg2.state && cg2.city && <span style={{ color: 'var(--t-muted-35)', fontSize: 10 }}>›</span>}
                                {cg2.city && (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-gold)', background: 'var(--t-gold-06)', border: '1px solid var(--t-gold-20)', borderRadius: 2, padding: '2px 7px' }}>
                                    {cg2.city}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Trip cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                              {cg2.trips.map(trip => <TripCard key={trip.id} trip={trip} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onSelectTrip={onSelectTrip} onEdit={openEdit} setTrips={setTrips} />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Ungrouped trips (no geo data) */}
            {ungrouped.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                {grouped.length > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--t-muted)', paddingBottom: 8, borderBottom: '1px solid var(--t-w07)', marginBottom: 16 }}>
                    Other
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ungrouped.map(trip => <TripCard key={trip.id} trip={trip} deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm} onSelectTrip={onSelectTrip} onEdit={openEdit} setTrips={setTrips} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ── Edit trip modal ── */}
    {editingTrip && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
        onClick={e => { if (e.target === e.currentTarget) setEditingTrip(null); }}
      >
        <div className="luxury-card" style={{ width: '100%', maxWidth: 540, padding: 'clamp(20px, 5vw, 32px)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--t-fg)', margin: 0 }}>Edit trip</h3>
            <button type="button" onClick={() => setEditingTrip(null)} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Cover + name */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                <label style={labelStyle}>Cover</label>
                <div style={{ width: 56, height: 40, borderRadius: 4, border: '1px solid var(--t-w12)', background: 'var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 28 }}>
                  {editForm.cover_image
                    ? <img src={editForm.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (editForm.cover_emoji || '✈️')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                <label style={labelStyle}>Trip name *</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
            </div>

            {/* Destination */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
              <label style={labelStyle}>Destination</label>
              <input
                type="text"
                value={editLocQuery}
                onChange={e => {
                  setEditLocQuery(e.target.value);
                  setEditForm(f => ({ ...f, destination: e.target.value, geo_country: '', geo_state: '', geo_city: '', geo_country_code: '', geo_lat: null, geo_lon: null }));
                  searchLocation(e.target.value);
                }}
                onFocus={() => locationSuggestions.length > 0 && setShowLocationDrop(true)}
                onBlur={() => setTimeout(() => setShowLocationDrop(false), 150)}
                placeholder="Search city or place…"
                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const }}
                autoComplete="off"
              />
              {editForm.geo_country && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{countryFlag(editForm.geo_country_code)}</span>
                  {[editForm.geo_country, editForm.geo_state, editForm.geo_city].filter(Boolean).map((p, i, arr) => <span key={i}>{p}{i < arr.length - 1 ? ' ›' : ''}</span>)}
                </div>
              )}
              {showLocationDrop && locationSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--t-card)', border: '1px solid var(--t-w12)', borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 2 }}>
                  {locationSuggestions.map(s => {
                    const addr = s.address ?? {};
                    const flag = countryFlag(addr.country_code ?? '');
                    return (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={() => {
                          const parts = s.display_name.split(',').map((p: string) => p.trim());
                          const short = parts.slice(0, 3).join(', ');
                          const city  = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.suburb ?? '';
                          const state = addr.state ?? addr.region ?? '';
                          setEditLocQuery(short);
                          setEditForm(f => ({ ...f, destination: short, geo_country: addr.country ?? '', geo_country_code: addr.country_code ?? '', geo_state: state, geo_city: city, geo_lat: s.lat ? parseFloat(s.lat) : null, geo_lon: s.lon ? parseFloat(s.lon) : null }));
                          setLocationSuggestions([]); setShowLocationDrop(false);
                        }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, color: 'var(--t-fg)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--t-w08)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-w04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
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
                <label style={labelStyle}>Trip type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TRIP_TYPES.map(tt => (
                    <button key={tt.value} type="button"
                      onClick={() => setEditForm(f => ({ ...f, trip_type: f.trip_type === tt.value ? '' : tt.value }))}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.06em', color: editForm.trip_type === tt.value ? 'var(--t-gold)' : 'var(--t-muted)', background: editForm.trip_type === tt.value ? 'var(--t-gold-08)' : 'var(--t-w04)', border: editForm.trip_type === tt.value ? '1px solid var(--t-gold-30)' : '1px solid var(--t-w10)' }}
                    >{tt.icon} {tt.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>People</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" onClick={() => setEditForm(f => ({ ...f, people_count: Math.max(1, (f.people_count ?? 1) - 1) }))} style={{ width: 32, height: 38, fontSize: 18, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>−</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--t-fg)', minWidth: 28, textAlign: 'center' }}>{editForm.people_count}</span>
                  <button type="button" onClick={() => setEditForm(f => ({ ...f, people_count: (f.people_count ?? 1) + 1 }))} style={{ width: 32, height: 38, fontSize: 18, border: '1px solid var(--t-w12)', borderRadius: 3, background: 'var(--t-bg)', color: 'var(--t-fg)', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>From</label>
                <input type="date" value={editForm.date_from} onChange={e => setEditForm(f => ({ ...f, date_from: e.target.value }))} style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>To</label>
                <input type="date" value={editForm.date_to} min={editForm.date_from} onChange={e => setEditForm(f => ({ ...f, date_to: e.target.value }))} style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const, colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setEditingTrip(null)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '9px 18px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving || !editForm.name.trim()} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: saving ? 'var(--t-muted)' : 'var(--t-bg)', background: saving ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '9px 22px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── My Account modal ── */}
    {showAccountModal && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={() => setShowAccountModal(false)}
      >
        <div
          className="luxury-card"
          style={{ width: '100%', maxWidth: 420, padding: 'clamp(20px,5vw,32px)' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--t-fg)', margin: 0 }}>My account</h2>
            <button type="button" onClick={() => setShowAccountModal(false)} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--t-gold-20)', border: '2px solid var(--t-gold-30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--t-gold)', textTransform: 'uppercase' }}>
              {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-fg)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email address</label>
              <div style={{ background: 'var(--t-w04)', border: '1px solid var(--t-w08)', borderRadius: 2, padding: '9px 12px', color: 'var(--t-muted)', fontSize: 13 }}>{user.email}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted-35)' }}>Email cannot be changed</span>
            </div>
            <button
              type="button"
              disabled={savingName || !editName.trim() || editName.trim() === user.user_metadata?.full_name}
              onClick={async () => {
                setSavingName(true);
                await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
                setSavingName(false);
                setShowAccountModal(false);
              }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: savingName ? 'var(--t-muted)' : 'var(--t-bg)', background: savingName ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '10px 20px', cursor: savingName ? 'not-allowed' : 'pointer', marginTop: 4 }}
            >
              {savingName ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Trip card (extracted to avoid re-declaring inline) ───────────────────────
function TripCard({
  trip, deleteConfirm, setDeleteConfirm, onSelectTrip, onEdit, setTrips,
}: {
  trip: Trip;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  onSelectTrip: (t: Trip) => void;
  onEdit: (t: Trip) => void;
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
}) {
  const TRIP_TYPE_ICONS: Record<string, string> = { solo:'🧍', couple:'👫', friends:'👯', family:'👨‍👩‍👧', work:'💼' };

  return (
    <div className="luxury-card" style={{ padding: '14px 16px' }}>
      {/* Row 1: cover + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--t-gold-08)', fontSize: 26 }}>
          {trip.cover_image
            ? <img src={trip.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (trip.cover_emoji || '✈️')
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)', marginTop: 2, lineHeight: 1.5 }}>
            {[
              (trip.date_from || trip.date_to) ? [
                trip.date_from ? new Date(trip.date_from + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '',
                trip.date_to   ? new Date(trip.date_to   + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
              ].filter(Boolean).join(' – ') : '',
              trip.trip_type ? `${TRIP_TYPE_ICONS[trip.trip_type] ?? ''} ${trip.trip_type}` : '',
              trip.people_count && trip.people_count > 1 ? `${trip.people_count} people` : '',
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* Row 2: actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        {deleteConfirm === trip.id ? (
          <>
            <button type="button" onClick={() => setDeleteConfirm(null)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>Keep</button>
            <button type="button" onClick={async () => { await deleteTrip(trip.id); setDeleteConfirm(null); setTrips(prev => prev.filter(t => t.id !== trip.id)); }} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e07070', background: 'rgba(224,112,112,.08)', border: '1px solid rgba(224,112,112,.3)', borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>Delete</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => onSelectTrip(trip)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-gold)', background: 'var(--t-gold-10)', border: '1px solid var(--t-gold-30)', borderRadius: 3, padding: '7px 18px', cursor: 'pointer' }}>Open</button>
            <button type="button" onClick={() => onEdit(trip)} title="Edit trip" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '6px 12px', cursor: 'pointer', lineHeight: 1 }}>✏</button>
            <button type="button" onClick={() => setDeleteConfirm(trip.id)} aria-label={`Delete ${trip.name}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '6px 12px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </>
        )}
      </div>
    </div>
  );
}
