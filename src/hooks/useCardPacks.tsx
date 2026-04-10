import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getRegionPackConfig } from '@/data/regionPacks';

export interface PackType {
  id: string;
  name: string;
  description: string;
  card_count: number;
  rarity_weights: Record<string, number>;
  shiny_chance: number;
  drop_chance: number;
  pack_category: string;
  region: string | null;
  icon_url: string | null;
}

export interface UserPack {
  id: string;
  pack_type_id: string;
  quantity: number;
  pack_type?: PackType;
}

export interface PackCard {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  is_shiny: boolean;
}

export interface StarterPackResult {
  success: boolean;
  pokemon_id?: number;
  pokemon_name?: string;
  rarity?: string;
  is_shiny?: boolean;
  region?: string;
  message?: string;
}

export interface OpenedRegion {
  region: string;
  pokemon_id: number;
  pokemon_name: string;
}

export const useCardPacks = () => {
  const { user } = useAuth();
  const [packTypes, setPackTypes] = useState<PackType[]>([]);
  const [userPacks, setUserPacks] = useState<UserPack[]>([]);
  const [openedRegions, setOpenedRegions] = useState<OpenedRegion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPackTypes = useCallback(async () => {
    const { data } = await supabase
      .from('pack_types')
      .select('*');
    if (data) setPackTypes(data as unknown as PackType[]);
  }, []);

  const loadUserPacks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id);
    if (data) setUserPacks(data as unknown as UserPack[]);
  }, [user]);

  const loadOpenedRegions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_starter_packs_opened')
      .select('region, pokemon_id, pokemon_name')
      .eq('user_id', user.id);
    if (data) setOpenedRegions(data as OpenedRegion[]);
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPackTypes(), loadUserPacks(), loadOpenedRegions()]);
    setLoading(false);
  }, [loadPackTypes, loadUserPacks, loadOpenedRegions]);

  // OPTIMIZATION: Removed auto-load on mount for pack_types and user_packs
  // Only load opened regions to check starter status (lightweight)
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        await loadOpenedRegions();
        setLoading(false);
      };
      loadData();
    }
  }, [user, loadOpenedRegions]);

  const openStarterPack = useCallback(async (region: string): Promise<StarterPackResult> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const regionConfig = getRegionPackConfig(region);
    if (!regionConfig) {
      return { success: false, message: 'Unsupported region for starter pack.' };
    }

    if (!regionConfig.isEnabled) {
      return { success: false, message: 'Starter pack for this region is not available yet.' };
    }

    const { data, error } = await supabase.rpc('open_starter_pack', {
      p_user_id: user.id,
      p_region: region,
    });

    if (error) {
      console.error('Error opening starter pack:', error);
      return { success: false, message: error.message };
    }

    const result = data as unknown as StarterPackResult;
    if (result.success) {
      await refresh();
    }
    return result;
  }, [user, refresh]);

  const openCardPack = useCallback(async (packTypeId: string): Promise<{ success: boolean; cards?: PackCard[]; message?: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const { data, error } = await supabase.rpc('open_card_pack', {
      p_user_id: user.id,
      p_pack_type_id: packTypeId,
    });

    if (error) {
      console.error('Error opening card pack:', error);
      return { success: false, message: error.message };
    }

    const result = data as unknown as { success: boolean; cards?: PackCard[]; message?: string };
    if (result.success) {
      await refresh();
    }
    return result;
  }, [user, refresh]);

  const grantPackDrop = useCallback(async (): Promise<{ pack_id: string; pack_name: string }[]> => {
    if (!user) return [];

    const { data, error } = await supabase.rpc('grant_pack_drop', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error granting pack drop:', error);
      return [];
    }

    const result = data as unknown as { success: boolean; drops: { pack_id: string; pack_name: string }[] };
    if (result.success && result.drops.length > 0) {
      await loadUserPacks();
    }
    return result.drops || [];
  }, [user, loadUserPacks]);

  const isRegionOpened = useCallback((region: string) => {
    return openedRegions.some(r => r.region === region);
  }, [openedRegions]);

  const getUserPacksWithTypes = useCallback((): (UserPack & { pack_type: PackType })[] => {
    return userPacks
      .filter(up => up.quantity > 0)
      .map(up => ({
        ...up,
        pack_type: packTypes.find(pt => pt.id === up.pack_type_id)!,
      }))
      .filter(up => up.pack_type);
  }, [userPacks, packTypes]);

  return {
    packTypes,
    userPacks,
    openedRegions,
    loading,
    openStarterPack,
    openCardPack,
    grantPackDrop,
    isRegionOpened,
    getUserPacksWithTypes,
    refresh,
  };
};
