export type DocCategory = 'flight' | 'train' | 'hotel' | 'cab' | 'activity' | 'payment';

export interface TravelDoc {
  id: string;
  label: string;          // e.g. "IndiGo 6E 634 — Kolkata → Goa"
  sublabel: string;       // e.g. "14 September · Ticket"
  category: DocCategory;
  file: string;           // filename inside /public/docs/, e.g. "indigo-ticket.pdf"
  isPdf?: boolean;        // defaults based on extension if not set
}

export const documents: TravelDoc[] = [
  // Placeholder entries — user will populate public/docs/ with real files
  // and update this list
];

export const CATEGORY_LABELS: Record<DocCategory, string> = {
  flight:   'Flight',
  train:    'Train',
  hotel:    'Hotel',
  cab:      'Cab & Transfer',
  activity: 'Activity',
  payment:  'Payment',
};

export const CATEGORY_ICON: Record<DocCategory, string> = {
  flight:   '✈️',
  train:    '🚂',
  hotel:    '🏨',
  cab:      '🚗',
  activity: '🎨',
  payment:  '💳',
};
