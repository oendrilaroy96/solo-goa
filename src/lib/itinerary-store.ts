import { supabase } from './supabase';
import type { DayData } from '../data/itinerary';

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

export async function loadItinerary(tripId: string): Promise<DayData[]> {
  const { data } = await supabase
    .from('trip_kv')
    .select('value')
    .eq('itinerary_id', tripId)
    .eq('key', KEY)
    .maybeSingle();

  if (data?.value && Array.isArray(data.value) && (data.value as DayData[]).length > 0) {
    return ensureIds(data.value as DayData[]);
  }

  return [];
}

export async function saveItinerary(tripId: string, days: DayData[]): Promise<void> {
  await supabase.from('trip_kv').upsert({ itinerary_id: tripId, key: KEY, value: days });
}

export function newEventId(): string {
  return 'ev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newDayId(day: string): string {
  return 'day-' + day + '-' + Math.random().toString(36).slice(2);
}
