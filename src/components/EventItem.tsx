import React from 'react';
import type { EventItem as EventData } from '../data/itinerary';
import { CATEGORY_ICON, CATEGORY_LABEL } from '../data/itinerary';
import Tag from './Tag';

interface Props {
  event: EventData;
  hideIfSettled?: boolean;
  onOpenDoc?: (label: string) => void;
  onOpenBoardingPass?: (label: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ── shared sub-components ────────────────────────────────────────────────────

function CategoryChips({ event }: { event: EventData }) {
  if (!event.categories?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
      {event.categories.map(cat => (
        <span
          key={cat}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--t-muted)',
            background: 'var(--t-w05)',
            border: '1px solid var(--t-w10)',
            borderRadius: 2,
            padding: '2px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span aria-hidden="true">{CATEGORY_ICON[cat]}</span>
          {CATEGORY_LABEL[cat]}
        </span>
      ))}
    </div>
  );
}

function ContactLinks({ event, small }: { event: EventData; small?: boolean }) {
  const fs = small ? 10 : 10.5;
  const items: { href: string; label: string }[] = [];
  if (event.mapUrl)  items.push({ href: event.mapUrl,             label: '📍 Map' });
  if (event.phone)   items.push({ href: `tel:${event.phone}`,     label: `📞 ${event.phone}` });
  if (event.email)   items.push({ href: `mailto:${event.email}`,  label: `✉ ${event.email}` });
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
      {items.map(it => (
        <a
          key={it.href}
          href={it.href}
          target={it.href.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: fs,
            color: 'var(--t-gold)',
            textDecoration: 'none',
            borderBottom: '1px dotted var(--t-gold-40)',
          }}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

const DOC_BTN_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--t-gold)',
  background: 'var(--t-gold-08)',
  border: '1px solid var(--t-gold-25)',
  borderRadius: 3,
  padding: '3px 8px',
  cursor: 'pointer',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

export default function EventItem({ event, hideIfSettled, onOpenDoc, onOpenBoardingPass, onEdit, onDelete }: Props) {
  const isSettled = event.tagVariant !== 'pending';
  if (hideIfSettled && isSettled) return null;

  const hasHtml = (event.description ?? '').includes('<');
  const isTransport = event.categories?.includes('transport');

  const docBtns = (
    <>
      {event.docLabel && onOpenDoc && (
        <button type="button" onClick={() => onOpenDoc(event.docLabel!)} title="View ticket / document" style={DOC_BTN_STYLE}>
          🎫 {isTransport ? 'Ticket' : 'Doc'}
        </button>
      )}
      {event.boardingPassDocLabel && onOpenBoardingPass && (
        <button type="button" onClick={() => onOpenBoardingPass(event.boardingPassDocLabel!)} title="View boarding pass" style={DOC_BTN_STYLE}>
          🛫 Boarding Pass
        </button>
      )}
    </>
  );

  return (
    <article
      className="relative mb-5
        before:content-[''] before:absolute before:-left-[19px] before:top-[5px]
        before:w-[6px] before:h-[6px] before:rounded-full
        before:border-2 before:border-[var(--t-gold-50)] before:bg-transparent"
    >
      {/* Time chip — mobile only */}
      <div className="inline-flex items-center mb-1 font-mono text-[10px] font-semibold w-fit sm:hidden" style={{ color: 'var(--t-gold)' }}>
        {event.time}
      </div>

      {/* Desktop: 3-col layout */}
      <div className="hidden sm:grid sm:grid-cols-[minmax(120px,160px)_1fr_auto] sm:gap-4 sm:items-baseline">
        <div className="font-mono text-[11.5px] font-medium" style={{ color: 'var(--t-gold)', wordBreak: 'break-word' }}>{event.time}</div>
        <div>
          <h3 className="mt-0 mb-0 text-[14px] font-semibold leading-snug" style={{ color: 'var(--t-fg)' }}>{event.title}</h3>
          <CategoryChips event={event} />
          {hasHtml ? (
            <div
              className="text-[13px] mt-1 [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10.5px] [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:mr-2.5 [&_a:hover]:border-solid [&_strong]:font-semibold"
              style={{ color: 'var(--t-muted)' }}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          ) : (
            <p className="text-[13px] m-0 mt-1 leading-snug" style={{ color: 'var(--t-muted)' }}>{event.description}</p>
          )}
          <ContactLinks event={event} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag label={event.tag} variant={event.tagVariant} />
          {docBtns}
          {onEdit && (
            <button type="button" onClick={onEdit} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', lineHeight: 1 }}>✏</button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} title="Delete" style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 15, padding: '2px 4px', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="sm:hidden">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h3 className="mt-0 mb-0 text-[13.5px] font-semibold leading-snug" style={{ color: 'var(--t-fg)' }}>{event.title}</h3>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {onEdit && <button type="button" onClick={onEdit} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>✏</button>}
            {onDelete && <button type="button" onClick={onDelete} title="Delete" style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}>×</button>}
          </div>
        </div>
        <CategoryChips event={event} />
        {hasHtml ? (
          <div
            className="text-[12px] mt-1 [&_p]:m-0 [&_a]:font-mono [&_a]:text-[10px] [&_a]:no-underline [&_a]:border-b [&_a]:border-dotted [&_a]:mr-2 [&_strong]:font-semibold"
            style={{ color: 'var(--t-muted)' }}
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : (
          <p className="text-[12px] m-0 mt-1 leading-snug" style={{ color: 'var(--t-muted)' }}>{event.description}</p>
        )}
        <ContactLinks event={event} small />
        <div className="mt-1.5 flex items-center gap-2">
          <Tag label={event.tag} variant={event.tagVariant} />
          {docBtns}
        </div>
      </div>
    </article>
  );
}
