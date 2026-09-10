import { useState, useEffect, useRef } from 'react';
import type { DayData, EventItem, TagVariant, EventCategory, TransportMode } from '../data/itinerary';
import { TRANSPORT_MODE_LABEL, TRANSPORT_MODES } from '../data/itinerary';
import { EVENT_CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '../data/itinerary';
import type { DocCategory } from '../data/documents';
import { CATEGORY_LABELS as DOC_CATEGORY_LABELS, CATEGORY_ICON as DOC_CATEGORY_ICON } from '../data/documents';
import DayPanel from '../components/DayPanel';
import { loadItinerary, saveItinerary, newEventId, newDayId } from '../lib/itinerary-store';
import { supabase } from '../lib/supabase';
import type { Trip } from '../lib/trips';
import { updateTrip } from '../lib/trips';
import { fetchTripWeather } from '../lib/weather';

const DOC_CATEGORIES: DocCategory[] = ['flight', 'train', 'hotel', 'cab', 'activity', 'payment'];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateDaysFromTrip(trip: Trip): DayData[] {
  if (!trip.date_from || !trip.date_to) return [];
  const start = new Date(trip.date_from + 'T00:00:00');
  const end   = new Date(trip.date_to   + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const days: DayData[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayNum  = String(d.getDate());
    const weekday = WEEKDAYS[d.getDay()];
    const month   = MONTHS[d.getMonth()];
    days.push({
      id: newDayId(dayNum),
      day: dayNum,
      weekday,
      subtitle: `${weekday}, ${dayNum} ${month}`,
      weather: '',
      events: [],
    });
  }
  return days;
}

// ─── time overlap helpers ─────────────────────────────────────────────────────

function parseTimeRange(t: string): { start: number; end: number } | null {
  const clean = t.replace(/^[~From\s]+/i, '').trim();
  const parts = clean.split(/[–-]/).map(s => s.trim()).filter(Boolean);

  const toMin = (s: string, fallbackAmPm: string | null): number | null => {
    const ap = (s.match(/(AM|PM)/i)?.[1] ?? fallbackAmPm ?? '').toUpperCase();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const ampm = last.match(/(AM|PM)/i)?.[1] ?? null;
    const start = toMin(parts[0], ampm);
    const end   = toMin(last, null);
    if (start !== null && end !== null) return { start, end: end <= start ? start + 30 : end };
  }

  // Single time like "4:00 PM"
  const m = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    const s = h * 60 + min;
    return { start: s, end: s + 30 };
  }

  return null;
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

function findConflict(events: EventItem[], newTime: string, excludeId?: string): EventItem | null {
  const newRange = parseTimeRange(newTime);
  if (!newRange) return null;
  for (const ev of events) {
    if (ev.id === excludeId) continue;
    const r = parseTimeRange(ev.time);
    if (r && overlaps(newRange, r)) return ev;
  }
  return null;
}

// ─── types ────────────────────────────────────────────────────────────────────

type EventDraft = {
  time: string; title: string; description: string;
  tag: string; tagVariant: TagVariant;
  categories: EventCategory[];
  phone: string; email: string; mapUrl: string; docLabel: string;
  transportMode: TransportMode | '';
  ticketBooked: boolean | null;
  estimatedPrice: string;
  boardingPassDocLabel: string;
};
type DayDraft = { isoDate: string; subtitle: string; weather: string };

const BLANK_EVENT = (): EventDraft => ({
  time: '', title: '', description: '', tag: '', tagVariant: 'default',
  categories: [], phone: '', email: '', mapUrl: '', docLabel: '',
  transportMode: '', ticketBooked: null, estimatedPrice: '', boardingPassDocLabel: '',
});
const BLANK_DAY = (): DayDraft => ({ isoDate: '', subtitle: '', weather: '' });

// ─── styles ───────────────────────────────────────────────────────────────────

const INPUT = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--t-bg)',
  border: '1px solid var(--t-w12)',
  borderRadius: 2,
  padding: '8px 12px',
  color: 'var(--t-fg)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  ...extra,
});

const LBL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10,
  color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
};

const BTN_CANCEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--t-muted)', background: 'transparent',
  border: '1px solid var(--t-w10)', borderRadius: 3,
  padding: '8px 16px', cursor: 'pointer',
};

const BTN_SAVE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--t-bg)', background: 'var(--t-gold)',
  border: 'none', borderRadius: 3,
  padding: '8px 20px', cursor: 'pointer',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStoredDay(): string {
  try { return localStorage.getItem('goaSelectedDay') || '14'; } catch { return '14'; }
}

