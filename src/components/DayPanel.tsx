import type { DayData } from '../data/itinerary';
import type { CustomEvent } from '../pages/ItineraryPage';
import EventItem from './EventItem';
import Tag from './Tag';

interface Props {
  day: DayData;
  onlyOpen: boolean;
  onOpenDoc?: (label: string) => void;
  customEvents?: CustomEvent[];
  onEditCustom?: (ev: CustomEvent) => void;
  onDeleteCustom?: (id: string) => void;
}

export default function DayPanel({ day, onlyOpen, onOpenDoc, customEvents = [], onEditCustom, onDeleteCustom }: Props) {
  const events     = day.events;
  const openCount  = events.filter(e => e.tagVariant === 'pending').length;
  const confirmedCount = events.length - openCount;

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
            {customEvents.length > 0 && (
              <span className="font-mono text-[10px] font-semibold px-2.5 py-1" style={{ color: '#8a8070', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                +{customEvents.length} added by you
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline — static events */}
      <div className="relative pl-6" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>
        {events.map(event => (
          <EventItem key={event.time + event.title} event={event} hideIfSettled={onlyOpen} onOpenDoc={onOpenDoc} />
        ))}

        {/* Custom events */}
        {customEvents.map(ev => (
          <article
            key={ev.id}
            className="relative mb-5
              before:content-[''] before:absolute before:-left-[19px] before:top-[5px]
              before:w-[6px] before:h-[6px] before:rounded-full
              before:border-2 before:border-[rgba(201,168,76,.8)] before:bg-[rgba(201,168,76,.2)]"
          >
            {/* Mobile time */}
            <div className="inline-flex items-center mb-1 font-mono text-[10px] font-semibold w-fit sm:hidden" style={{ color: '#c9a84c' }}>
              {ev.time}
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid sm:grid-cols-[100px_1fr_auto] sm:gap-4 sm:items-baseline">
              <div className="font-mono text-[11.5px] font-medium tabular-nums" style={{ color: '#c9a84c' }}>{ev.time}</div>
              <div>
                <h3 className="mt-0 mb-0 text-[14px] font-semibold leading-snug" style={{ color: '#f5f0e8' }}>{ev.title}</h3>
                {ev.description && <p className="text-[13px] m-0 mt-0.5 leading-snug" style={{ color: '#8a8070' }}>{ev.description}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {ev.tag && <Tag label={ev.tag} variant={ev.tagVariant} />}
                {onEditCustom && (
                  <button type="button" onClick={() => onEditCustom(ev)} title="Edit" style={{ background: 'none', border: 'none', color: '#8a8070', cursor: 'pointer', fontSize: 13, padding: '2px 4px', lineHeight: 1 }}>✏</button>
                )}
                {onDeleteCustom && (
                  <button type="button" onClick={() => onDeleteCustom(ev.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#8a8070', cursor: 'pointer', fontSize: 15, padding: '2px 4px', lineHeight: 1 }}>×</button>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:hidden">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <h3 className="mt-0 mb-0 text-[13.5px] font-semibold leading-snug" style={{ color: '#f5f0e8' }}>{ev.title}</h3>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {onEditCustom && (
                    <button type="button" onClick={() => onEditCustom(ev)} title="Edit" style={{ background: 'none', border: 'none', color: '#8a8070', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>✏</button>
                  )}
                  {onDeleteCustom && (
                    <button type="button" onClick={() => onDeleteCustom(ev.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#8a8070', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}>×</button>
                  )}
                </div>
              </div>
              {ev.description && <p className="text-[12px] m-0 mt-0.5 leading-snug" style={{ color: '#8a8070' }}>{ev.description}</p>}
              {ev.tag && <div className="mt-1.5"><Tag label={ev.tag} variant={ev.tagVariant} /></div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
