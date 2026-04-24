import { supabaseServer } from '~/lib/supabase.server';
import type { AppProfile, BabysitterProfile } from '~/types';

export async function getApprovedBabysitters() {
  const { data, error } = await supabaseServer
    .from('babysitter_profiles')
    .select('id, profile_id, bio, hourly_rate, location, is_approved, profiles!inner(full_name)')
    .eq('is_approved', true);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProfileById(id: string) {
  const { data, error } = await supabaseServer.from('profiles').select('*').eq('id', id).single<AppProfile>();
  if (error) throw new Error(error.message);
  return data;
}

export async function getPendingBabysitters() {
  const { data, error } = await supabaseServer
    .from('babysitter_profiles')
    .select('id, bio, location, profiles!inner(full_name, id)')
    .eq('is_approved', false);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBookingsForUser(userId: string, role: 'parent' | 'babysitter') {
  const column = role === 'parent' ? 'parent_id' : 'babysitter_id';
  const { data, error } = await supabaseServer.from('bookings').select('*').eq(column, userId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBabysitterProfile(profileId: string) {
  const { data, error } = await supabaseServer
    .from('babysitter_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .single<BabysitterProfile>();
  if (error) return null;
  return data;
}
