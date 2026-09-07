import { stays } from '../data/stays';
import StayCard from '../components/StayCard';

export default function StaysPage() {
  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
      >
        Stays
      </h2>
      <p className="mt-1 mb-8 text-[13px]" style={{ color: '#8a8070' }}>
        Confirmed bookings and alternatives
      </p>

      {stays.map(stay => {
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
