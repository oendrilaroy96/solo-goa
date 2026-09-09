import type { TagVariant } from '../data/itinerary';

interface Props {
  label: string;
  variant: TagVariant;
}

export default function Tag({ label, variant }: Props) {
  const base = 'inline-block whitespace-nowrap rounded-sm px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wide uppercase border';
  const styles: Record<TagVariant, string> = {
    default: 'bg-[var(--t-gold-10)] text-[var(--t-gold)] border-[var(--t-gold-25)]',
    free:    'bg-[rgba(106,138,106,.1)] text-[#6a9a6a] border-[rgba(106,138,106,.25)]',
    pending: 'bg-[var(--t-w05)] text-[var(--t-muted)] border-[var(--t-w10)] border-dashed',
  };
  return <span className={`${base} ${styles[variant]}`}>{label}</span>;
}
