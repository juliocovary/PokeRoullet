import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface BoosterState {
  luckBoostExpiresAt: string | null;
  shinyBoostExpiresAt: string | null;
}

// All legendary Pokemon IDs from all regions
const ALL_LEGENDARIES = [
  // Kanto
  144, 145, 146, 150,
  // Johto
  243, 244, 245, 249, 250,
  // Hoenn
  377, 378, 379, 380, 381, 382, 383, 384,
  // Sinnoh
  480, 481, 482, 483, 484, 485, 486, 487, 488, 491
];

const LEGENDARY_NAMES: Record<number, string> = {
  144: 'articuno', 145: 'zapdos', 146: 'moltres', 150: 'mewtwo',
  243: 'raikou', 244: 'entei', 245: 'suicune', 249: 'lugia', 250: 'ho-oh',
  377: 'regirock', 378: 'regice', 379: 'registeel', 380: 'latias', 381: 'latios',
  382: 'kyogre', 383: 'groudon', 384: 'rayquaza',
  480: 'uxie', 481: 'mesprit', 482: 'azelf', 483: 'dialga', 484: 'palkia',
  485: 'heatran', 486: 'regigigas', 487: 'giratina', 488: 'cresselia', 491: 'darkrai'
};

export interface MysteryBoxReward {
  type: 'spins' | 'pokecoins' | 'pokeshards' | 'item' | 'legendary_spin';
  amount: number;
  itemName?: string;
}

export const useBooster = () => {
  const { user } = useAuth();
  const [boosterState, setBoosterState] = useState<BoosterState>({
    luckBoostExpiresAt: null,
    shinyBoostExpiresAt: null
  });
  const [loading, setLoading] = useState(false);

  const loadBoosterState = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('luck_boost_expires_at, shiny_boost_expires_at')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setBoosterState({
        luckBoostExpiresAt: profile.luck_boost_expires_at,
        shinyBoostExpiresAt: profile.shiny_boost_expires_at
      });
    }
  }, [user]);

  useEffect(() => {
    loadBoosterState();
  }, [loadBoosterState]);

  const isLuckBoostActive = (): boolean => {
    if (!boosterState.luckBoostExpiresAt) return false;
    return new Date(boosterState.luckBoostExpiresAt) > new Date();
  };

  const isShinyBoostActive = (): boolean => {
    if (!boosterState.shinyBoostExpiresAt) return false;
    return new Date(boosterState.shinyBoostExpiresAt) > new Date();
  };

  const getTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return '';
    const now = new Date();
    const expires = new Date(expiresAt);
    if (expires <= now) return '';
    
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const activateLuckBoost = async (): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      // Use secure RPC function instead of direct updates
      const { data, error } = await supabase.rpc('activate_booster', {
        p_user_id: user.id,
        p_booster_type: 'luck'
      });

      if (error) {
        console.error('Error activating luck boost:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao ativar Poção de Sorte',
          variant: 'destructive'
        });
        return false;
      }

      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.message || 'Você não possui Poção de Sorte',
          variant: 'destructive'
        });
        return false;
      }

      setBoosterState(prev => ({ ...prev, luckBoostExpiresAt: result.expires_at }));
      
      toast({
        title: '🍀 Poção de Sorte Ativada!',
        description: 'Sua sorte foi duplicada por 12 horas!'
      });
      
      return true;
    } catch (error) {
      console.error('Error activating luck boost:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const activateShinyBoost = async (): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      // Use secure RPC function instead of direct updates
      const { data, error } = await supabase.rpc('activate_booster', {
        p_user_id: user.id,
        p_booster_type: 'shiny'
      });

      if (error) {
        console.error('Error activating shiny boost:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao ativar Poção de Shiny',
          variant: 'destructive'
        });
        return false;
      }

      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.message || 'Você não possui Poção de Shiny',
          variant: 'destructive'
        });
        return false;
      }

      setBoosterState(prev => ({ ...prev, shinyBoostExpiresAt: result.expires_at }));
      
      toast({
        title: '✨ Poção de Shiny Ativada!',
        description: 'Sua chance de shiny foi duplicada (2x) por 12 horas!'
      });
      
      return true;
    } catch (error) {
      console.error('Error activating shiny boost:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openMysteryBox = async (count: number = 1): Promise<MysteryBoxReward[]> => {
    if (!user) return [];
    setLoading(true);

    try {
      // Call server-side function for secure reward calculation
      const { data, error } = await supabase.rpc('open_mystery_box', {
        p_user_id: user.id,
        p_count: count
      });

      if (error) {
        console.error('Error opening mystery box:', error);
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive'
        });
        return [];
      }

      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao abrir caixa misteriosa',
          variant: 'destructive'
        });
        return [];
      }

      // Convert server rewards to client format
      const rewardsArray = Array.isArray(result.rewards) ? result.rewards : [];
      const rewards: MysteryBoxReward[] = rewardsArray.map((r: { type: string; amount: number; itemName?: string }) => ({
        type: r.type as MysteryBoxReward['type'],
        amount: r.amount,
        itemName: r.itemName
      }));

      return rewards;
    } catch (error) {
      console.error('Error opening mystery box:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const useLegendarySpin = async (): Promise<{ id: number; name: string; isShiny: boolean } | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      // Call server-side function for secure legendary spin
      const { data, error } = await supabase.rpc('use_legendary_spin', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error using legendary spin:', error);
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive'
        });
        return null;
      }

      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.message || 'Você não possui Giro Lendário',
          variant: 'destructive'
        });
        return null;
      }

      return { 
        id: result.pokemon_id, 
        name: result.pokemon_name, 
        isShiny: result.is_shiny 
      };
    } catch (error) {
      console.error('Error using legendary spin:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isLuckBoostActive: isLuckBoostActive(),
    isShinyBoostActive: isShinyBoostActive(),
    luckBoostTimeRemaining: getTimeRemaining(boosterState.luckBoostExpiresAt),
    shinyBoostTimeRemaining: getTimeRemaining(boosterState.shinyBoostExpiresAt),
    activateLuckBoost,
    activateShinyBoost,
    openMysteryBox,
    useLegendarySpin,
    refreshBoosterState: loadBoosterState
  };
};
