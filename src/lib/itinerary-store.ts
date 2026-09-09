import { supabase } from './supabase';
import type { DayData } from '../data/itinerary';
import { days as seedDays } from '../data/itinerary';

const KEY = 'itinerary_v2';

export function ensureIds(days: DayData[]): DayData[] {
  return days.map((d, di) => ({
    ...d,
    id: d.id ?? `day-${d.day || di}`,
    events: d.events.map((e, ei) => ({
      ...e,
      id: e.id ?? `${d.day || di}-ev-${ei}`,
    })),
  }));
}

export async function loadItinerary(): Promise<DayData[]> {
  const { data } = await supabase
    .from('kv')
    .select('value')
    .eq('key', KEY)
    .maybeSingle();

  if (data?.value && Array.isArray(data.value) && (data.value as DayData[]).length > 0) {
    return ensureIds(data.value as DayData[]);
  }

  // First run: seed from static data file
  const seeded = ensureIds(seedDays as DayData[]);
  await saveItinerary(seeded);
  return seeded;
}

export async function saveItinerary(days: DayData[]): Promise<void> {
  await supabase.from('kv').upsert({ key: KEY, value: days });
}

export function newEventId(): string {
  return 'ev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newDayId(day: string): string {
  return 'day-' + day + '-' + Math.random().toString(36).slice(2);
}
