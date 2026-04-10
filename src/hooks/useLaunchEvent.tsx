import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface EventConfig {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface EventMission {
  id: string;
  mission_order: number;
  category: string;
  goal: number;
  reward_coins: number;
  reward_shards: number;
  reward_spins: number;
  reward_mystery_boxes: number;
  reward_luck_potion: number;
  reward_shiny_potion: number;
  reward_legendary_spin: number;
}

interface UserProgress {
  mission_order: number;
  progress: number;
  completed: boolean;
  rewards_claimed: boolean;
}

interface MissionWithProgress extends EventMission {
  progress: number;
  completed: boolean;
  rewards_claimed: boolean;
  isUnlocked: boolean;
}

export const useLaunchEvent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const loadEventData = useCallback(async () => {
    try {
      // Load event config
      const { data: configData, error: configError } = await supabase
        .from('launch_event_config')
        .select('id, event_name, start_date, end_date, is_active')
        .eq('is_active', true)
        .single();

      if (configError || !configData) {
        setEventConfig(null);
        setLoading(false);
        return;
      }

      setEventConfig(configData);

      // Load missions
      const { data: missionsData, error: missionsError } = await supabase
        .from('launch_event_missions')
        .select('id, mission_order, category, goal, reward_coins, reward_shards, reward_spins, reward_mystery_boxes, reward_luck_potion, reward_shiny_potion, reward_legendary_spin')
        .order('mission_order');

      if (missionsError) {
        console.error('Error loading missions:', missionsError);
        setLoading(false);
        return;
      }

      // Load user progress if logged in
      let userProgress: UserProgress[] = [];
      if (user) {
        const { data: progressData } = await supabase
          .from('user_launch_event_progress')
          .select('mission_order, progress, completed, rewards_claimed')
          .eq('user_id', user.id);

        userProgress = progressData || [];
      }

      // Merge missions with user progress
      const missionsWithProgress: MissionWithProgress[] = (missionsData || []).map((mission) => {
        const progress = userProgress.find((p) => p.mission_order === mission.mission_order);
        const previousMission = userProgress.find((p) => p.mission_order === mission.mission_order - 1);
        
        const isUnlocked = mission.mission_order === 1 || 
          (previousMission?.rewards_claimed === true);

        return {
          ...mission,
          progress: progress?.progress || 0,
          completed: progress?.completed || false,
          rewards_claimed: progress?.rewards_claimed || false,
          isUnlocked,
        };
      });

      setMissions(missionsWithProgress);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Calculate time remaining
  useEffect(() => {
    if (!eventConfig) return;

    const calculateTimeRemaining = () => {
      const endDate = new Date(eventConfig.end_date);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [eventConfig]);

  // OPTIMIZATION: Removed auto-loading on mount
  // Event data is now loaded lazily when the LaunchEventModal opens
  // This saves Egress by not loading event data on every page load

  const updateProgress = async (category: string, increment: number = 1) => {
    if (!user || !eventConfig) return;

    try {
      await supabase.rpc('update_launch_event_progress', {
        p_user_id: user.id,
        p_category: category,
        p_increment: increment,
      });

      // Reload data to get updated progress
      await loadEventData();
    } catch (error) {
      console.error('Error updating event progress:', error);
    }
  };

  const checkFriendsMission = async () => {
    if (!user || !eventConfig) return;

    try {
      await supabase.rpc('check_friends_mission', {
        p_user_id: user.id,
      });

      await loadEventData();
    } catch (error) {
      console.error('Error checking friends mission:', error);
    }
  };

  const claimRewards = async (missionOrder: number) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('claim_launch_event_rewards', {
        p_user_id: user.id,
        p_mission_order: missionOrder,
      });

      if (error) {
        console.error('Error claiming rewards:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível resgatar as recompensas',
          variant: 'destructive',
        });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: '🎉 Recompensas resgatadas!',
          description: 'As recompensas foram adicionadas à sua conta!',
        });
        await loadEventData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return false;
    }
  };

  const isEventActive = eventConfig && timeRemaining !== null;

  return {
    eventConfig,
    missions,
    loading,
    timeRemaining,
    isEventActive,
    updateProgress,
    checkFriendsMission,
    claimRewards,
    refreshEvent: loadEventData,
  };
};
