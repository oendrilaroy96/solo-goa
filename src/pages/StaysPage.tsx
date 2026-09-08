import { useState } from 'react';
import { stays } from '../data/stays';
import StayCard from '../components/StayCard';

const TAB_STYLE = (active: boolean) => ({
  padding: '8px 18px 10px',
  background: 'transparent',
  border: 0,
  borderBottom: active ? '2px solid #c9a84c' : '2px solid transparent',
  marginBottom: -1,
  color: active ? '#c9a84c' : '#8a8070',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function StaysPage() {
  const [tab, setTab] = useState<'booked' | 'suggestions'>('booked');

  const booked      = stays.filter(s => !s.isAlternative);
  const suggestions = stays.filter(s => s.isAlternative);
  const visible     = tab === 'booked' ? booked : suggestions;

  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
      >
        Stays
      </h2>

      {/* Tabs */}
      <div
        style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 32, marginTop: 16 }}
        role="tablist"
      >
        <button type="button" role="tab" aria-selected={tab === 'booked'} onClick={() => setTab('booked')} style={TAB_STYLE(tab === 'booked')}>
          Booked
        </button>
        <button type="button" role="tab" aria-selected={tab === 'suggestions'} onClick={() => setTab('suggestions')} style={TAB_STYLE(tab === 'suggestions')}>
          Suggestions
        </button>
      </div>

      {visible.map(stay => {
        const links = [
          stay.mapUrl     ? { label: 'Map',     url: stay.mapUrl     } : null,
          stay.websiteUrl ? { label: 'Website', url: stay.websiteUrl } : null,
        ].filter(Boolean) as { label: string; url: string }[];
        return (
          <StayCard
            key={stay.name}
            status={stay.status}
            name={stay.name}
            details={stay.details}
            links={links}
            isAlternative={stay.isAlternative}
          />
        );
      })}
    </section>
  );
}
