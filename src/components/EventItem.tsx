import type { EventItem as EventData } from '../data/itinerary';
import Tag from './Tag';

interface Props {
  event: EventData;
  hideIfSettled?: boolean;
}

export default function EventItem({ event, hideIfSettled }: Props) {
  const isSettled = event.tagVariant !== 'pending';
  if (hideIfSettled && isSettled) return null;

  const hasHtml = event.description.includes('<');

  return (
    /* Mobile: stacked · sm: 3-col grid */
    <article className="relative pb-4 sm:pb-5
      before:content-[''] before:absolute before:-left-[17px] before:top-[5px] before:w-[7px] before:h-[7px] before:rounded-full before:bg-azulejo before:shadow-[0_0_0_3px_var(--color-azulejo-soft)]
      sm:before:-left-[21px] sm:before:top-[6px] sm:before:w-2 sm:before:h-2 sm:before:shadow-[0_0_0_4px_var(--color-azulejo-soft)]"
    >
      {/* Time chip */}
      <div className="inline-flex items-center mb-1 font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-azulejo-soft text-azulejo w-fit sm:hidden">
        {event.time}
      </div>

      {/* Desktop: 3-col layout */}
      <div className="hidden sm:grid sm:grid-cols-[96px_1fr_auto] sm:gap-3.5 sm:items-start">
        <div className="font-mono text-[12px] font-medium text-azulejo tabular-nums pt-0.5">{event.time}</div>
        <div>
          <h3 className="mt-0 mb-0.5 text-[15px] font-semibold text-ink">{event.title}</h3>
          {hasHtml ? (
            <div
              className="text-muted text-[13px] [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10.5px] [&_a]:text-azulejo [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:border-azulejo [&_a]:mr-2.5 [&_a:hover]:border-solid [&_strong]:font-semibold [&_strong]:text-ink"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          ) : (
            <p className="text-muted text-[13px] m-0">{event.description}</p>
          )}
        </div>
        <Tag label={event.tag} variant={event.tagVariant} />
      </div>

      {/* Mobile: stacked layout */}
      <div className="sm:hidden">
        <h3 className="mt-0 mb-0.5 text-[14.5px] font-semibold text-ink leading-snug">{event.title}</h3>
        {hasHtml ? (
          <div
            className="text-muted text-[12.5px] [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10.5px] [&_a]:text-azulejo [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:border-azulejo [&_a]:mr-2 [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : (
          <p className="text-muted text-[12.5px] m-0">{event.description}</p>
        )}
        <div className="mt-1.5">
          <Tag label={event.tag} variant={event.tagVariant} />
        </div>
      </div>
    </article>
  );
}
