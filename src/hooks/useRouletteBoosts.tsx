import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RouletteBoost {
  id: string;
  name: string;
  description: string;
  boost_type: string;
  boost_value: number;
  task_type: string;
  task_goal: number;
  task_description: string;
  icon: string;
  tier: number;
  is_active: boolean;
}

export interface UserRouletteBoost {
  id: string;
  boost_id: string;
  progress: number;
  is_completed: boolean;
  is_active: boolean;
  completed_at: string | null;
  boost: RouletteBoost;
}

export interface ActiveBoosts {
  shiny_chance: number;
  secret_chance: number;
  xp_bonus: number;
  spin_refund: number;
  luck_bonus: number;
}

export const useRouletteBoosts = (onRefresh?: () => void) => {
  const { user } = useAuth();
  const [boosts, setBoosts] = useState<RouletteBoost[]>([]);
  const [userBoosts, setUserBoosts] = useState<UserRouletteBoost[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoosts>({
    shiny_chance: 0,
    secret_chance: 0,
    xp_bonus: 0,
    spin_refund: 0,
    luck_bonus: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchBoosts = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all available boosts
      const { data: boostsData, error: boostsError } = await supabase
        .from('roulette_boosts')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })
        .order('boost_type', { ascending: true });

      if (boostsError) throw boostsError;

      setBoosts(boostsData || []);

      // Fetch user's boost progress
      const { data: userBoostsData, error: userBoostsError } = await supabase
        .from('user_roulette_boosts')
        .select('*')
        .eq('user_id', user.id);

      if (userBoostsError) throw userBoostsError;

      // Combine boost definitions with user progress
      const combinedBoosts: UserRouletteBoost[] = (boostsData || []).map(boost => {
        const userBoost = userBoostsData?.find(ub => ub.boost_id === boost.id);
        return {
          id: userBoost?.id || '',
          boost_id: boost.id,
          progress: userBoost?.progress || 0,
          is_completed: userBoost?.is_completed || false,
          is_active: userBoost?.is_active || false,
          completed_at: userBoost?.completed_at || null,
          boost,
        };
      });

      setUserBoosts(combinedBoosts);

      // Calculate active boosts totals
      const activeTotals: ActiveBoosts = {
        shiny_chance: 0,
        secret_chance: 0,
        xp_bonus: 0,
        spin_refund: 0,
        luck_bonus: 0,
      };

      combinedBoosts.forEach(ub => {
        if (ub.is_active && ub.boost.boost_type in activeTotals) {
          activeTotals[ub.boost.boost_type as keyof ActiveBoosts] += Number(ub.boost.boost_value);
        }
      });

      setActiveBoosts(activeTotals);
    } catch (error) {
      console.error('Error fetching roulette boosts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // OPTIMIZATION: Removed auto-load on mount
  // Boosts data is loaded lazily when RouletteBoostsModal opens via refetch

  const updateProgress = useCallback(async (taskType: string, increment: number = 1) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('update_roulette_boost_progress', {
        p_user_id: user.id,
        p_task_type: taskType,
        p_increment: increment,
      });

      if (error) throw error;

      // Refresh data after update
      await fetchBoosts();
      onRefresh?.();

      return data;
    } catch (error) {
      console.error('Error updating roulette boost progress:', error);
      return null;
    }
  }, [user, fetchBoosts, onRefresh]);

  const getBoostsByType = useCallback((boostType: string) => {
    return userBoosts.filter(ub => ub.boost.boost_type === boostType);
  }, [userBoosts]);

  const getCompletedCount = useCallback(() => {
    return userBoosts.filter(ub => ub.is_completed).length;
  }, [userBoosts]);

  const getTotalBoosts = useCallback(() => {
    return boosts.length;
  }, [boosts]);

  return {
    boosts,
    userBoosts,
    activeBoosts,
    loading,
    updateProgress,
    getBoostsByType,
    getCompletedCount,
    getTotalBoosts,
    refetch: fetchBoosts,
  };
};
