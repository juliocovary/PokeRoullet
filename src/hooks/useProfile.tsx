import { useState, useEffect } from 'react';
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

interface Profile {
  user_id: string;
  nickname: string;
  avatar: string;
  experience_points: number;
  level: number;
  pokecoins: number;
  pokeshards: number;
  birth_date?: string;
  starter_pokemon?: string;
}

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar perfil. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setProfile({ ...profile, ...updates });
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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
        setProfile(prev => prev ? {
          ...prev,
          experience_points: result.new_xp,
          level: result.new_level
        } : null);

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
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    addExperience,
    getAvatarSrc,
    getXPProgress,
    loadProfile
  };
};