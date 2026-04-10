import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/i18n/config';
import { GEN1_POKEMON } from '@/data/allPokemon';

export interface PokedexCard {
  pokemon_id: number;
  pokemon_name: string;
  placed_at: string;
  is_shiny: boolean;
}

export interface ClaimedReward {
  section: string;
  milestone: number;
}

export const usePokedex = (pokemonInventory?: { pokemon_id: number; quantity: number; is_shiny: boolean }[]) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pokedexCards, setPokedexCards] = useState<PokedexCard[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [favoritePokemonIds, setFavoritePokemonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const t = (key: string) => i18n.t(key);

  const loadPokedexCards = async () => {
    if (!user) return;

    try {
      const [cardsResult, rewardsResult] = await Promise.all([
        supabase
          .from('pokedex_cards')
          .select('pokemon_id, pokemon_name, placed_at, is_shiny')
          .eq('user_id', user.id),
        supabase
          .from('pokedex_rewards_claimed')
          .select('section, milestone')
          .eq('user_id', user.id)
      ]);

      if (cardsResult.error) {
        console.error('Error loading pokedex cards:', cardsResult.error);
      } else {
        setPokedexCards(cardsResult.data || []);
      }

      if (rewardsResult.error) {
        console.error('Error loading claimed rewards:', rewardsResult.error);
      } else {
        setClaimedRewards(rewardsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading pokedex data:', error);
    } finally {
      setLoading(false);
    }
  };

  const placePokemonInPokedex = async (pokemonId: number, pokemonName: string, isShiny: boolean = false): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('place_pokemon_in_pokedex', {
        p_user_id: user.id,
        p_pokemon_id: pokemonId,
        p_pokemon_name: pokemonName,
        p_is_shiny: isShiny
      });

      if (error) {
        console.error('Error placing pokemon in pokedex:', error);
        toast({
          title: t('toasts:pokedex.error'),
          description: t('toasts:pokedex.errorPlacing'),
          variant: 'destructive'
        });
        return false;
      }

      const result = data[0];
      if (result && result.success) {
        toast({
          title: t('toasts:pokedex.success'),
          description: t('toasts:pokedex.placedInPokedex'),
          variant: 'default'
        });
        // Track roulette boost progress for pokedex_pokemon
        try {
          const { error: pokedexBoostError } = await supabase.rpc('update_roulette_boost_progress', {
            p_user_id: user.id,
            p_task_type: 'pokedex_pokemon',
            p_increment: 1,
          });
          if (pokedexBoostError) throw pokedexBoostError;
        } catch (e) {
          console.error('Error updating roulette boost (pokedex):', e);
        }
        return true;
      } else {
        toast({
          title: t('toasts:pokedex.error'),
          description: result?.message || t('toasts:pokedex.unknownError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error placing pokemon in pokedex:', error);
      toast({
        title: t('toasts:pokedex.error'),
        description: t('toasts:pokedex.errorPlacing'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const getOwnedQuantity = (pokemonId: number, isShiny: boolean = false): number => {
    if (!pokemonInventory) return 0;
    const ownedPokemon = pokemonInventory.find(p => p.pokemon_id === pokemonId && p.is_shiny === isShiny);
    return ownedPokemon?.quantity || 0;
  };

  const getPlacedCardIsShiny = (pokemonId: number): boolean => {
    const placedCard = pokedexCards.find(card => card.pokemon_id === pokemonId);
    return placedCard?.is_shiny || false;
  };

  const isPlacedInPokedex = (pokemonId: number): boolean => {
    return pokedexCards.some(card => card.pokemon_id === pokemonId);
  };

  const getPokedexCompletionRate = (): { placed: number; total: number; percentage: number } => {
    // Calculate completion for all pokemon (including legendaries)
    const total = GEN1_POKEMON.length;
    const placed = pokedexCards.length;
    const percentage = total > 0 ? Math.round((placed / total) * 100) : 0;
    
    return { placed, total, percentage };
  };

  const isRewardClaimed = (section: string, milestone: number): boolean => {
    return claimedRewards.some(r => r.section === section && r.milestone === milestone);
  };

  const claimPokedexReward = async (
    section: string, 
    milestone: number, 
    coins: number, 
    xp: number, 
    shards: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('claim_pokedex_reward', {
        p_user_id: user.id,
        p_section: section,
        p_milestone: milestone,
        p_coins: coins,
        p_xp: xp,
        p_shards: shards
      });

      if (error) {
        console.error('Error claiming pokedex reward:', error);
        toast({
          title: t('toasts:pokedex.error'),
          description: t('toasts:pokedex.errorClaiming'),
          variant: 'destructive'
        });
        return false;
      }

      const result = data as { success: boolean; message: string };
      if (result && result.success) {
        toast({
          title: t('toasts:pokedex.success'),
          description: result.message,
          variant: 'default'
        });
        await loadPokedexCards();
        return true;
      } else {
        toast({
          title: t('toasts:pokedex.error'),
          description: result?.message || t('toasts:pokedex.unknownError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error claiming pokedex reward:', error);
      toast({
        title: t('toasts:pokedex.error'),
        description: t('toasts:pokedex.errorClaiming'),
        variant: 'destructive'
      });
      return false;
    }
  };

  // OPTIMIZATION: Removed auto-load on mount
  // Pokedex data is loaded lazily when PokedexModal opens via refreshPokedex

  useEffect(() => {
    if (!user) {
      setFavoritePokemonIds([]);
      return;
    }

    const storageKey = `pokedex_favorites_${user.id}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      setFavoritePokemonIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setFavoritePokemonIds(parsed.filter((id) => typeof id === 'number'));
      }
    } catch {
      setFavoritePokemonIds([]);
    }
  }, [user]);

  const persistFavorites = (ids: number[]) => {
    if (!user) return;
    localStorage.setItem(`pokedex_favorites_${user.id}`, JSON.stringify(ids));
  };

  const isFavoriteInPokedex = (pokemonId: number): boolean => {
    return favoritePokemonIds.includes(pokemonId);
  };

  const toggleFavoriteInPokedex = (pokemonId: number): boolean => {
    let nextState = false;

    setFavoritePokemonIds((prev) => {
      if (prev.includes(pokemonId)) {
        const next = prev.filter((id) => id !== pokemonId);
        persistFavorites(next);
        nextState = false;
        return next;
      }

      const next = [...prev, pokemonId];
      persistFavorites(next);
      nextState = true;
      return next;
    });

    return nextState;
  };

  const getPlacedCardData = (pokemonId: number): { name: string; rarity: string; isShiny: boolean; placedAt: string } | null => {
    const placedCard = pokedexCards.find(card => card.pokemon_id === pokemonId);
    if (!placedCard) return null;
    
    const pokemon = GEN1_POKEMON.find(p => p.id === pokemonId);
    return {
      name: placedCard.pokemon_name,
      rarity: pokemon?.rarity || 'common',
      isShiny: placedCard.is_shiny,
      placedAt: placedCard.placed_at
    };
  };

  return {
    pokedexCards,
    loading,
    placePokemonInPokedex,
    getOwnedQuantity,
    isPlacedInPokedex,
    getPlacedCardIsShiny,
    getPlacedCardData,
    isFavoriteInPokedex,
    toggleFavoriteInPokedex,
    getPokedexCompletionRate,
    isRewardClaimed,
    claimPokedexReward,
    refreshPokedex: loadPokedexCards
  };
};
