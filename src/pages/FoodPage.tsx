import { foodGroups } from '../data/food';
import StayCard from '../components/StayCard';

export default function FoodPage() {
  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: 'linear-gradient(160deg, #fffef8 0%, #f2fdf5 100%)' }}
    >
      {/* Washi tape strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{ background: 'rgba(106,200,144,.35)', borderBottom: '1px solid rgba(42,122,80,.2)' }}
      />

      <div className="p-4 sm:p-6">
        <h2 className="m-0 mb-0.5 font-serif font-semibold italic text-xl text-ink sm:text-[22px]">Food & drink reference</h2>
        <p className="text-muted mt-0.5 mb-4 text-[12.5px] sm:text-[13.5px]">Every restaurant or bar you've named, with the meal it's for and its speciality</p>

        {foodGroups.map(group => (
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
                isAlternative={item.isAlternative}
              >
                <p className="flex flex-wrap gap-1.5 mt-1.5 mb-0">
                  {item.tags.map(t => (
                    <span key={t} className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold border border-mustard bg-mustard-soft text-mustard">{t}</span>
                  ))}
                  {item.specialityTags.map(t => (
                    <span key={t} className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold border border-azulejo bg-azulejo-soft text-azulejo">{t}</span>
                  ))}
                </p>
              </StayCard>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
