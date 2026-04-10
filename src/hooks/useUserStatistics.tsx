import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserStatistics {
  total_spins: number;
  total_pokemon: number;
  unique_pokemon: number;
  shiny_count: number;
  legendary_count: number;
  cards_sold: number;
  cards_bought: number;
  total_coins_earned: number;
  friends_count: number;
  gifts_sent: number;
  gifts_received: number;
  achievements_completed: number;
  pokedex_placed: number;
  days_playing: number;
  regions_unlocked: number;
}

const defaultStatistics: UserStatistics = {
  total_spins: 0,
  total_pokemon: 0,
  unique_pokemon: 0,
  shiny_count: 0,
  legendary_count: 0,
  cards_sold: 0,
  cards_bought: 0,
  total_coins_earned: 0,
  friends_count: 0,
  gifts_sent: 0,
  gifts_received: 0,
  achievements_completed: 0,
  pokedex_placed: 0,
  days_playing: 0,
  regions_unlocked: 1,
};

export const useUserStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    if (!user) {
      setStatistics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_user_statistics', {
        p_user_id: user.id
      });

      if (rpcError) {
        console.error('Error loading user statistics:', rpcError);
        setError(rpcError.message);
        setStatistics(defaultStatistics);
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        setStatistics(data as unknown as UserStatistics);
      } else {
        setStatistics(defaultStatistics);
      }
    } catch (err) {
      console.error('Error loading user statistics:', err);
      setError('Failed to load statistics');
      setStatistics(defaultStatistics);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: loadStatistics
  };
};
