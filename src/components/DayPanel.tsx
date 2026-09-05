import type { DayData } from '../data/itinerary';
import EventItem from './EventItem';

interface Props {
  day: DayData;
  onlyOpen: boolean;
}

// Alternate the card tint per day for a scrapbook paper variety feel
const CARD_TINTS = [
  'linear-gradient(160deg, #fffef8 0%, #fdf8f0 100%)',
  'linear-gradient(160deg, #f0f8ff 0%, #eff5fb 100%)',
  'linear-gradient(160deg, #fffef8 0%, #fefaf2 100%)',
  'linear-gradient(160deg, #f2fdf5 0%, #edf8f0 100%)',
  'linear-gradient(160deg, #fffef8 0%, #fdf8f0 100%)',
];

export default function DayPanel({ day, onlyOpen }: Props) {
  const events = day.events;
  const openCount = events.filter(e => e.tagVariant === 'pending').length;
  const confirmedCount = events.length - openCount;
  const tintIdx = parseInt(day.day) % CARD_TINTS.length;

  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: CARD_TINTS[tintIdx] }}
    >
      {/* Washi tape header strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{
          background: 'rgba(255,240,160,.55)',
          borderBottom: '1px solid rgba(200,180,60,.2)',
        }}
      />

      <div className="p-4 sm:p-6">
        {/* Day header */}
        <div className="flex flex-wrap gap-2 items-start mb-4 sm:gap-4 sm:mb-5">
          {/* Stamp-style date badge */}
          <div
            className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-laterite font-mono leading-none sm:w-[56px] sm:h-[56px]"
            aria-hidden="true"
            style={{ background: '#fde8e2' }}
          >
            <span className="text-[17px] font-bold tabular-nums text-laterite sm:text-[20px]">{day.day}</span>
            <span className="text-[7px] tracking-[.12em] mt-0.5 text-muted font-bold uppercase">SEP</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="m-0 font-serif font-semibold text-xl text-ink sm:text-[22px]"
              style={{ fontStyle: 'italic' }}
            >
              {day.weekday}
            </h2>
            <p className="text-muted m-0 mt-0.5 text-[12px] leading-snug sm:text-[13px]">{day.subtitle}</p>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto sm:self-center">
            <span
              className="font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full border border-monsoon sm:text-[10.5px]"
              style={{ background: 'var(--color-monsoon-soft)', color: 'var(--color-monsoon)' }}
            >
              {day.weather}
            </span>
            <span
              className="font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full border border-monsoon sm:text-[10.5px]"
              style={{ background: 'var(--color-monsoon-soft)', color: 'var(--color-monsoon)' }}
            >
              {confirmedCount} set
            </span>
            {openCount > 0 && (
              <span
                className="font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full border border-azulejo sm:text-[10.5px]"
                style={{ background: 'var(--color-azulejo-soft)', color: 'var(--color-azulejo)' }}
              >
                {openCount} open
              </span>
            )}
          </div>
        </div>

        {/* Timeline — dashed line for scrapbook feel */}
        <div className="relative pl-[18px] sm:pl-[22px]">
          {/* Dashed vertical line */}
          <div
            className="absolute left-[3px] top-1 bottom-2 w-px sm:left-1"
            style={{ borderLeft: '2px dashed var(--color-line)' }}
            aria-hidden="true"
          />
          {events.map(event => (
            <EventItem key={event.time + event.title} event={event} hideIfSettled={onlyOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}
