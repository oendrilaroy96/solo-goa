import type { TagVariant } from '../data/itinerary';

interface Props {
  label: string;
  variant: TagVariant;
}

export default function Tag({ label, variant }: Props) {
  const base = 'inline-block whitespace-nowrap rounded-sm px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wide uppercase border';
  const styles: Record<TagVariant, string> = {
    default: 'bg-[rgba(201,168,76,.1)] text-[#c9a84c] border-[rgba(201,168,76,.25)]',
    free:    'bg-[rgba(106,138,106,.1)] text-[#6a9a6a] border-[rgba(106,138,106,.25)]',
    pending: 'bg-[rgba(255,255,255,.05)] text-[#8a8070] border-[rgba(255,255,255,.1)] border-dashed',
  };
  return <span className={`${base} ${styles[variant]}`}>{label}</span>;
}
