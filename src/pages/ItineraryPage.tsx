import { useState, useEffect } from 'react';
import type { DayData, EventItem, TagVariant, EventCategory } from '../data/itinerary';
import { EVENT_CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '../data/itinerary';
import DayPanel from '../components/DayPanel';
import { loadItinerary, saveItinerary, newEventId, newDayId } from '../lib/itinerary-store';
import { supabase } from '../lib/supabase';

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
};
type DayDraft = { day: string; weekday: string; subtitle: string; weather: string };

const BLANK_EVENT = (): EventDraft => ({
  time: '', title: '', description: '', tag: '', tagVariant: 'default',
  categories: [], phone: '', email: '', mapUrl: '', docLabel: '',
});
const BLANK_DAY   = (): DayDraft   => ({ day: '', weekday: '', subtitle: '', weather: '' });

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
  tripId: string;
  onOpenDoc?: (label: string) => void;
}

export default function ItineraryPage({ tripId, onOpenDoc }: Props) {
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

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadItinerary(tripId).then(days => { setAllDays(days); setLoading(false); });
    supabase.from('documents').select('*').eq('itinerary_id', tripId).order('label').then(({ data, error }) => {
      if (error) console.error('docs fetch:', error);
      if (data) setDocLabels((data as { label: string }[]).map(d => d.label));
    });
  }, [tripId]);

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
    });
    setShowForm(true);
  }

  function cancelEvent() {
    setShowForm(false);
    setEditing(null);
    setDraft(BLANK_EVENT());
  }

  async function commitEvent() {
    if (!draft.title.trim() || !activeDay) return;
    const clean: Partial<EventItem> = {
      time: draft.time, title: draft.title, description: draft.description,
      tag: draft.tag, tagVariant: draft.tagVariant,
      categories: draft.categories.length ? draft.categories : undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      mapUrl: draft.mapUrl.trim() || undefined,
      docLabel: draft.docLabel.trim() || undefined,
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
    if (!dayDraft.day.trim() || !dayDraft.weekday.trim()) return;
    const newDay: DayData = { ...dayDraft, id: newDayId(dayDraft.day), events: [] };
    const next = [...allDays, newDay];
    await persist(next);
    setSelectedDay(dayDraft.day);
    setShowDayForm(false);
    setDayDraft(BLANK_DAY());
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
          onClick={() => setShowDayForm(v => !v)}
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
          <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr] gap-[10px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Day #</label>
              <input type="text" placeholder="19" value={dayDraft.day} onChange={e => setDayDraft(d => ({ ...d, day: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Weekday</label>
              <input type="text" placeholder="Saturday" value={dayDraft.weekday} onChange={e => setDayDraft(d => ({ ...d, weekday: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Weather</label>
              <input type="text" placeholder="☀ 28°C" value={dayDraft.weather} onChange={e => setDayDraft(d => ({ ...d, weather: e.target.value }))} style={INPUT()} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase' }}>Subtitle</label>
            <input type="text" placeholder="Short summary of the day" value={dayDraft.subtitle} onChange={e => setDayDraft(d => ({ ...d, subtitle: e.target.value }))} style={INPUT()} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowDayForm(false); setDayDraft(BLANK_DAY()); }} style={BTN_CANCEL}>Cancel</button>
            <button type="button" onClick={handleAddDay} style={BTN_SAVE}>Add</button>
          </div>
        </div>
      )}

      {/* Day panel */}
      {activeDay && (
        <DayPanel
          day={activeDay}
          onlyOpen={false}
          onOpenDoc={onOpenDoc}
          onEditEvent={openEdit}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {/* Add event button */}
      {!showForm && activeDay && (
        <button
          type="button"
          onClick={openAdd}
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--t-gold)',
            background: 'var(--t-gold-06)',
            border: '1px dashed var(--t-gold-30)',
            borderRadius: 3,
            padding: '10px 20px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + Add event to {activeDay.weekday} {activeDay.day}
        </button>
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

          {/* Doc picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={LBL}>Attach document</label>
            <select
              value={draft.docLabel}
              onChange={e => setDraft(d => ({ ...d, docLabel: e.target.value }))}
              style={{ ...INPUT(), padding: '8px 10px' }}
            >
              <option value="">— none —</option>
              {docLabels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Tag/Cost + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-[12px]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={LBL}>Tag / Cost</label>
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
