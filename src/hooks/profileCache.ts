import { supabase } from '@/integrations/supabase/client';

export interface SharedProfile {
  user_id: string;
  nickname: string;
  avatar: string;
  experience_points: number;
  level: number;
  pokecoins: number;
  pokeshards: number;
  birth_date?: string;
  starter_pokemon?: string;
  current_region: string;
  unlocked_regions: string[];
  luck_multiplier: number;
  xp_multiplier: number;
}

const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEntry = {
  userId: string | null;
  profile: SharedProfile | null;
  loadedAt: number;
  promise: Promise<SharedProfile | null> | null;
};

const sharedProfileCache: CacheEntry = {
  userId: null,
  profile: null,
  loadedAt: 0,
  promise: null,
};

const listeners = new Set<(profile: SharedProfile | null) => void>();

const isFresh = (userId: string) =>
  sharedProfileCache.userId === userId &&
  sharedProfileCache.profile !== null &&
  Date.now() - sharedProfileCache.loadedAt < PROFILE_CACHE_TTL_MS;

export const subscribeSharedProfile = (listener: (profile: SharedProfile | null) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSharedProfileSnapshot = (userId?: string | null) => {
  if (!userId || !isFresh(userId)) return null;
  return sharedProfileCache.profile;
};

export const setSharedProfileSnapshot = (userId: string, profile: SharedProfile | null) => {
  sharedProfileCache.userId = userId;
  sharedProfileCache.profile = profile;
  sharedProfileCache.loadedAt = Date.now();
  listeners.forEach((listener) => listener(profile));
};

export const fetchSharedProfile = async (userId: string, force = false): Promise<SharedProfile | null> => {
  if (!force && isFresh(userId)) {
    return sharedProfileCache.profile;
  }

  if (sharedProfileCache.promise) {
    return sharedProfileCache.promise;
  }

  sharedProfileCache.userId = userId;
  sharedProfileCache.promise = supabase
    .from('profiles')
    .select('user_id, nickname, avatar, experience_points, level, pokecoins, pokeshards, birth_date, starter_pokemon, current_region, unlocked_regions, luck_multiplier, xp_multiplier')
    .eq('user_id', userId)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        if (error) {
          console.error('Error loading profile:', error);
        }
        sharedProfileCache.profile = null;
        sharedProfileCache.loadedAt = Date.now();
        listeners.forEach((listener) => listener(null));
        return null;
      }

      const profile = data as SharedProfile;
      sharedProfileCache.profile = profile;
      sharedProfileCache.loadedAt = Date.now();
      listeners.forEach((listener) => listener(profile));
      return profile;
    }) as Promise<SharedProfile | null>;

  sharedProfileCache.promise = sharedProfileCache.promise.then(
    (profile) => {
      sharedProfileCache.promise = null;
      return profile;
    },
    (error) => {
      sharedProfileCache.promise = null;
      throw error;
    }
  );

  return sharedProfileCache.promise;
};

export const updateSharedProfileSnapshot = (userId: string, updates: Partial<SharedProfile>) => {
  const current = sharedProfileCache.profile;
  if (!current || sharedProfileCache.userId !== userId) return current;

  const nextProfile = { ...current, ...updates };
  setSharedProfileSnapshot(userId, nextProfile);
  return nextProfile;
};
