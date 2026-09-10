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
  // Own trips — RLS handles filtering to current user automatically
  const { data: own, error } = await supabase
    .from('itineraries').select('*').order('created_at', { ascending: false });

  if (error) console.error('[listTrips]', error);
  const ownTrips = (own ?? []) as Trip[];

  // Shared trips via accepted invites
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return ownTrips;

  const { data: invites } = await supabase
    .from('trip_invites')
    .select('itinerary_id')
    .eq('invited_email', user.email)
    .not('accepted_at', 'is', null);

  if (!invites || invites.length === 0) return ownTrips;

  const ownIds = new Set(ownTrips.map(t => t.id));
  const sharedIds = (invites as { itinerary_id: string }[])
    .map(i => i.itinerary_id)
    .filter(id => !ownIds.has(id));

  if (sharedIds.length === 0) return ownTrips;

  const { data: sharedData } = await supabase.from('itineraries').select('*').in('id', sharedIds);
  const shared = (sharedData ?? []) as Trip[];

  return [...ownTrips, ...shared].sort((a, b) => b.created_at.localeCompare(a.created_at));
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
