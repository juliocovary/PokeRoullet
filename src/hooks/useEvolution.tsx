import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { getEvolutionOptions, EvolutionRequirement } from '@/data/evolutionData';
import { UserItem } from './useInventory';
import i18n from '@/i18n/config';

// Helper function to update launch event progress
const updateLaunchEventProgress = async (userId: string, category: string, increment: number = 1) => {
  const { data, error } = await supabase.rpc('update_launch_event_progress', {
    p_user_id: userId,
    p_category: category,
    p_increment: increment,
  });
  
  if (error) {
    console.error('[LAUNCH_EVENT] Error updating progress:', error);
  } else {
    console.log('[LAUNCH_EVENT] Progress updated:', { category, increment, data });
  }
};

interface PokemonInventoryItem {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  quantity: number;
}

export const useEvolution = (
  pokemonInventory: PokemonInventoryItem[],
  userItems: UserItem[],
  refreshInventory: () => Promise<void>,
  refreshUserItems: () => Promise<void>
) => {
  const { user } = useAuth();
  const [isEvolving, setIsEvolving] = useState(false);

  const t = (key: string) => i18n.t(key);

  const checkEvolutionRequirements = (
    pokemonId: number,
    evolution: EvolutionRequirement
  ): { canEvolve: boolean; missingMessage: string } => {
    const pokemon = pokemonInventory.find(p => p.pokemon_id === pokemonId);
    
    if (!pokemon) {
      return { canEvolve: false, missingMessage: t('modals:evolution.noPokemonEvolvable') };
    }

    const missingItems: string[] = [];

    // Check if user has enough cards
    if (pokemon.quantity < evolution.requiredCards) {
      const needed = evolution.requiredCards - pokemon.quantity;
      missingItems.push(`${needed} ${pokemon.pokemon_name}`);
    }

    // Check if user has required item (for Eevee evolutions)
    if (evolution.requiredItem) {
      const item = userItems.find(i => i.id === evolution.requiredItem!.id);
      if (!item || item.quantity < 1) {
        missingItems.push(`1 ${evolution.requiredItem.name}`);
      }
    }

    if (missingItems.length > 0) {
      return {
        canEvolve: false,
        missingMessage: `${t('modals:evolution.requirements')}: ${missingItems.join(' + ')}`
      };
    }

    return { canEvolve: true, missingMessage: '' };
  };

  const evolvePokemon = async (
    pokemonId: number,
    pokemonName: string,
    evolution: EvolutionRequirement
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: t('toasts:evolution.error'),
        description: t('toasts:evolution.needLogin'),
        variant: "destructive",
      });
      return false;
    }

    setIsEvolving(true);

    try {
      let { data, error } = await supabase.rpc('evolve_pokemon', {
        p_user_id: user.id,
        p_base_pokemon_id: pokemonId,
        p_evolved_pokemon_id: evolution.evolvesTo,
        p_evolved_pokemon_name: evolution.evolvedName,
        p_evolved_pokemon_rarity: evolution.evolvedRarity,
        p_cards_required: evolution.requiredCards,
        p_item_id: evolution.requiredItem?.id || null,
      });

      // Backward compatibility for environments with older RPC signatures.
      if (error && !evolution.requiredItem) {
        const fallbackNoItem = await supabase.rpc('evolve_pokemon', {
          p_user_id: user.id,
          p_base_pokemon_id: pokemonId,
          p_evolved_pokemon_id: evolution.evolvesTo,
          p_evolved_pokemon_name: evolution.evolvedName,
          p_evolved_pokemon_rarity: evolution.evolvedRarity,
          p_cards_required: evolution.requiredCards,
        });
        data = fallbackNoItem.data;
        error = fallbackNoItem.error;
      }

      if (error && !evolution.requiredItem) {
        const fallbackMinimal = await supabase.rpc('evolve_pokemon', {
          p_user_id: user.id,
          p_base_pokemon_id: pokemonId,
          p_evolved_pokemon_id: evolution.evolvesTo,
          p_evolved_pokemon_name: evolution.evolvedName,
          p_evolved_pokemon_rarity: evolution.evolvedRarity,
        });
        data = fallbackMinimal.data;
        error = fallbackMinimal.error;
      }

      if (error) {
        console.error('Error evolving pokemon:', error);
        toast({
          title: t('toasts:evolution.evolutionError'),
          description: error.message || t('toasts:evolution.couldNotEvolve'),
          variant: "destructive",
        });
        return false;
      }

      const result = data[0];
      if (result && result.success) {
        // Save evolution result to localStorage for display after page reload
        const evolutionResult = {
          basePokemonId: pokemonId,
          basePokemonName: pokemonName,
          evolvedPokemonId: evolution.evolvesTo,
          evolvedPokemonName: evolution.evolvedName,
          evolvedPokemonRarity: evolution.evolvedRarity,
        };
        localStorage.setItem('evolutionResult', JSON.stringify(evolutionResult));
        window.dispatchEvent(new CustomEvent('evolutionResultReady', { detail: evolutionResult }));
        
        // Update launch event progress
        await updateLaunchEventProgress(user.id, 'evolve', 1);
        
        // Don't refresh here - let the modal handle it after animation
        return true;
      }

      toast({
        title: t('toasts:evolution.error'),
        description: result?.message || t('toasts:evolution.couldNotEvolve'),
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Error evolving pokemon:', error);
      toast({
        title: t('toasts:evolution.error'),
        description: t('toasts:evolution.unexpectedError'),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsEvolving(false);
    }
  };

  return {
    isEvolving,
    checkEvolutionRequirements,
    evolvePokemon,
    getEvolutionOptions,
  };
};
