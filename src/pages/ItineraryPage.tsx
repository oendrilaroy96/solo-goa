import { useState, useEffect } from 'react';
import { days } from '../data/itinerary';
import type { TagVariant } from '../data/itinerary';
import DayPanel from '../components/DayPanel';
import { supabase } from '../lib/supabase';

const SUPA_KEY = 'custom_events';

export interface CustomEvent {
  id: string;
  day: string;
  time: string;
  title: string;
  description: string;
  tag: string;
  tagVariant: TagVariant;
}

function getStoredDay(): string {
  try { return localStorage.getItem('goaSelectedDay') || '14'; } catch { return '14'; }
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const BLANK = (): Omit<CustomEvent, 'id' | 'day'> => ({
  time: '',
  title: '',
  description: '',
  tag: '',
  tagVariant: 'default',
});

const INPUT = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: '#0d0d0d',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 2,
  padding: '8px 12px',
  color: '#f5f0e8',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  ...extra,
});

interface Props {
  onOpenDoc?: (label: string) => void;
}

export default function ItineraryPage({ onOpenDoc }: Props) {
  const [selectedDay, setSelectedDay] = useState(getStoredDay);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);

  // form state
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<CustomEvent | null>(null);
  const [draft, setDraft]         = useState(BLANK());

  const activeDay = days.find(d => d.day === selectedDay) || days[0];
  const todayDate = new Date();
  const isTrip    = todayDate.getFullYear() === 2026 && todayDate.getMonth() === 8;
  const todayStr  = isTrip ? String(todayDate.getDate()) : null;

  // Load from Supabase
  useEffect(() => {
    supabase.from('kv').select('value').eq('key', SUPA_KEY).maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) {
        setCustomEvents(data.value as CustomEvent[]);
      }
    });
  }, []);

  async function save(events: CustomEvent[]) {
    setCustomEvents(events);
    await supabase.from('kv').upsert({ key: SUPA_KEY, value: events });
  }

  function openAdd() {
    setEditing(null);
    setDraft(BLANK());
    setShowForm(true);
  }

  function openEdit(ev: CustomEvent) {
    setEditing(ev);
    setDraft({ time: ev.time, title: ev.title, description: ev.description, tag: ev.tag, tagVariant: ev.tagVariant });
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditing(null);
    setDraft(BLANK());
  }

  async function handleSubmit() {
    if (!draft.title.trim()) return;
    if (editing) {
      const next = customEvents.map(e => e.id === editing.id ? { ...editing, ...draft } : e);
      await save(next);
    } else {
      const next = [...customEvents, { id: newId(), day: selectedDay, ...draft }];
      await save(next);
    }
    cancel();
  }

  async function handleDelete(id: string) {
    await save(customEvents.filter(e => e.id !== id));
  }

  useEffect(() => {
    try { localStorage.setItem('goaSelectedDay', selectedDay); } catch { /* */ }
    // close form when switching days
    cancel();
  }, [selectedDay]);

  const dayCustomEvents = customEvents.filter(e => e.day === selectedDay);

  return (
    <div>
      {/* Day selector tabs */}
      <div
        className="flex gap-0 mb-8 overflow-x-auto pb-0"
        style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,.07)' }}
        role="tablist"
        aria-label="Select a day"
      >
        {days.map(d => {
          const isActive = d.day === selectedDay;
          const isToday  = d.day === todayStr;
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedDay(d.day)}
              className="relative shrink-0 cursor-pointer text-center transition-all focus-visible:outline-none"
              style={{
                padding: '10px 16px 12px',
                background: 'transparent',
                border: 0,
                borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span className="block font-mono text-[14px] font-semibold tabular-nums" style={{ color: isActive ? '#c9a84c' : '#8a8070' }}>
                {d.day}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[.06em] mt-0.5" style={{ color: isActive ? 'rgba(201,168,76,.7)' : 'rgba(138,128,112,.6)' }}>
                {d.weekday.slice(0, 3)}
              </span>
              {isToday && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} title="Today" />
              )}
            </button>
          );
        })}
      </div>

      <DayPanel
        day={activeDay}
        onlyOpen={false}
        onOpenDoc={onOpenDoc}
        customEvents={dayCustomEvents}
        onEditCustom={openEdit}
        onDeleteCustom={handleDelete}
      />

      {/* Add event button */}
      {!showForm && (
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
            color: '#c9a84c',
            background: 'rgba(201,168,76,.06)',
            border: '1px dashed rgba(201,168,76,.3)',
            borderRadius: 3,
            padding: '10px 20px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + Add event to {activeDay.weekday} {activeDay.day} Sep
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <div
          className="luxury-card"
          style={{ marginTop: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            {editing ? 'Edit event' : `New event — ${activeDay.weekday} ${activeDay.day} Sep`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time</label>
              <input type="text" placeholder="e.g. 3:00 PM" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title *</label>
              <input type="text" placeholder="What's happening?" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={INPUT()} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</label>
            <textarea
              placeholder="Optional details..."
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              rows={2}
              style={{ ...INPUT(), resize: 'vertical' as const }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tag / Cost</label>
              <input type="text" placeholder="e.g. ₹500 or Free" value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))} style={INPUT()} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</label>
              <select value={draft.tagVariant} onChange={e => setDraft(d => ({ ...d, tagVariant: e.target.value as TagVariant }))} style={{ ...INPUT(), padding: '8px 10px' }}>
                <option value="default">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="free">Free</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={cancel} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8070', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 3, padding: '8px 16px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d0d0d', background: '#c9a84c', border: 'none', borderRadius: 3, padding: '8px 20px', cursor: 'pointer' }}>
              {editing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
