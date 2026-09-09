import { useState } from 'react';
import { foodGroups } from '../data/food';
import type { FoodItem } from '../data/food';
import StayCard from '../components/StayCard';

const TAB_STYLE = (active: boolean) => ({
  padding: '8px 18px 10px',
  background: 'transparent',
  border: 0,
  borderBottom: active ? '2px solid var(--t-gold)' : '2px solid transparent',
  marginBottom: -1,
  color: active ? 'var(--t-gold)' : 'var(--t-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

function FoodItemCard({ item }: { item: FoodItem }) {
  return (
    <StayCard
      status={item.status}
      name={item.name}
      details={item.details}
      links={item.links}
      isAlternative={item.isAlternative}
    >
      <p className="flex flex-wrap gap-1.5 mt-2 mb-0">
        {item.tags.map(t => (
          <span
            key={t}
            className="inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-mono font-semibold border"
            style={{ background: 'rgba(160,120,64,.1)', color: '#a07840', borderColor: 'rgba(160,120,64,.25)' }}
          >
            {t}
          </span>
        ))}
        {item.specialityTags.map(t => (
          <span
            key={t}
            className="inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-mono font-semibold border"
            style={{ background: 'var(--t-gold-10)', color: 'var(--t-gold)', borderColor: 'var(--t-gold-25)' }}
          >
            {t}
          </span>
        ))}
      </p>
    </StayCard>
  );
}

export default function FoodPage() {
  const [tab, setTab] = useState<'planned' | 'suggestions'>('planned');

  // Split each group into planned vs suggestions, drop empty groups
  const plannedGroups = foodGroups
    .map(g => ({ ...g, items: g.items.filter(i => !i.isAlternative) }))
    .filter(g => g.items.length);

  const suggestionGroups = foodGroups
    .map(g => ({ ...g, items: g.items.filter(i => i.isAlternative) }))
    .filter(g => g.items.length);

  const groups = tab === 'planned' ? plannedGroups : suggestionGroups;

  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}
      >
        Food &amp; drink
      </h2>

      {/* Tabs */}
      <div
        style={{ display: 'flex', borderBottom: '1px solid var(--t-w07)', marginBottom: 32, marginTop: 16 }}
        role="tablist"
      >
        <button type="button" role="tab" aria-selected={tab === 'planned'} onClick={() => setTab('planned')} style={TAB_STYLE(tab === 'planned')}>
          Planned
        </button>
        <button type="button" role="tab" aria-selected={tab === 'suggestions'} onClick={() => setTab('suggestions')} style={TAB_STYLE(tab === 'suggestions')}>
          Suggestions
        </button>
      </div>

      {groups.map(group => (
        <div key={group.title} className="first:mt-0 mt-10">
          <h3
            className="font-semibold uppercase tracking-[.1em] mb-4 mt-0 text-[10px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--t-gold)' }}
          >
            {group.title}
          </h3>
          {group.items.map(item => (
            <FoodItemCard key={item.name} item={item} />
          ))}
        </div>
      ))}
    </section>
  );
}
