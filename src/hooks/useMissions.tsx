import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  category: string;
  goal: number;
  reward_coins: number;
  reward_xp: number;
  reward_shards: number;
  progress?: number;
  completed?: boolean;
  completed_at?: string;
  rewards_claimed?: boolean;
  daily_bonus_claimed_at?: string;
  weekly_bonus_claimed_at?: string;
}

export interface MissionProgress {
  missions_completed: Mission[];
  rewards_earned: {
    coins: number;
    xp: number;
    shards: number;
  };
}

export const useMissions = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
    if (!user) return;

    try {
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .order('type', { ascending: true });

      if (missionsError) throw missionsError;

      const { data: userMissionsData, error: userMissionsError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', user.id);

      if (userMissionsError) throw userMissionsError;

      // Merge mission data with user progress
      const missionsWithProgress = missionsData.map(mission => {
        const userMission = userMissionsData?.find(um => um.mission_id === mission.id);
        return {
          ...mission,
          type: mission.type as 'daily' | 'weekly',
          progress: userMission?.progress || 0,
          completed: userMission?.completed || false,
          completed_at: userMission?.completed_at,
          rewards_claimed: userMission?.rewards_claimed || false
        };
      });

      setMissions(missionsWithProgress);
    } catch (error) {
      console.error('Error loading missions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as missões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMissionProgress = async (category: string, increment: number = 1) => {
    if (!user) return;

    try {
      console.log(`[MISSIONS] Updating progress for category: ${category}, increment: ${increment}`);
      
      const { data, error } = await supabase.rpc('update_mission_progress', {
        p_user_id: user.id,
        p_category: category,
        p_increment: increment
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.missions_completed && result.missions_completed.length > 0) {
        console.log('[MISSIONS] Missions completed:', result.missions_completed);
        // Show mission completion notifications without auto-claiming rewards
        result.missions_completed.forEach(mission => {
          toast({
            title: "🎉 Missão Concluída!",
            description: `${mission.title} - Clique para coletar as recompensas!`,
            duration: 8000,
          });
        });
      }

      // Reload missions to update progress
      await loadMissions();
      
      return result;
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return null;
    }
  };

  const claimMissionRewards = async (missionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('claim_mission_rewards', {
        p_user_id: user.id,
        p_mission_id: missionId
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.success) {
        const rewards = result.rewards;
        toast({
          title: "🎁 Recompensas Coletadas!",
          description: `+${rewards.coins} coins, +${rewards.xp} XP${rewards.shards ? `, +${rewards.shards} shards` : ''}`,
          duration: 5000,
        });
        
        // Reload missions to update status
        await loadMissions();
        
        return true;
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error claiming mission rewards:', error);
      toast({
        title: "Erro",
        description: "Não foi possível coletar as recompensas",
        variant: "destructive"
      });
      return false;
    }
  };

  const claimDailyCompletionBonus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('claim_daily_completion_bonus', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.success) {
        const rewards = result.rewards;
        toast({
          title: "🏆 Bônus Diário Coletado!",
          description: `+${rewards.coins} coins, +${rewards.xp} XP, +${rewards.shards} shards`,
          duration: 5000,
        });
        
        return true;
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      toast({
        title: "Erro",
        description: "Não foi possível coletar o bônus diário",
        variant: "destructive"
      });
      return false;
    }
  };

  const claimWeeklyCompletionBonus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('claim_weekly_completion_bonus', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.success) {
        const rewards = result.rewards;
        toast({
          title: "🏆 Bônus Semanal Coletado!",
          description: `+${rewards.coins} coins, +${rewards.xp} XP, +${rewards.shards} shards`,
          duration: 5000,
        });
        
        return true;
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error claiming weekly bonus:', error);
      toast({
        title: "Erro",
        description: "Não foi possível coletar o bônus semanal",
        variant: "destructive"
      });
      return false;
    }
  };

  const resetMissions = async () => {
    try {
      const { error } = await supabase.rpc('reset_missions');
      if (error) throw error;
      await loadMissions();
    } catch (error) {
      console.error('Error resetting missions:', error);
    }
  };

  const getDailyMissions = () => missions.filter(m => m.type === 'daily');
  const getWeeklyMissions = () => missions.filter(m => m.type === 'weekly');

  const getDailyProgress = () => {
    const dailyMissions = getDailyMissions();
    const completed = dailyMissions.filter(m => m.completed).length;
    return { completed, total: dailyMissions.length };
  };

  const getWeeklyProgress = () => {
    const weeklyMissions = getWeeklyMissions();
    const completed = weeklyMissions.filter(m => m.completed).length;
    return { completed, total: weeklyMissions.length };
  };

  const isDailyBonusClaimed = () => {
    const today = new Date().toISOString().split('T')[0];
    return missions.some(m => {
      const claimedDate = m.daily_bonus_claimed_at?.split('T')[0];
      return claimedDate === today;
    });
  };

  const isWeeklyBonusClaimed = () => {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Monday
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];
    
    return missions.some(m => {
      if (!m.weekly_bonus_claimed_at) return false;
      const claimedDate = new Date(m.weekly_bonus_claimed_at);
      return claimedDate >= currentWeekStart;
    });
  };

  useEffect(() => {
    if (user) {
      loadMissions();
    }
  }, [user]);

  return {
    missions,
    loading,
    loadMissions,
    updateMissionProgress,
    claimMissionRewards,
    claimDailyCompletionBonus,
    claimWeeklyCompletionBonus,
    resetMissions,
    getDailyMissions,
    getWeeklyMissions,
    getDailyProgress,
    getWeeklyProgress,
    isDailyBonusClaimed,
    isWeeklyBonusClaimed
  };
};