// Strip HTML tags → plain text for the edit textarea
function stripHtml(html: string): string {
  return html
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
  trip: Trip;
  onOpenDoc?: (label: string) => void;
  onTripChange?: (updated: Trip) => void;
}

export default function ItineraryPage({ trip, onOpenDoc, onTripChange }: Props) {
  const tripId = trip.id;
  const [allDays, setAllDays]         = useState<DayData[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDay, setSelectedDay] = useState(getStoredDay);
  const [docLabels, setDocLabels]     = useState<string[]>([]);

  // event form
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<EventItem | null>(null);
  const [draft, setDraft]         = useState<EventDraft>(BLANK_EVENT());
  const [conflict, setConflict]   = useState<EventItem | null>(null);

  // day form
  const [showDayForm, setShowDayForm] = useState(false);
  const [dayDraft, setDayDraft]       = useState<DayDraft>(BLANK_DAY());

  // AI fill panel
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState('');

  // inline doc upload (inside event form)
  const [showDocUpload, setShowDocUpload]   = useState(false);
  const [docUploadTarget, setDocUploadTarget] = useState<'ticket' | 'boardingPass' | 'general'>('general');
  const [docLabel, setDocLabel]             = useState('');
  const [docSublabel, setDocSublabel]       = useState('');
  const [docCategory, setDocCategory]       = useState<DocCategory>('flight');
  const [docUploading, setDocUploading]     = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const docFileRef = useRef<HTMLInputElement>(null);

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadItinerary(tripId).then(async days => {
      // ── 1. Resolve days (load or auto-generate) ──────────────────────────
      let resolvedDays = days;
      if (days.length === 0) {
        const generated = generateDaysFromTrip(trip);
        if (generated.length > 0) {
          resolvedDays = generated;
          setSelectedDay(generated[0].day);
        }
      }
      setAllDays(resolvedDays);
      setLoading(false);

      // ── 2. Fetch weather in background ───────────────────────────────────
      if (
        resolvedDays.length > 0 &&
        trip.destination &&
        trip.date_from &&
        trip.date_to &&
        resolvedDays.some(d => !d.weather)
      ) {
        fetchTripWeather(trip.destination, trip.date_from, trip.date_to, trip.geo_lat, trip.geo_lon).then(async weatherMap => {
          if (!Object.keys(weatherMap).length) return;
          const start = new Date(trip.date_from + 'T00:00:00');
          const withWeather = resolvedDays.map((day, i) => {
            if (day.weather) return day;
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const iso = localDateStr(d);
            const w = weatherMap[iso];
            return w ? { ...day, weather: w } : day;
          });
          const changed = withWeather.some((d, i) => d.weather !== resolvedDays[i].weather);
          if (!changed) return;
          await saveItinerary(tripId, withWeather);
          setAllDays(withWeather);
        });
      }
    });
    supabase.from('documents').select('*').eq('itinerary_id', tripId).order('label').then(({ data, error }) => {
      if (error) console.error('docs fetch:', error);
      if (data) setDocLabels((data as { label: string }[]).map(d => d.label));
    });
  }, [tripId]);

  // Track previous trip dates so we only react to actual date changes, not allDays mutations
  const prevDatesRef = useRef({ from: trip.date_from, to: trip.date_to });

  useEffect(() => {
    const prev = prevDatesRef.current;
    const dateChanged = prev.from !== trip.date_from || prev.to !== trip.date_to;
    if (!dateChanged) return;
    prevDatesRef.current = { from: trip.date_from, to: trip.date_to };

    if (loading || allDays.length === 0 || !trip.date_from || !trip.date_to) return;

    const generated = generateDaysFromTrip(trip);

    if (generated.length === allDays.length) return; // no change in day count

    let next: DayData[];
    if (generated.length > allDays.length) {
      // Dates extended — append new days (preserve existing)
      next = [...allDays, ...generated.slice(allDays.length)];
    } else {
      // Dates shortened — trim days beyond the new range
      next = allDays.slice(0, generated.length);
      if (!next.find(d => d.day === selectedDay)) {
        setSelectedDay(next[next.length - 1]?.day ?? next[0]?.day);
      }
    }

    persist(next).then(() => {
      if (!trip.destination) return;
      fetchTripWeather(trip.destination, trip.date_from, trip.date_to, trip.geo_lat, trip.geo_lon)
        .then(weatherMap => {
          if (!Object.keys(weatherMap).length) return;
          const start = new Date(trip.date_from + 'T00:00:00');
          setAllDays(prev => {
            const updated = prev.map((day, i) => {
              if (day.weather) return day;
              const d = new Date(start);
              d.setDate(d.getDate() + i);
              return { ...day, weather: weatherMap[localDateStr(d)] || '' };
            });
            const changed = updated.some((d, i) => d.weather !== prev[i].weather);
            if (changed) saveItinerary(trip.id, updated);
            return changed ? updated : prev;
          });
        });
    });
  }, [trip.date_from, trip.date_to, loading]);

  useEffect(() => {
    try { localStorage.setItem('goaSelectedDay', selectedDay); } catch { /* */ }
    cancelEvent();
  }, [selectedDay]);

  // ── derived ───────────────────────────────────────────────────────────────

  const todayDate = new Date();
  const isTrip    = todayDate.getFullYear() === 2026 && todayDate.getMonth() === 8;
  const todayStr  = isTrip ? String(todayDate.getDate()) : null;
  const activeDay = allDays.find(d => d.day === selectedDay) ?? allDays[0];

  // ── persistence ───────────────────────────────────────────────────────────

  async function persist(next: DayData[]) {
    setAllDays(next);
    await saveItinerary(tripId, next);
  }

  // ── event CRUD ────────────────────────────────────────────────────────────

  function openAdd() {
    setEditing(null);
    setDraft(BLANK_EVENT());
    setShowForm(true);
  }

  function openEdit(ev: EventItem) {
    setEditing(ev);
    const hasHtml = ev.description.includes('<');
    setDraft({
      time: ev.time, title: ev.title,
      description: hasHtml ? stripHtml(ev.description) : ev.description,
      tag: ev.tag, tagVariant: ev.tagVariant,
      categories: ev.categories ?? [],
      phone: ev.phone ?? '', email: ev.email ?? '',
      mapUrl: ev.mapUrl ?? '', docLabel: ev.docLabel ?? '',
      transportMode: ev.transportMode ?? '', ticketBooked: ev.ticketBooked ?? null,
      estimatedPrice: ev.estimatedPrice ?? '', boardingPassDocLabel: ev.boardingPassDocLabel ?? '',
    });
    setShowForm(true);
  }

  async function handleAiFill() {
    if (!aiDescription.trim() || !activeDay) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription.trim(),
          destination: trip.destination,
          dateLabel: activeDay.subtitle,
        }),
      });
      const data = await res.json() as { events?: Record<string, unknown>[]; error?: string };
      if (!res.ok || data.error) { setAiError(data.error ?? 'AI request failed'); setAiLoading(false); return; }
      if (!data.events?.length) { setAiError('No events returned — try rephrasing.'); setAiLoading(false); return; }
      const newEvents = data.events.map(e => ({ ...e, id: newEventId() })) as Parameters<typeof persist>[0][number]['events'];
      const next = allDays.map(d =>
        d.day === activeDay.day ? { ...d, events: [...d.events, ...newEvents] } : d
      );
      await persist(next);
      setAiDescription('');
      setShowAiPanel(false);
    } catch {
      setAiError('Network error — please try again.');
    }
    setAiLoading(false);
  }

  async function handleDocUpload() {
    const file = docFileRef.current?.files?.[0];
    if (!file || !docLabel.trim()) { setDocUploadError('Choose a file and enter a label.'); return; }
    setDocUploadError('');
    setDocUploading(true);
    const ext      = file.name.split('.').pop() ?? 'bin';
    const slug     = docLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${Date.now()}-${slug}.${ext}`;
    const { error: upErr } = await supabase.storage.from('docs').upload(filename, file, { upsert: false });
    if (upErr) { setDocUploadError(upErr.message); setDocUploading(false); return; }
    const { error: dbErr } = await supabase.from('documents').insert({
      label: docLabel.trim(), sublabel: docSublabel.trim(),
      category: docCategory, filename, itinerary_id: tripId,
    });
    if (dbErr) { setDocUploadError(dbErr.message); setDocUploading(false); return; }
    const newLabel = docLabel.trim();
    setDocLabels(prev => [...prev, newLabel]);
    if (docUploadTarget === 'boardingPass') {
      setDraft(d => ({ ...d, boardingPassDocLabel: newLabel }));
    } else {
      setDraft(d => ({ ...d, docLabel: newLabel }));
    }
    setDocLabel(''); setDocSublabel(''); setDocCategory('flight');
    if (docFileRef.current) docFileRef.current.value = '';
    setShowDocUpload(false);
    setDocUploading(false);
  }

  function cancelEvent() {
    setShowForm(false);
    setEditing(null);
    setDraft(BLANK_EVENT());
    setShowDocUpload(false);
    setDocUploadTarget('general');
    setDocLabel(''); setDocSublabel(''); setDocCategory('flight'); setDocUploadError('');
    if (docFileRef.current) docFileRef.current.value = '';
  }

  async function commitEvent() {
    if (!draft.title.trim() || !activeDay) return;
    const isTransport = draft.categories.includes('transport');
    // Auto-fill tag from estimatedPrice if tag is empty and ticket isn't booked
    const autoTag = (!draft.tag.trim() && isTransport && draft.ticketBooked === false && draft.estimatedPrice.trim())
      ? draft.estimatedPrice.trim() : draft.tag;
    const autoVariant: TagVariant = (isTransport && draft.ticketBooked === false && !draft.tag.trim())
      ? 'pending' : draft.tagVariant;
    const clean: Partial<EventItem> = {
      time: draft.time, title: draft.title, description: draft.description,
      tag: autoTag, tagVariant: autoVariant,
      categories: draft.categories.length ? draft.categories : undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      mapUrl: draft.mapUrl.trim() || undefined,
      docLabel: draft.docLabel.trim() || undefined,
      transportMode: (isTransport && draft.transportMode) ? draft.transportMode : undefined,
      ticketBooked: isTransport && draft.ticketBooked !== null ? draft.ticketBooked : undefined,
      estimatedPrice: (isTransport && draft.ticketBooked === false && draft.estimatedPrice.trim())
        ? draft.estimatedPrice.trim() : undefined,
      boardingPassDocLabel: (isTransport && draft.transportMode === 'flight' && draft.boardingPassDocLabel.trim())
        ? draft.boardingPassDocLabel.trim() : undefined,
    };
    const next = allDays.map(d => {
      if (d.day !== activeDay.day) return d;
      if (editing) {
        return {
          ...d,
          events: d.events.map(e =>
            (e.id && e.id === editing.id) || (!e.id && e.time === editing.time && e.title === editing.title)
              ? { ...e, ...clean }
              : e
          ),
        };
      }
      return { ...d, events: [...d.events, { ...clean, id: newEventId() } as EventItem] };
    });
    await persist(next);
    cancelEvent();
  }

  async function handleSubmitEvent() {
    if (!draft.title.trim() || !activeDay) return;
    if (draft.time.trim()) {
      const clash = findConflict(activeDay.events, draft.time, editing?.id);
      if (clash) { setConflict(clash); return; }
    }
    await commitEvent();
  }

  async function handleSubmitForce() {
    setConflict(null);
    await commitEvent();
  }

  function handleConflictEditExisting(ev: EventItem) {
    setConflict(null);
    openEdit(ev);
  }

  async function handleDeleteEvent(evId: string) {
    if (!activeDay) return;
    const next = allDays.map(d =>
      d.day === activeDay.day ? { ...d, events: d.events.filter(e => e.id !== evId) } : d
    );
    await persist(next);
  }

  // ── day CRUD ──────────────────────────────────────────────────────────────

  async function handleDeleteDay(dayId: string) {
    const next = allDays.filter(d => d.id !== dayId);
    if (activeDay?.id === dayId && next.length > 0) setSelectedDay(next[0].day);
    await persist(next);
  }

  async function handleAddDay() {
    if (!dayDraft.isoDate) return;
    const d = new Date(dayDraft.isoDate + 'T00:00:00');
    const dayNum  = String(d.getDate());
    const weekday = WEEKDAYS[d.getDay()];
    const month   = MONTHS[d.getMonth()];
    const newDay: DayData = {
      id: newDayId(dayNum),
      day: dayNum,
      weekday,
      subtitle: dayDraft.subtitle || `${weekday}, ${dayNum} ${month}`,
      weather: dayDraft.weather,
      events: [],
    };
    const next = [...allDays, newDay];
    await persist(next);
    setSelectedDay(dayNum);
    setShowDayForm(false);
    setDayDraft(BLANK_DAY());
    // If new day extends past trip end date, update the trip
    if (trip.date_to < dayDraft.isoDate) {
      await updateTrip(trip.id, { date_to: dayDraft.isoDate });
      onTripChange?.({ ...trip, date_to: dayDraft.isoDate });
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 40 }}>
        Loading itinerary…
      </div>
    );
  }

  return (
    <div>
      {/* Day selector tabs */}
      <div
        className="flex gap-0 mb-8 overflow-x-auto pb-0 items-end"
        style={{ scrollbarWidth: 'none', borderBottom: '1px solid var(--t-w07)' }}
        role="tablist"
        aria-label="Select a day"
      >
        {allDays.map(d => {
          const isActive = d.day === selectedDay;
          const isToday  = d.day === todayStr;
          return (
            <div key={d.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(d.day)}
                className="relative cursor-pointer text-center transition-all focus-visible:outline-none"
                style={{
                  padding: '10px 20px 12px 16px',
                  background: 'transparent',
                  border: 0,
                  borderBottom: isActive ? '2px solid var(--t-gold)' : '2px solid transparent',
                  marginBottom: -1,
                  display: 'block',
                }}
              >
                <span className="block font-mono text-[14px] font-semibold tabular-nums" style={{ color: isActive ? 'var(--t-gold)' : 'var(--t-muted)' }}>
                  {d.day}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-[.06em] mt-0.5" style={{ color: isActive ? 'var(--t-gold-70)' : 'var(--t-muted-60)' }}>
                  {d.weekday.slice(0, 3)}
                </span>
                {isToday && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--t-gold)' }} title="Today" />
                )}
              </button>
              {/* Delete day button */}
              <button
                type="button"
                title={`Delete ${d.weekday} ${d.day}`}
                onClick={() => { if (confirm(`Delete day ${d.day} (${d.weekday})?`)) handleDeleteDay(d.id!); }}
                style={{
                  position: 'absolute', top: 4, right: 2,
                  background: 'none', border: 'none',
                  color: 'var(--t-muted-35)', cursor: 'pointer',
                  fontSize: 11, lineHeight: 1, padding: '2px 3px',
                }}
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Add day */}
        <button
          type="button"
          onClick={() => {
            if (!showDayForm) {
              // Default to next day after trip end date (or today if no trip end)
              const lastDayDate = trip.date_to || new Date().toISOString().split('T')[0];
              const next = new Date(lastDayDate + 'T00:00:00');
              next.setDate(next.getDate() + 1);
              setDayDraft(d => ({ ...d, isoDate: localDateStr(next) }));
            }
            setShowDayForm(v => !v);
          }}
          style={{
            alignSelf: 'center',
            background: 'none',
            border: '1px dashed var(--t-gold-30)',
            borderRadius: 2,
            color: 'var(--t-gold)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '4px 10px',
            marginLeft: 8,
            flexShrink: 0,
            marginBottom: 2,
          }}
        >
          + day
        </button>
      </div>

      {/* Add day form */}
      {showDayForm && (
        <div className="luxury-card" style={{ marginBottom: 24, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            New day
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px] gap-[10px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Date *</label>
              <input
                type="date"
                value={dayDraft.isoDate}
                min={trip.date_from || undefined}
                onChange={e => setDayDraft(d => ({ ...d, isoDate: e.target.value }))}
                style={{ ...INPUT(), colorScheme: 'dark' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Subtitle</label>
              <input type="text" placeholder="Short summary of the day" value={dayDraft.subtitle} onChange={e => setDayDraft(d => ({ ...d, subtitle: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Weather</label>
              <input type="text" placeholder="☀ 28°C" value={dayDraft.weather} onChange={e => setDayDraft(d => ({ ...d, weather: e.target.value }))} style={INPUT()} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowDayForm(false); setDayDraft(BLANK_DAY()); }} style={BTN_CANCEL}>Cancel</button>
            <button type="button" onClick={handleAddDay} disabled={!dayDraft.isoDate} style={BTN_SAVE}>Add</button>
          </div>
        </div>
      )}

      {/* Day panel */}
      {activeDay && (
        <DayPanel
          day={activeDay}
          onlyOpen={false}
          onOpenDoc={onOpenDoc}
          onOpenBoardingPass={onOpenDoc}
          onEditEvent={openEdit}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {/* Add event + AI fill buttons */}
      {!showForm && activeDay && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={openAdd}
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--t-gold)', background: 'var(--t-gold-06)',
                border: '1px dashed var(--t-gold-30)', borderRadius: 3,
                padding: '10px 20px', cursor: 'pointer',
              }}
            >
              + Add event to {activeDay.weekday} {activeDay.day}
            </button>
            <button
              type="button"
              onClick={() => { setShowAiPanel(v => !v); setAiError(''); }}
              title="Describe your day and AI will fill it in"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: showAiPanel ? 'var(--t-muted)' : 'var(--t-fg)',
                background: showAiPanel ? 'var(--t-w04)' : 'var(--t-w07)',
                border: '1px solid var(--t-w12)', borderRadius: 3,
                padding: '10px 14px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              ✨ AI fill
            </button>
          </div>

          {showAiPanel && (
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-w12)', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                  ✨ Describe your {activeDay.weekday}
                </span>
                <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>AI will generate events for the day</span>
              </div>
              <textarea
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                disabled={aiLoading}
                placeholder={`e.g. "I want to explore Velha Goa — old churches, local lunch, and a relaxed evening by the river"`}
                rows={3}
                style={{
                  background: aiLoading ? 'var(--t-w04)' : 'var(--t-bg)', border: '1px solid var(--t-w12)', borderRadius: 2,
                  padding: '10px 12px', color: aiLoading ? 'var(--t-muted)' : 'var(--t-fg)', fontSize: 13, outline: 'none',
                  width: '100%', boxSizing: 'border-box', resize: aiLoading ? 'none' : 'vertical', lineHeight: 1.6,
                  cursor: aiLoading ? 'not-allowed' : 'auto',
                }}
              />
              {aiError && <p style={{ margin: 0, fontSize: 12, color: '#e07070' }}>{aiError}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowAiPanel(false); setAiError(''); }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'transparent', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '8px 16px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleAiFill} disabled={aiLoading || !aiDescription.trim()}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: (aiLoading || !aiDescription.trim()) ? 'var(--t-muted)' : 'var(--t-bg)', background: (aiLoading || !aiDescription.trim()) ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '8px 20px', cursor: (aiLoading || !aiDescription.trim()) ? 'not-allowed' : 'pointer' }}>
                  {aiLoading ? 'Generating…' : '✨ Generate'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event form — modal overlay */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={cancelEvent}
        >
        <div
          className="luxury-card"
          style={{ width: '100%', maxWidth: 520, padding: 'clamp(14px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {editing ? 'Edit event' : `New event — ${activeDay?.weekday} ${activeDay?.day}`}
            </div>
            <button type="button" onClick={cancelEvent} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>

          {/* Notice for system events that had embedded HTML links */}
          {editing && editing.description.includes('<') && (
            <div style={{ fontSize: 11, color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px solid var(--t-w10)', borderRadius: 2, padding: '8px 10px', lineHeight: 1.5 }}>
              Links from the original description have been removed. Use the <strong style={{ color: 'var(--t-fg)' }}>Map link</strong>, <strong style={{ color: 'var(--t-fg)' }}>Phone</strong>, and <strong style={{ color: 'var(--t-fg)' }}>Email</strong> fields below instead.
            </div>
          )}

          {/* Time + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-[12px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Time</label>
              <input type="text" placeholder="e.g. 3:00 PM" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Title *</label>
              <input type="text" placeholder="What's happening?" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={INPUT()} />
            </div>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={LBL}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EVENT_CATEGORIES.map(cat => {
                const active = draft.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDraft(d => ({
                      ...d,
                      categories: active ? d.categories.filter(c => c !== cat) : [...d.categories, cat],
                    }))}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '4px 8px',
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: active ? '1px solid var(--t-gold-60)' : '1px solid var(--t-w10)',
                      background: active ? 'var(--t-gold-12)' : 'var(--t-w03)',
                      color: active ? 'var(--t-gold)' : 'var(--t-muted)',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span aria-hidden="true">{CATEGORY_ICON[cat]}</span>
                    {CATEGORY_LABEL[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport details */}
          {draft.categories.includes('transport') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--t-w03)', border: '1px solid var(--t-w10)', borderRadius: 4, padding: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transport details</div>

              {/* Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={LBL}>Mode of transport</label>
                <select
                  value={draft.transportMode}
                  onChange={e => setDraft(d => ({ ...d, transportMode: e.target.value as TransportMode | '' }))}
                  style={{ ...INPUT(), padding: '8px 10px' }}
                >
                  <option value="">— select —</option>
                  {TRANSPORT_MODES.map(m => (
                    <option key={m} value={m}>{TRANSPORT_MODE_LABEL[m]}</option>
                  ))}
                </select>
              </div>

              {/* Booked? */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={LBL}>Have you booked the ticket?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([true, false] as const).map(val => {
                    const active = draft.ticketBooked === val;
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => {
                          setDraft(d => ({ ...d, ticketBooked: val }));
                          if (!val) { setShowDocUpload(false); setDocUploadError(''); }
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          padding: '6px 16px', borderRadius: 3, cursor: 'pointer',
                          border: active ? '1px solid var(--t-gold-60)' : '1px solid var(--t-w10)',
                          background: active ? 'var(--t-gold-12)' : 'var(--t-w03)',
                          color: active ? 'var(--t-gold)' : 'var(--t-muted)',
                        }}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated price if not booked */}
              {draft.ticketBooked === false && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={LBL}>Estimated cost</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,500"
                    value={draft.estimatedPrice}
                    onChange={e => setDraft(d => ({ ...d, estimatedPrice: e.target.value }))}
                    style={INPUT()}
                  />
                </div>
              )}

              {/* Doc slots when ticket is booked */}
              {draft.ticketBooked === true && (() => {
                const slots: { key: 'ticket' | 'boardingPass'; label: string; icon: string; docField: 'docLabel' | 'boardingPassDocLabel' }[] = [
                  { key: 'ticket', label: 'Ticket', icon: '🎫', docField: 'docLabel' },
                  ...(draft.transportMode === 'flight'
                    ? [{ key: 'boardingPass' as const, label: 'Boarding Pass', icon: '🛫', docField: 'boardingPassDocLabel' as const }]
                    : []),
                ];
                return slots.map(slot => {
                  const attached = draft[slot.docField];
                  const isUploadingThis = showDocUpload && docUploadTarget === slot.key;
                  return (
                    <div key={slot.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={LBL}>{slot.icon} {slot.label}</label>
                        {!attached && !isUploadingThis && (
                          <button type="button"
                            onClick={() => { setDocUploadTarget(slot.key); setShowDocUpload(true); setDocUploadError(''); }}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-gold)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >+ Upload</button>
                        )}
                        {isUploadingThis && (
                          <button type="button"
                            onClick={() => { setShowDocUpload(false); setDocUploadError(''); }}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >× Cancel</button>
                        )}
                      </div>
                      {attached ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--t-w04)', border: '1px solid var(--t-w10)', borderRadius: 3, padding: '7px 10px' }}>
                          <span style={{ fontSize: 12, color: 'var(--t-fg)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attached}</span>
                          <button type="button" onClick={() => setDraft(d => ({ ...d, [slot.docField]: '' }))}
                            style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ) : isUploadingThis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--t-w03)', border: '1px solid var(--t-w10)', borderRadius: 4, padding: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <label style={LBL}>Label *</label>
                            <input type="text" value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder={slot.key === 'boardingPass' ? 'e.g. IndiGo 6E 634 — Boarding Pass' : 'e.g. IndiGo 6E 634 — Kolkata → Goa'} style={INPUT()} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <label style={LBL}>Sublabel</label>
                            <input type="text" value={docSublabel} onChange={e => setDocSublabel(e.target.value)} placeholder={slot.key === 'boardingPass' ? 'e.g. 14 Sep · Seat 24A' : 'e.g. 14 Sep · Ticket'} style={INPUT()} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <label style={LBL}>Category</label>
                              <select value={docCategory} onChange={e => setDocCategory(e.target.value as DocCategory)} style={{ ...INPUT(), padding: '7px 10px' }}>
                                {DOC_CATEGORIES.map(cat => <option key={cat} value={cat}>{DOC_CATEGORY_ICON[cat]} {DOC_CATEGORY_LABELS[cat]}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <label style={LBL}>File *</label>
                              <input ref={docFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ ...INPUT(), padding: '6px 10px', fontSize: 11, color: 'var(--t-muted)' }} />
                            </div>
                          </div>
                          {docUploadError && <p style={{ margin: 0, fontSize: 11, color: '#e07070' }}>{docUploadError}</p>}
                          <button type="button" onClick={handleDocUpload} disabled={docUploading}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: docUploading ? 'var(--t-muted)' : 'var(--t-bg)', background: docUploading ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '8px 14px', cursor: docUploading ? 'not-allowed' : 'pointer', alignSelf: 'flex-end' }}>
                            {docUploading ? 'Uploading…' : '↑ Upload & attach'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--t-muted)', fontStyle: 'italic' }}>No {slot.label.toLowerCase()} attached</div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={LBL}>Notes</label>
            <textarea
              placeholder="Optional details..."
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              rows={2}
              style={{ ...INPUT(), resize: 'vertical' as const }}
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Phone</label>
              <input type="tel" placeholder="+91 98765 43210" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Email</label>
              <input type="email" placeholder="hello@place.com" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} style={INPUT()} />
            </div>
          </div>

          {/* Map URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={LBL}>Map link</label>
            <input type="url" placeholder="https://maps.google.com/..." value={draft.mapUrl} onChange={e => setDraft(d => ({ ...d, mapUrl: e.target.value }))} style={INPUT()} />
          </div>

          {/* Doc picker — hidden for transport events (handled inside transport section) */}
          {!draft.categories.includes('transport') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={LBL}>Attach document</label>
              <button
                type="button"
                onClick={() => { setDocUploadTarget('general'); setShowDocUpload(v => !v); setDocUploadError(''); }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: showDocUpload ? 'var(--t-muted)' : 'var(--t-gold)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showDocUpload ? '× Cancel' : '+ Upload new'}
              </button>
            </div>

            {showDocUpload ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--t-w03)', border: '1px solid var(--t-w10)', borderRadius: 4, padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={LBL}>Label *</label>
                  <input type="text" value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder="e.g. IndiGo 6E 634 — Kolkata → Goa" style={INPUT()} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={LBL}>Sublabel</label>
                  <input type="text" value={docSublabel} onChange={e => setDocSublabel(e.target.value)} placeholder="e.g. 14 Sep · Ticket" style={INPUT()} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={LBL}>Category</label>
                    <select value={docCategory} onChange={e => setDocCategory(e.target.value as DocCategory)} style={{ ...INPUT(), padding: '7px 10px' }}>
                      {DOC_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{DOC_CATEGORY_ICON[cat]} {DOC_CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <label style={LBL}>File *</label>
                    <input ref={docFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ ...INPUT(), padding: '6px 10px', fontSize: 11, color: 'var(--t-muted)' }} />
                  </div>
                </div>
                {docUploadError && <p style={{ margin: 0, fontSize: 11, color: '#e07070' }}>{docUploadError}</p>}
                <button type="button" onClick={handleDocUpload} disabled={docUploading}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: docUploading ? 'var(--t-muted)' : 'var(--t-bg)', background: docUploading ? 'var(--t-gold-20)' : 'var(--t-gold)', border: 'none', borderRadius: 3, padding: '8px 14px', cursor: docUploading ? 'not-allowed' : 'pointer', alignSelf: 'flex-end' }}>
                  {docUploading ? 'Uploading…' : '↑ Upload & attach'}
                </button>
              </div>
            ) : (
              <select
                value={draft.docLabel}
                onChange={e => setDraft(d => ({ ...d, docLabel: e.target.value }))}
                style={{ ...INPUT(), padding: '8px 10px' }}
              >
                <option value="">— none —</option>
                {docLabels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
          </div>
          )}

          {/* Tag/Cost + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-[12px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Amount</label>
              <input type="text" placeholder="e.g. ₹500 or Free" value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Status</label>
              <select value={draft.tagVariant} onChange={e => setDraft(d => ({ ...d, tagVariant: e.target.value as TagVariant }))} style={{ ...INPUT(), padding: '8px 10px' }}>
                <option value="default">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="free">Free</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={cancelEvent} style={BTN_CANCEL}>Cancel</button>
            <button type="button" onClick={handleSubmitEvent} style={BTN_SAVE}>{editing ? 'Save' : 'Add'}</button>
          </div>
        </div>
        </div>
      )}

      {/* Conflict modal */}
      {conflict && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={() => setConflict(null)}
        >
          <div
            className="luxury-card"
            style={{ maxWidth: 420, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Time conflict
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--t-fg)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--t-gold)' }}>{draft.time}</strong> overlaps with an existing event:
              </p>
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--t-w04)', borderLeft: '2px solid var(--t-gold-40)', borderRadius: 2 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-gold)' }}>{conflict.time}</div>
                <div style={{ fontSize: 13, color: 'var(--t-fg)', marginTop: 2 }}>{conflict.title}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--t-muted)' }}>What would you like to do?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConflict(null)}
                style={{ ...BTN_SAVE, textAlign: 'center' }}
              >
                Change my time
              </button>
              <button
                type="button"
                onClick={() => handleConflictEditExisting(conflict)}
                style={{ ...BTN_CANCEL, textAlign: 'center' }}
              >
                Edit existing event instead
              </button>
              <button
                type="button"
                onClick={handleSubmitForce}
                style={{ ...BTN_CANCEL, textAlign: 'center', color: 'var(--t-muted-60)', borderColor: 'var(--t-w06)' }}
              >
                Add anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
