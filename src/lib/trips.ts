import { supabase } from './supabase';

export type TripType = 'solo' | 'friends' | 'family' | 'couple' | 'work';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  date_from: string;
  date_to: string;
  cover_emoji: string;
  cover_image?: string;
  trip_type?: TripType;
  people_count?: number;
  geo_country?: string;
  geo_country_code?: string;
  geo_state?: string;
  geo_city?: string;
  geo_lat?: number;
  geo_lon?: number;
  travel_mode?: 'flight' | 'train' | 'bus' | 'car' | 'ferry';
  travel_from?: string;
  created_at: string;
}

export async function listTrips(): Promise<Trip[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Own trips
  const { data: own } = await supabase
    .from('itineraries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  // Shared trips (accepted invites matching user email)
  const { data: invites } = await supabase
    .from('trip_invites').select('itinerary_id').eq('invited_email', user.email!).not('accepted_at', 'is', null);

  let shared: Trip[] = [];
  if (invites && invites.length > 0) {
    const ids = invites.map((i: { itinerary_id: string }) => i.itinerary_id);
    const { data: sharedData } = await supabase.from('itineraries').select('*').in('id', ids);
    shared = (sharedData ?? []) as Trip[];
  }

  // Merge, deduplicate by id (own trips take precedence)
  const ownIds = new Set((own ?? []).map((t: Trip) => t.id));
  const deduped = shared.filter(t => !ownIds.has(t.id));
  return [...(own ?? []) as Trip[], ...deduped].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createTrip(t: Omit<Trip, 'id' | 'created_at'>): Promise<Trip | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('itineraries').insert({ ...t, user_id: user.id }).select().single();
  if (error) console.error('[createTrip]', error);
  return data as Trip | null;
}

export async function deleteTrip(id: string) {
  return supabase.from('itineraries').delete().eq('id', id);
}

export async function updateTrip(id: string, t: Partial<Omit<Trip, 'id' | 'created_at'>>) {
  return supabase.from('itineraries').update(t).eq('id', id);
}
