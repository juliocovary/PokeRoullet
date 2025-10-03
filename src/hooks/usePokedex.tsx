import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePokemon } from './usePokemon';
import { useToast } from '@/hooks/use-toast';

export interface PokedexCard {
  pokemon_id: number;
  pokemon_name: string;
  placed_at: string;
}

export const usePokedex = () => {
  const { user } = useAuth();
  const { inventory: pokemonInventory, GEN1_POKEMON } = usePokemon();
  const { toast } = useToast();
  const [pokedexCards, setPokedexCards] = useState<PokedexCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPokedexCards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pokedex_cards')
        .select('pokemon_id, pokemon_name, placed_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading pokedex cards:', error);
        return;
      }

      setPokedexCards(data || []);
    } catch (error) {
      console.error('Error loading pokedex cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const placePokemonInPokedex = async (pokemonId: number, pokemonName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('place_pokemon_in_pokedex', {
        p_user_id: user.id,
        p_pokemon_id: pokemonId,
        p_pokemon_name: pokemonName
      });

      if (error) {
        console.error('Error placing pokemon in pokedex:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao colar Pokémon na Pokédex.',
          variant: 'destructive'
        });
        return false;
      }

      const result = data[0];
      if (result && result.success) {
        // Reload pokedex cards
        await loadPokedexCards();
        
        toast({
          title: 'Sucesso!',
          description: result.message,
          variant: 'default'
        });
        return true;
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro desconhecido.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error placing pokemon in pokedex:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao colar Pokémon na Pokédex.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getOwnedQuantity = (pokemonId: number): number => {
    const ownedPokemon = pokemonInventory.find(p => p.pokemon_id === pokemonId);
    return ownedPokemon?.quantity || 0;
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

  useEffect(() => {
    loadPokedexCards();
  }, [user]);

  return {
    pokedexCards,
    loading,
    placePokemonInPokedex,
    getOwnedQuantity,
    isPlacedInPokedex,
    getPokedexCompletionRate,
    refreshPokedex: loadPokedexCards
  };
};