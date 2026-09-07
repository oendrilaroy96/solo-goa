import type { DayData } from '../data/itinerary';
import EventItem from './EventItem';

interface Props {
  day: DayData;
  onlyOpen: boolean;
}

export default function DayPanel({ day, onlyOpen }: Props) {
  const events = day.events;
  const openCount = events.filter(e => e.tagVariant === 'pending').length;
  const confirmedCount = events.length - openCount;

  return (
    <section style={{ borderTop: '1px solid rgba(201,168,76,.2)', paddingTop: 32 }}>
      {/* Day header */}
      <div className="flex flex-wrap gap-4 items-start mb-6 sm:gap-6 sm:mb-8">
        {/* Large day number */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 48,
            color: 'rgba(201,168,76,.25)',
            fontWeight: 700,
            lineHeight: 1,
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          {day.day}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <h2
            className="m-0 text-[22px]"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
          >
            {day.weekday}
          </h2>
          <p className="m-0 mt-1 text-[13px] leading-snug" style={{ color: '#8a8070' }}>{day.subtitle}</p>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="font-mono text-[10px] font-semibold px-2.5 py-1"
              style={{
                color: '#c9a84c',
                background: 'rgba(201,168,76,.08)',
                border: '1px solid rgba(201,168,76,.2)',
              }}
            >
              {day.weather}
            </span>
            <span
              className="font-mono text-[10px] font-semibold px-2.5 py-1"
              style={{
                color: '#8a8070',
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              {confirmedCount} set
            </span>
            {openCount > 0 && (
              <span
                className="font-mono text-[10px] font-semibold px-2.5 py-1"
                style={{
                  color: '#8a8070',
                  background: 'rgba(255,255,255,.04)',
                  border: '1px dashed rgba(255,255,255,.12)',
                }}
              >
                {openCount} open
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="relative pl-6"
        style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}
      >
        {events.map(event => (
          <EventItem key={event.time + event.title} event={event} hideIfSettled={onlyOpen} />
        ))}
      </div>
    </section>
  );
}
