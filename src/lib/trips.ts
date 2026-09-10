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
  created_at: string;
}

export async function listTrips(): Promise<Trip[]> {
  const { data } = await supabase.from('itineraries').select('*').order('created_at', { ascending: false });
  return (data ?? []) as Trip[];
}

export async function createTrip(t: Omit<Trip, 'id' | 'created_at'>): Promise<Trip | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('itineraries').insert({ ...t, user_id: user.id }).select().single();
  return data as Trip | null;
}

export async function deleteTrip(id: string) {
  return supabase.from('itineraries').delete().eq('id', id);
}

export async function updateTrip(id: string, t: Partial<Omit<Trip, 'id' | 'created_at'>>) {
  return supabase.from('itineraries').update(t).eq('id', id);
}
