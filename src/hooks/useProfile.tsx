import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import pikachuAvatar from '@/assets/avatars/pikachu.jpg';
import mistyAvatar from '@/assets/avatars/misty.jpg';
import piplupAvatar from '@/assets/avatars/piplup.jpg';
import mysteriousAvatar from '@/assets/avatars/mysterious.jpg';
import teddursaAvatar from '@/assets/avatars/teddiursa.jpg';
import squirtleAvatar from '@/assets/avatars/squirtle.jpg';
import charmanderAvatar from '@/assets/avatars/charmander.jpg';
import rioluAvatar from '@/assets/avatars/riolu.jpg';
import {
  fetchSharedProfile,
  getSharedProfileSnapshot,
  subscribeSharedProfile,
  updateSharedProfileSnapshot,
  type SharedProfile,
} from './profileCache';

export const AVAILABLE_AVATARS = [
  { id: 'pikachu', name: 'Pikachu', src: pikachuAvatar },
  { id: 'misty', name: 'Misty', src: mistyAvatar },
  { id: 'piplup', name: 'Piplup', src: piplupAvatar },
  { id: 'mysterious', name: 'Misterioso', src: mysteriousAvatar },
  { id: 'teddiursa', name: 'Teddiursa', src: teddursaAvatar },
  { id: 'squirtle', name: 'Squirtle', src: squirtleAvatar },
  { id: 'charmander', name: 'Charmander', src: charmanderAvatar },
  { id: 'riolu', name: 'Riolu', src: rioluAvatar },
];

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SharedProfile | null>(getSharedProfileSnapshot(user?.id));
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (force = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchSharedProfile(user.id, force);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (updates: { nickname?: string; avatar?: string }) => {
    if (!user || !profile) return false;

    try {
      // Use secure RPC function instead of direct update
      const { data, error } = await supabase.rpc('update_profile_safe', {
        p_user_id: user.id,
        p_nickname: updates.nickname || null,
        p_avatar: updates.avatar || null
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar perfil. Tente novamente.',
          variant: 'destructive',
        });
        return false;
      }

      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao atualizar perfil',
          variant: 'destructive',
        });
        return false;
      }

      // Update local state with only the allowed fields
      const nextProfile = {
        ...profile,
        nickname: updates.nickname || profile.nickname,
        avatar: updates.avatar || profile.avatar
      };

      setProfile(nextProfile);
      updateSharedProfileSnapshot(user.id, nextProfile);
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const addExperience = async (amount: number, source: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('add_experience', {
        p_user_id: user.id,
        p_xp_amount: amount
      });

      if (error) {
        console.error('Error adding experience:', error);
        return;
      }

      const result = data[0];
      if (result) {
        // Update local profile
        setProfile((prev) => {
          if (!prev) return prev;

          const nextProfile = {
            ...prev,
            experience_points: result.new_xp,
            level: result.new_level,
          };
          updateSharedProfileSnapshot(user.id, nextProfile);
          return nextProfile;
        });

        // Show level up notification if leveled up
        if (result.level_up) {
          toast({
            title: "🎉 Level Up!",
            description: `Parabéns! Você alcançou o nível ${result.new_level}!`,
            duration: 4000,
          });

          // Update level achievement progress will be handled by the achievements hook
          // when it detects level changes
        }
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const changeRegion = async (region: string): Promise<boolean> => {
    if (!user || !profile) return false;

    const validRegions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola'];
    if (!validRegions.includes(region)) {
      toast({
        title: 'Erro',
        description: 'Região inválida.',
        variant: 'destructive',
      });
      return false;
    }

    // Check if user has unlocked this region
    if (!profile.unlocked_regions.includes(region)) {
      toast({
        title: 'Região bloqueada',
        description: 'Você ainda não desbloqueou esta região.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_region: region, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error changing region:', error);
        return false;
      }

      const nextProfile = { ...profile, current_region: region };
      setProfile(nextProfile);
      updateSharedProfileSnapshot(user.id, nextProfile);
      return true;
    } catch (error) {
      console.error('Error changing region:', error);
      return false;
    }
  };

  const getAvatarSrc = (avatarId: string) => {
    const avatar = AVAILABLE_AVATARS.find(a => a.id === avatarId);
    return avatar?.src || AVAILABLE_AVATARS[0].src;
  };

  const getXPForNextLevel = (currentLevel: number) => {
    // Usando a mesma fórmula do banco: level = floor(sqrt(xp / 100)) + 1
    // Então: xp = ((level - 1) ^ 2) * 100
    return ((currentLevel) ** 2) * 100;
  };

  const getXPProgress = () => {
    if (!profile) return { current: 0, needed: 100, percentage: 0 };
    
    const currentLevelXP = ((profile.level - 1) ** 2) * 100;
    const nextLevelXP = getXPForNextLevel(profile.level);
    const progressXP = profile.experience_points - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percentage = (progressXP / neededXP) * 100;

    return {
      current: progressXP,
      needed: neededXP,
      percentage: Math.min(100, Math.max(0, percentage))
    };
  };

  useEffect(() => {
    loadProfile();
  }, [user, loadProfile]);

  useEffect(() => {
    const unsubscribe = subscribeSharedProfile((sharedProfile) => {
      if (sharedProfile) {
        setProfile(sharedProfile);
      }
    });

    return unsubscribe;
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    changeRegion,
    addExperience,
    getAvatarSrc,
    getXPProgress,
    loadProfile
  };
};