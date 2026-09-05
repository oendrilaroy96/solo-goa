import type { TagVariant } from '../data/itinerary';

interface Props {
  label: string;
  variant: TagVariant;
}

export default function Tag({ label, variant }: Props) {
  const base = 'inline-block whitespace-nowrap rounded-[6px] px-2 py-0.5 text-[10.5px] font-mono font-semibold leading-tight border';
  const styles: Record<TagVariant, string> = {
    default: 'bg-mustard-soft text-mustard border-mustard border-opacity-30',
    free: 'bg-monsoon-soft text-monsoon border-monsoon border-opacity-30',
    pending: 'bg-azulejo-soft text-azulejo border-azulejo border-dashed',
  };
  return <span className={`${base} ${styles[variant]}`}>{label}</span>;
}
