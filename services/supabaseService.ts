import { getSupabaseClient } from '@/template';
import { TouristPlace } from '@/constants/places';

const supabase = getSupabaseClient();

// ─── PLACES ──────────────────────────────────────────────────────────────────

export async function fetchPlaces(): Promise<TouristPlace[]> {
  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  if (error) {
    console.log('fetchPlaces error:', error.message);
    return [];
  }

  return (data || []).map(mapRowToPlace);
}

export async function fetchPlaceById(id: string): Promise<TouristPlace | null> {
  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data ? mapRowToPlace(data) : null;
}

export async function createPlace(place: Omit<TouristPlace, 'id'>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tourist_places').insert({
    id: place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: place.name,
    short_description: place.shortDescription,
    description: place.description,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    rating: place.rating,
    points: place.points,
    qr_code: place.qrCode,
    image_url: place.imageUrl,
    audio_text: place.audioText,
    ar_type: place.arType,
    badge: place.badge,
    difficulty: place.difficulty,
    visit_duration: place.visitDuration,
    tags: place.tags,
  });

  return { error: error?.message || null };
}

export async function updatePlace(id: string, updates: Partial<TouristPlace>): Promise<{ error: string | null }> {
  const row: Record<string, any> = {};
  if (updates.name) row.name = updates.name;
  if (updates.shortDescription) row.short_description = updates.shortDescription;
  if (updates.description) row.description = updates.description;
  if (updates.category) row.category = updates.category;
  if (updates.latitude !== undefined) row.latitude = updates.latitude;
  if (updates.longitude !== undefined) row.longitude = updates.longitude;
  if (updates.address) row.address = updates.address;
  if (updates.rating !== undefined) row.rating = updates.rating;
  if (updates.points !== undefined) row.points = updates.points;
  if (updates.imageUrl) row.image_url = updates.imageUrl;
  if (updates.audioText) row.audio_text = updates.audioText;
  if (updates.arType) row.ar_type = updates.arType;
  if (updates.badge) row.badge = updates.badge;
  if (updates.difficulty) row.difficulty = updates.difficulty;
  if (updates.visitDuration) row.visit_duration = updates.visitDuration;
  if (updates.tags) row.tags = updates.tags;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from('tourist_places').update(row).eq('id', id);
  return { error: error?.message || null };
}

export async function deletePlace(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tourist_places')
    .update({ is_active: false })
    .eq('id', id);
  return { error: error?.message || null };
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export interface DBUserProfile {
  id: string;
  username: string | null;
  email: string;
  points: number;
  visited_places: string[];
  scanned_qrs: string[];
  unlocked_badges: string[];
  join_date: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export async function fetchUserProfile(userId: string): Promise<DBUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.log('fetchUserProfile error:', error.message);
    return null;
  }
  return data as DBUserProfile;
}

export async function upsertUserProfile(userId: string, updates: Partial<DBUserProfile>): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' });
  return { error: error?.message || null };
}

export async function addPointsDB(userId: string, points: number): Promise<{ error: string | null }> {
  const profile = await fetchUserProfile(userId);
  if (!profile) return { error: 'Profile not found' };
  const { error } = await supabase
    .from('user_profiles')
    .update({ points: (profile.points || 0) + points })
    .eq('id', userId);
  return { error: error?.message || null };
}

export async function markVisitDB(userId: string, placeId: string, points: number): Promise<{ error: string | null }> {
  const profile = await fetchUserProfile(userId);
  if (!profile) return { error: 'Profile not found' };

  const alreadyVisited = (profile.visited_places || []).includes(placeId);
  if (alreadyVisited) return { error: null };

  const newVisited = [...(profile.visited_places || []), placeId];
  const [profileRes] = await Promise.all([
    supabase.from('user_profiles').update({ visited_places: newVisited, points: (profile.points || 0) + points }).eq('id', userId),
    supabase.from('user_visits').upsert({ user_id: userId, place_id: placeId }, { onConflict: 'user_id,place_id', ignoreDuplicates: true }),
  ]);
  return { error: profileRes.error?.message || null };
}

export async function markQRScanDB(
  userId: string,
  qrCode: string,
  placeId: string,
  pointsEarned: number
): Promise<{ error: string | null; alreadyScanned: boolean }> {
  const profile = await fetchUserProfile(userId);
  if (!profile) return { error: 'Profile not found', alreadyScanned: false };

  const alreadyScanned = (profile.scanned_qrs || []).includes(qrCode);
  const finalPoints = alreadyScanned ? 10 : pointsEarned;

  const newScanned = alreadyScanned
    ? profile.scanned_qrs
    : [...(profile.scanned_qrs || []), qrCode];
  const newVisited = (profile.visited_places || []).includes(placeId)
    ? profile.visited_places
    : [...(profile.visited_places || []), placeId];

  await supabase
    .from('user_profiles')
    .update({ scanned_qrs: newScanned, visited_places: newVisited, points: (profile.points || 0) + finalPoints })
    .eq('id', userId);

  if (!alreadyScanned) {
    await supabase
      .from('qr_scans')
      .insert({ user_id: userId, place_id: placeId, qr_code: qrCode, points_earned: finalPoints });
  }

  return { error: null, alreadyScanned };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function mapRowToPlace(row: any): TouristPlace {
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    rating: Number(row.rating),
    points: row.points,
    qrCode: row.qr_code,
    imageUrl: row.image_url,
    audioText: row.audio_text,
    arType: row.ar_type,
    badge: row.badge,
    difficulty: row.difficulty,
    visitDuration: row.visit_duration,
    tags: row.tags || [],
  };
}
