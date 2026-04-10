import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DailyReward {
  day: number;
  rewardType: 'pokecoins' | 'spins' | 'pokeshards' | 'legendary_spin';
  rewardAmount: number;
  icon: string;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, rewardType: 'pokecoins', rewardAmount: 110, icon: '🪙' },
  { day: 2, rewardType: 'spins', rewardAmount: 5, icon: '🎰' },
  { day: 3, rewardType: 'pokeshards', rewardAmount: 25, icon: '💎' },
  { day: 4, rewardType: 'pokecoins', rewardAmount: 220, icon: '🪙' },
  { day: 5, rewardType: 'spins', rewardAmount: 10, icon: '🎰' },
  { day: 6, rewardType: 'pokeshards', rewardAmount: 60, icon: '💎' },
  { day: 7, rewardType: 'legendary_spin', rewardAmount: 1, icon: '⭐' },
];

export const useDailyLogin = () => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const checkStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('user_daily_logins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCurrentStreak(data.current_streak as number);
        const today = new Date().toISOString().split('T')[0];
        setCanClaim(data.last_claim_date !== today);
      } else {
        setCurrentStreak(0);
        setCanClaim(true);
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const claimReward = async (): Promise<{
    success: boolean;
    day?: number;
    rewardType?: string;
    rewardAmount?: number;
    isLegendarySpin?: boolean;
  }> => {
    if (!user || claiming) return { success: false };
    
    setClaiming(true);
    try {
      const { data, error } = await (supabase as any).rpc('claim_daily_login', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error claiming daily login:', error);
        return { success: false };
      }

      const result = data as any;
      
      if (result?.success) {
        setCurrentStreak(result.current_streak);
        setCanClaim(false);
        return {
          success: true,
          day: result.day,
          rewardType: result.reward_type,
          rewardAmount: result.reward_amount,
          isLegendarySpin: result.is_legendary_spin,
        };
      }

      if (result?.message === 'already_claimed') {
        setCanClaim(false);
        setCurrentStreak(result.current_streak);
      }

      return { success: false };
    } catch (error) {
      console.error('Error claiming daily login:', error);
      return { success: false };
    } finally {
      setClaiming(false);
    }
  };

  return {
    currentStreak,
    canClaim,
    loading,
    claiming,
    claimReward,
    refreshStatus: checkStatus,
    dailyRewards: DAILY_REWARDS,
  };
};
