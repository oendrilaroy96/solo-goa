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
  const accentBorder = isAlternative
    ? '3px solid var(--t-w10)'
    : '3px solid var(--t-gold-40)';

  return (
    <div
      className="luxury-card relative mt-3 first:mt-0"
      style={{ borderLeft: accentBorder }}
    >
      <div className="pl-4 pr-4 py-3.5 sm:pl-5 sm:pr-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <small
            className="font-mono font-bold uppercase tracking-[.08em]"
            style={{ fontSize: 9.5, color: isAlternative ? 'var(--t-muted)' : 'var(--t-gold)', letterSpacing: '0.1em' }}
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
                  className="font-mono text-[10.5px] no-underline hover:border-solid"
                  style={{
                    color: 'var(--t-gold)',
                    borderBottom: '1px dotted var(--t-gold-50)',
                  }}
                >
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
        <strong
          className="block text-[14.5px] font-semibold leading-snug"
          style={{ color: 'var(--t-fg)' }}
        >
          {name}
        </strong>
        <span
          className="block mt-1 leading-relaxed"
          style={{ fontSize: 12.5, color: 'var(--t-muted)' }}
        >
          {details}
        </span>
        {children}
      </div>
    </div>
  );
}
