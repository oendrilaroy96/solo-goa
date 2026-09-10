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
  onOpenBoardingPass?: (label: string) => void;
  onEditEvent?: (ev: EventItem) => void;
  onDeleteEvent?: (evId: string) => void;
}

export default function DayPanel({ day, onlyOpen, onOpenDoc, onOpenBoardingPass, onEditEvent, onDeleteEvent }: Props) {
  const openCount = day.events.filter(e => e.tagVariant === 'pending').length;
  const confirmedCount = day.events.length - openCount;
  const sorted = [...day.events].sort((a, b) => parseTime(a.time) - parseTime(b.time));

  return (
    <section style={{ borderTop: '1px solid var(--t-gold-20)', paddingTop: 32 }}>
      {/* Day header */}
      <div className="flex flex-wrap gap-4 items-start mb-6 sm:gap-6 sm:mb-8">
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 48, color: 'var(--t-gold-25)', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}
          aria-hidden="true"
        >
          {day.day}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <h2 className="m-0 text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}>
            {day.weekday}
          </h2>
          <p className="m-0 mt-1 text-[13px] leading-snug" style={{ color: 'var(--t-muted)' }}>{day.subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: 'var(--t-gold)', background: 'var(--t-gold-08)', border: '1px solid var(--t-gold-20)' }}>
              {day.weather}
            </span>
            <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px solid var(--t-w08)' }}>
              {confirmedCount} set
            </span>
            {openCount > 0 && (
              <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: 'var(--t-muted)', background: 'var(--t-w04)', border: '1px dashed var(--t-w12)' }}>
                {openCount} open
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6" style={{ borderLeft: '1px solid var(--t-w08)' }}>
        {sorted.map(ev => (
          <EventItemComponent
            key={ev.id ?? ev.time + ev.title}
            event={ev}
            hideIfSettled={onlyOpen}
            onOpenDoc={onOpenDoc}
            onOpenBoardingPass={onOpenBoardingPass}
            onEdit={onEditEvent ? () => onEditEvent(ev) : undefined}
            onDelete={onDeleteEvent && ev.id ? () => onDeleteEvent(ev.id!) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
