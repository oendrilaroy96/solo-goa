interface Link {
  label: string;
  url: string;
}

interface Props {
  status: string;
  name: string;
  details: string;
  links?: Link[];
  isAlternative?: boolean;
  children?: React.ReactNode;
}

export default function StayCard({ status, name, details, links, isAlternative, children }: Props) {
  const accentColor = isAlternative ? 'var(--color-mustard)' : 'var(--color-monsoon)';
  const accentSoft  = isAlternative ? 'var(--color-mustard-soft)' : 'var(--color-monsoon-soft)';
  const statusColor = isAlternative ? 'var(--color-mustard)' : 'var(--color-monsoon)';

  return (
    <div
      className="relative mt-3 first:mt-0 rounded-[12px] border-2 border-line overflow-hidden"
      style={{
        background: 'var(--color-paper)',
        boxShadow: '2px 3px 0 rgba(100,60,20,.08), 3px 6px 14px rgba(60,30,10,.07)',
      }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      <div className="pl-4 pr-3.5 py-3 sm:pl-5 sm:pr-4 sm:py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-1.5">
          <small
            className="font-mono font-bold uppercase tracking-[.07em] text-[9.5px] px-2 py-0.5 rounded-full border sm:text-[10px]"
            style={{ background: accentSoft, color: statusColor, borderColor: accentColor, opacity: 0.85 }}
          >
            {status}
          </small>
          {links && links.length > 0 && (
            <p className="m-0 flex flex-wrap gap-x-3">
              {links.map(l => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-[10.5px] text-azulejo border-b border-dotted border-azulejo no-underline hover:border-solid"
                >
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
        <strong className="block text-[14px] text-ink font-semibold mt-1.5 leading-snug sm:text-[14.5px]">{name}</strong>
        <span className="block text-muted text-[12px] mt-1 leading-relaxed sm:text-[12.5px]">{details}</span>
        {children}
      </div>
    </div>
  );
}
