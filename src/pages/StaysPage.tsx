import { stays } from '../data/stays';
import StayCard from '../components/StayCard';

export default function StaysPage() {
  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: 'linear-gradient(160deg, #fffef8 0%, #fdf8f0 100%)' }}
    >
      {/* Washi tape strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{ background: 'rgba(142,200,220,.45)', borderBottom: '1px solid rgba(80,160,200,.2)' }}
      />

      <div className="p-4 sm:p-6">
        <h2 className="m-0 mb-0.5 font-serif font-semibold italic text-xl text-ink sm:text-[22px]">Stays</h2>
        <p className="text-muted mt-0.5 mb-4 text-[12.5px] sm:text-[13.5px]">Confirmed bookings and alternatives</p>

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
      </div>
    </section>
  );
}
