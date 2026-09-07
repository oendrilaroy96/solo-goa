import { foodGroups } from '../data/food';
import StayCard from '../components/StayCard';

export default function FoodPage() {
  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
      >
        Food &amp; drink reference
      </h2>
      <p className="mt-1 mb-8 text-[13px]" style={{ color: '#8a8070' }}>
        Every restaurant or bar you've named, with the meal it's for and its speciality
      </p>

      {foodGroups.map(group => (
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
                    style={{ background: 'rgba(201,168,76,.1)', color: '#c9a84c', borderColor: 'rgba(201,168,76,.25)' }}
                  >
                    {t}
                  </span>
                ))}
              </p>
            </StayCard>
          ))}
        </div>
      ))}
    </section>
  );
}
