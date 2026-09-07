import { shopGroups } from '../data/shopping';
import StayCard from '../components/StayCard';

export default function ShoppingPage() {
  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
      >
        Shopping reference
      </h2>
      <p className="mt-1 mb-8 text-[13px]" style={{ color: '#8a8070' }}>
        General research, not scheduled — nothing here is booked or planned into a day
      </p>

      {shopGroups.map(group => (
        <div key={group.title} className="first:mt-0 mt-10">
          <h3
            className="font-semibold uppercase tracking-[.1em] mb-4 mt-0 text-[10px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#c9a84c' }}
          >
            {group.title}
          </h3>
          {group.items.map(item => (
            <StayCard
              key={item.name}
              status={item.status}
              name={item.name}
              details={item.details}
              links={item.links}
              isAlternative
            />
          ))}
        </div>
      ))}
    </section>
  );
}
