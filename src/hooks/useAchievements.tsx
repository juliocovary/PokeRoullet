import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'unique' | 'progressive';
  goal_type: string;
  goal_value: number;
  base_reward_coins: number;
  base_reward_xp: number;
  base_reward_shards: number;
  base_reward_spins: number;
  increment_step?: number;
  reward_increment?: number;
  progress?: number;
  next_goal_value?: number;
  completed_count?: number;
  is_completed?: boolean;
  completed_at?: string;
  rewards_claimed?: boolean;
}

export interface AchievementProgress {
  achievements_completed: Achievement[];
  rewards_earned: {
    coins: number;
    xp: number;
    shards: number;
    spins: number;
  };
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      // Get all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Get user progress for achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Merge achievement data with user progress
      const achievementsWithProgress = achievementsData.map(achievement => {
        const userAchievement = userAchievementsData?.find(ua => ua.achievement_id === achievement.id);
        
        // Format progressive achievement titles and descriptions
        let title = achievement.title;
        let description = achievement.description;
        
        if (achievement.category === 'progressive' && userAchievement) {
          const goalValue = userAchievement.next_goal_value || achievement.goal_value;
          title = achievement.title.replace('{goal}', goalValue.toString());
          description = achievement.description.replace('{goal}', goalValue.toString());
        }

        return {
          ...achievement,
          category: achievement.category as 'unique' | 'progressive',
          title,
          description,
          progress: userAchievement?.progress || 0,
          next_goal_value: userAchievement?.next_goal_value || achievement.goal_value,
          completed_count: userAchievement?.completed_count || 0,
          is_completed: userAchievement?.is_completed || false,
          completed_at: userAchievement?.completed_at,
          rewards_claimed: userAchievement?.rewards_claimed || false
        };
      });

      setAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conquistas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAchievementProgress = async (goalType: string, increment: number = 1) => {
    if (!user) return;

    try {
      console.log(`[ACHIEVEMENTS] Updating progress for goal type: ${goalType}, increment: ${increment}`);
      
      const { data, error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_goal_type: goalType,
        p_increment: increment
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.achievements_completed && result.achievements_completed.length > 0) {
        console.log('[ACHIEVEMENTS] Achievements completed:', result.achievements_completed);
        // Show achievement completion notifications without auto-claiming rewards
        result.achievements_completed.forEach(achievement => {
          toast({
            title: "🏆 Conquista Desbloqueada!",
            description: `${achievement.title} - Vá até a aba de conquistas para coletar as recompensas!`,
            duration: 8000,
          });
        });
      }

      // Reload achievements to update progress
      await loadAchievements();
      
      return result;
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      return null;
    }
  };

  const claimAchievementRewards = async (achievementId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('claim_achievement_rewards', {
        p_user_id: user.id,
        p_achievement_id: achievementId
      });

      if (error) throw error;

      const result = data?.[0] as any;
      
      if (result?.success) {
        const rewards = result.rewards;
        let rewardText = [];
        if (rewards.coins > 0) rewardText.push(`+${rewards.coins} coins`);
        if (rewards.xp > 0) rewardText.push(`+${rewards.xp} XP`);
        if (rewards.shards > 0) rewardText.push(`+${rewards.shards} shards`);
        if (rewards.spins > 0) rewardText.push(`+${rewards.spins} giros eternos`);

        toast({
          title: "🎁 Recompensas Coletadas!",
          description: rewardText.join(', '),
          duration: 5000,
        });
        
        // Reload achievements to update status
        await loadAchievements();
        
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
      console.error('Error claiming achievement rewards:', error);
      toast({
        title: "Erro",
        description: "Não foi possível coletar as recompensas",
        variant: "destructive"
      });
      return false;
    }
  };

  const getUniqueAchievements = () => achievements.filter(a => a.category === 'unique');
  const getProgressiveAchievements = () => achievements.filter(a => a.category === 'progressive');

  const getCompletedAchievements = () => achievements.filter(a => 
    a.category === 'unique' ? a.is_completed : a.completed_count > 0
  );

  const getAchievementProgress = (achievement: Achievement) => {
    if (achievement.category === 'unique') {
      return {
        current: achievement.progress || 0,
        target: achievement.goal_value,
        percentage: Math.min(((achievement.progress || 0) / achievement.goal_value) * 100, 100)
      };
    } else {
      return {
        current: achievement.progress || 0,
        target: achievement.next_goal_value || achievement.goal_value,
        percentage: Math.min(((achievement.progress || 0) / (achievement.next_goal_value || achievement.goal_value)) * 100, 100)
      };
    }
  };

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  return {
    achievements,
    loading,
    loadAchievements,
    updateAchievementProgress,
    claimAchievementRewards,
    getUniqueAchievements,
    getProgressiveAchievements,
    getCompletedAchievements,
    getAchievementProgress
  };
};