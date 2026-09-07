import type { EventItem as EventData } from '../data/itinerary';
import Tag from './Tag';

interface Props {
  event: EventData;
  hideIfSettled?: boolean;
  onOpenDoc?: (label: string) => void;
}

export default function EventItem({ event, hideIfSettled, onOpenDoc }: Props) {
  const isSettled = event.tagVariant !== 'pending';
  if (hideIfSettled && isSettled) return null;

  const hasHtml = event.description.includes('<');

  return (
    /* Mobile: stacked · sm: 3-col grid */
    <article
      className="relative mb-5
        before:content-[''] before:absolute before:-left-[19px] before:top-[5px]
        before:w-[6px] before:h-[6px] before:rounded-full
        before:border-2 before:border-[rgba(201,168,76,.5)] before:bg-transparent"
    >
      {/* Time chip — mobile */}
      <div
        className="inline-flex items-center mb-1 font-mono text-[10px] font-semibold w-fit sm:hidden"
        style={{ color: '#c9a84c' }}
      >
        {event.time}
      </div>

      {/* Desktop: 3-col layout */}
      <div className="hidden sm:grid sm:grid-cols-[100px_1fr_auto] sm:gap-4 sm:items-baseline">
        <div className="font-mono text-[11.5px] font-medium tabular-nums" style={{ color: '#c9a84c' }}>{event.time}</div>
        <div>
          <h3 className="mt-0 mb-0 text-[14px] font-semibold leading-snug" style={{ color: '#f5f0e8' }}>{event.title}</h3>
          {hasHtml ? (
            <div
              className="text-[13px] mt-0.5 [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10.5px] [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:mr-2.5 [&_a:hover]:border-solid [&_strong]:font-semibold"
              style={{ color: '#8a8070' }}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          ) : (
            <p className="text-[13px] m-0 mt-0.5 leading-snug" style={{ color: '#8a8070' }}>{event.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag label={event.tag} variant={event.tagVariant} />
          {event.docLabel && onOpenDoc && (
            <button
              type="button"
              onClick={() => onOpenDoc(event.docLabel!)}
              title="View document"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#c9a84c',
                background: 'rgba(201,168,76,.08)',
                border: '1px solid rgba(201,168,76,.25)',
                borderRadius: 3,
                padding: '3px 7px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              📄
            </button>
          )}
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="sm:hidden">
        <h3 className="mt-0 mb-0 text-[13.5px] font-semibold leading-snug" style={{ color: '#f5f0e8' }}>{event.title}</h3>
        {hasHtml ? (
          <div
            className="text-[12px] mt-0.5 [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10px] [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:mr-2 [&_strong]:font-semibold"
            style={{ color: '#8a8070' }}
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : (
          <p className="text-[12px] m-0 mt-0.5 leading-snug" style={{ color: '#8a8070' }}>{event.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <Tag label={event.tag} variant={event.tagVariant} />
          {event.docLabel && onOpenDoc && (
            <button
              type="button"
              onClick={() => onOpenDoc(event.docLabel!)}
              title="View document"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#c9a84c',
                background: 'rgba(201,168,76,.08)',
                border: '1px solid rgba(201,168,76,.25)',
                borderRadius: 3,
                padding: '3px 7px',
                cursor: 'pointer',
              }}
            >
              📄
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
