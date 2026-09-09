import type { DayData, EventItem } from '../data/itinerary';
import EventItemComponent from './EventItem';

function parseTime(t: string): number {
  const clean = t.replace(/^[~]/, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 9999;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

interface Props {
  day: DayData;
  onlyOpen: boolean;
  onOpenDoc?: (label: string) => void;
  onEditEvent?: (ev: EventItem) => void;
  onDeleteEvent?: (evId: string) => void;
}

export default function DayPanel({ day, onlyOpen, onOpenDoc, onEditEvent, onDeleteEvent }: Props) {
  const openCount = day.events.filter(e => e.tagVariant === 'pending').length;
  const confirmedCount = day.events.length - openCount;
  const sorted = [...day.events].sort((a, b) => parseTime(a.time) - parseTime(b.time));

  return (
    <section style={{ borderTop: '1px solid rgba(201,168,76,.2)', paddingTop: 32 }}>
      {/* Day header */}
      <div className="flex flex-wrap gap-4 items-start mb-6 sm:gap-6 sm:mb-8">
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 48, color: 'rgba(201,168,76,.25)', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}
          aria-hidden="true"
        >
          {day.day}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <h2 className="m-0 text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}>
            {day.weekday}
          </h2>
          <p className="m-0 mt-1 text-[13px] leading-snug" style={{ color: '#8a8070' }}>{day.subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: '#c9a84c', background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)' }}>
              {day.weather}
            </span>
            <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: '#8a8070', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
              {confirmedCount} set
            </span>
            {openCount > 0 && (
              <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: '#8a8070', background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.12)' }}>
                {openCount} open
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>
        {sorted.map(ev => (
          <EventItemComponent
            key={ev.id ?? ev.time + ev.title}
            event={ev}
            hideIfSettled={onlyOpen}
            onOpenDoc={onOpenDoc}
            onEdit={onEditEvent ? () => onEditEvent(ev) : undefined}
            onDelete={onDeleteEvent && ev.id ? () => onDeleteEvent(ev.id!) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
