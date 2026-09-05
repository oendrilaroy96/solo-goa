import { shopGroups } from '../data/shopping';
import StayCard from '../components/StayCard';

export default function ShoppingPage() {
  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: 'linear-gradient(160deg, #fffef8 0%, #fef3d0 100%)' }}
    >
      {/* Washi tape strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{ background: 'rgba(232,190,96,.45)', borderBottom: '1px solid rgba(122,88,0,.2)' }}
      />

      <div className="p-4 sm:p-6">
        <h2 className="m-0 mb-0.5 font-serif font-semibold italic text-xl text-ink sm:text-[22px]">Shopping reference</h2>
        <p className="text-muted mt-0.5 mb-4 text-[12.5px] sm:text-[13.5px]">General research, not scheduled — nothing here is booked or planned into a day</p>

        {shopGroups.map(group => (
          <div key={group.title} className="first:mt-0 mt-6">
            <h3
              className="font-semibold text-[14px] text-muted uppercase tracking-[.08em] mb-2.5 mt-0 sm:text-[13px]"
              style={{ fontFamily: 'var(--font-mono)' }}
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
      </div>
    </section>
  );
}
