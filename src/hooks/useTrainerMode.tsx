import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getLevelFromTotalXP, MAX_POKEMON_LEVEL, getXPForNextLevel, getPokemonById, type StatGrade } from '@/data/trainerPokemonPool';
import { useAchievements } from './useAchievements';

export type GameMode = 'collector' | 'trainer';

export interface TrainerPokemonData {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_type: string;
  secondary_type?: string;
  star_rating: number;
  level: number;
  experience: number;
  power: number;
  stat_damage: StatGrade;
  stat_speed: StatGrade;
  stat_effect: StatGrade;
  is_evolved: boolean;
  evolved_from?: string;
  is_shiny: boolean;
}

export interface TrainerTeamData {
  id: string;
  slot_1_pokemon_id?: string;
  slot_2_pokemon_id?: string;
  slot_3_pokemon_id?: string;
  pet_pokemon_id?: number;
  pet_pokemon_name?: string;
  pet_rarity?: string;
  pet_is_shiny?: boolean;
}

export interface TrainerProgressData {
  id: string;
  current_stage: number;
  current_wave: number;
  highest_stage_cleared: number;
  total_battles_won: number;
  total_pokemon_defeated: number;
  has_auto_battle?: boolean;
}

export const useTrainerMode = () => {
  const { user } = useAuth();
  const { updateAchievementProgress } = useAchievements();
  
  const [gameMode, setGameMode] = useState<GameMode>('collector');
  const [trainerPokemon, setTrainerPokemon] = useState<TrainerPokemonData[]>([]);
  const [trainerTeam, setTrainerTeam] = useState<TrainerTeamData | null>(null);
  const [trainerProgress, setTrainerProgress] = useState<TrainerProgressData | null>(null);
  const [pokegems, setPokegems] = useState(0);
  const [pokecoins, setPokecoins] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load trainer data - supports silent refresh to avoid UI flickering
  const loadTrainerData = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return;
    
    const isSilent = options?.silent ?? false;
    console.log('[useTrainerMode] loadTrainerData starting...', { silent: isSilent });
    
    // Only show loading spinner on initial load, not on silent refreshes
    if (!isSilent) {
      setIsLoading(true);
    }
    try {
      // Fetch all data in parallel
      const [pokemonResult, teamResult, progressResult, profileResult] = await Promise.all([
        supabase
          .from('trainer_pokemon')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('trainer_teams')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('trainer_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('pokegems, pokecoins')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (pokemonResult.error) throw pokemonResult.error;
      setTrainerPokemon((pokemonResult.data || []) as TrainerPokemonData[]);

      if (teamResult.error) throw teamResult.error;
      setTrainerTeam(teamResult.data as TrainerTeamData | null);

      if (progressResult.error) throw progressResult.error;
      setTrainerProgress(progressResult.data as TrainerProgressData | null);

      if (profileResult.error) throw profileResult.error;
      const gemsFromDb = profileResult.data?.pokegems || 0;
      const coinsFromDb = profileResult.data?.pokecoins || 0;
      console.log('[useTrainerMode] loadTrainerData fetched from DB:', { pokegems: gemsFromDb, pokecoins: coinsFromDb });
      console.log('[useTrainerMode] Before setPokegems - current state value:', pokegems);
      console.log('[useTrainerMode] About to call setPokegems with value:', gemsFromDb);
      setPokegems(gemsFromDb);
      console.log('[useTrainerMode] After setPokegems call (state update queued)');
      setPokecoins(coinsFromDb);

    } catch (error) {
      console.error('Error loading trainer data:', error);
      toast.error('Failed to load trainer data');
    } finally {
      // Only update loading state if we set it to true
      if (!isSilent) {
        setIsLoading(false);
      }
      console.log('[useTrainerMode] loadTrainerData finished', { silent: isSilent });
    }
  }, [user]);

  // Initialize trainer progress and team if not exists
  const initializeTrainerData = useCallback(async () => {
    if (!user || isInitialized) return;
    
    try {
      // Check and create progress if needed
      const { data: existingProgress } = await supabase
        .from('trainer_progress')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingProgress) {
        const { error: progressError } = await supabase
          .from('trainer_progress')
          .insert({
            user_id: user.id,
            current_stage: 1,
            current_wave: 1,
            highest_stage_cleared: 0,
            total_battles_won: 0,
            total_pokemon_defeated: 0,
          });
        
        if (progressError) throw progressError;
      }

      // Check and create team if needed
      const { data: existingTeam } = await supabase
        .from('trainer_teams')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingTeam) {
        const { error: teamError } = await supabase
          .from('trainer_teams')
          .insert({
            user_id: user.id,
          });
        
        if (teamError) throw teamError;
      }

      setIsInitialized(true);
      
      // Reload data after initialization
      await loadTrainerData();
    } catch (error) {
      console.error('Error initializing trainer data:', error);
    }
  }, [user, isInitialized, loadTrainerData]);

  // Auto-initialize on mount when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeTrainerData();
    }
  }, [user, isInitialized, initializeTrainerData]);

  // Switch game mode
  const switchGameMode = useCallback(async (mode: GameMode) => {
    setGameMode(mode);
    
    if (mode === 'trainer' && user) {
      await initializeTrainerData();
    }
  }, [user, initializeTrainerData]);

  // Add pokemon to trainer collection
  const addTrainerPokemon = useCallback(async (pokemon: Omit<TrainerPokemonData, 'id'>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('trainer_pokemon')
        .insert({
          user_id: user.id,
          ...pokemon,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setTrainerPokemon(prev => [...prev, data as TrainerPokemonData]);
      return data;
    } catch (error) {
      console.error('Error adding trainer pokemon:', error);
      return null;
    }
  }, [user]);

  // Update team slot - now creates team if it doesn't exist
  const updateTeamSlot = useCallback(async (slot: 1 | 2 | 3, pokemonId: string | null): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const slotField = `slot_${slot}_pokemon_id` as const;
      
      // If no team exists, create one first
      if (!trainerTeam) {
        const { data: newTeam, error: createError } = await supabase
          .from('trainer_teams')
          .insert({
            user_id: user.id,
            [slotField]: pokemonId,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setTrainerTeam(newTeam as TrainerTeamData);
        return true;
      }
      
      // Update existing team
      const { error } = await supabase
        .from('trainer_teams')
        .update({ [slotField]: pokemonId })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTrainerTeam(prev => prev ? { ...prev, [slotField]: pokemonId } : null);
      return true;
    } catch (error) {
      console.error('Error updating team slot:', error);
      toast.error('Failed to update team');
      return false;
    }
  }, [user, trainerTeam]);

  // Update progress
  const updateProgress = useCallback(async (updates: Partial<TrainerProgressData>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('trainer_progress')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTrainerProgress(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  }, [user]);

  // Update pokegems
  const updatePokegems = useCallback(async (amount: number) => {
    if (!user) return false;
    
    try {
      const newAmount = pokegems + amount;
      const { error } = await supabase
        .from('profiles')
        .update({ pokegems: newAmount })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPokegems(newAmount);
      return true;
    } catch (error) {
      console.error('Error updating pokegems:', error);
      return false;
    }
  }, [user, pokegems]);

  // Purchase auto-farm feature
  const purchaseAutoFarm = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const AUTO_FARM_COST = 150;
    
    if (pokegems < AUTO_FARM_COST) {
      toast.error(`You need ${AUTO_FARM_COST} pokegems to unlock Auto Farm`);
      return false;
    }
    
    try {
      // Deduct pokegems
      const newPokegems = pokegems - AUTO_FARM_COST;
      const { error: gemsError } = await supabase
        .from('profiles')
        .update({ pokegems: newPokegems })
        .eq('user_id', user.id);
      
      if (gemsError) throw gemsError;
      
      // Update has_auto_battle (using same column for auto-farm)
      const { error: progressError } = await supabase
        .from('trainer_progress')
        .update({ has_auto_battle: true })
        .eq('user_id', user.id);
      
      if (progressError) throw progressError;
      
      setPokegems(newPokegems);
      setTrainerProgress(prev => prev ? { ...prev, has_auto_battle: true } : null);
      
      toast.success('Auto Farm Unlocked! Battles will automatically restart after completing a run');
      
      return true;
    } catch (error) {
      console.error('Error purchasing auto-farm:', error);
      toast.error('Failed to purchase Auto Farm');
      return false;
    }
  }, [user, pokegems]);

  // Apply run rewards (pokegems + pokemon XP + update highest stage + enemies defeated)
  const applyRunRewards = useCallback(async (rewards: {
    pokegems: number;
    pokemonXP: { pokemonId: string; xp: number }[];
    highestStage: number;
    enemiesDefeated: number;
  }): Promise<boolean> => {
    if (!user) {
      if (import.meta.env.DEV) console.debug('[TrainerRun]', 'applyRunRewards_abort_no_user');
      return false;
    }

    if (import.meta.env.DEV) {
      console.debug('[TrainerRun]', 'applyRunRewards_start', {
        rewards,
        localBefore: { pokegems, highestStageCleared: trainerProgress?.highest_stage_cleared },
      });
    }

    try {
      // 1. Calculate new values locally
      const newPokegems = pokegems + rewards.pokegems;
      const currentHighest = trainerProgress?.highest_stage_cleared || 0;
      const newHighest = Math.max(currentHighest, rewards.highestStage);

      // 2. Batch prepare pokemon updates with new XP/levels
      const levelUps: { name: string; newLevel: number }[] = [];
      const pokemonUpdates = rewards.pokemonXP
        .map(({ pokemonId, xp }) => {
          const pokemon = trainerPokemon.find(p => p.id === pokemonId);
          if (!pokemon) return null;

          const newExperience = pokemon.experience + xp;
          const newLevel = Math.min(getLevelFromTotalXP(newExperience), MAX_POKEMON_LEVEL);

          if (newLevel > pokemon.level) {
            levelUps.push({ name: pokemon.pokemon_name, newLevel });
          }

          return {
            id: pokemonId,
            experience: newExperience,
            level: newLevel,
          };
        })
        .filter(Boolean);

      // 3. OPTIMIZATION: Single RPC call for all database updates
      const { data, error } = await supabase.rpc('apply_trainer_run_rewards', {
        p_user_id: user.id,
        p_pokemon_updates: JSON.stringify(pokemonUpdates),
        p_new_pokegems: newPokegems,
        p_highest_stage: newHighest,
        p_enemies_defeated: rewards.enemiesDefeated,
      });

      let rpcSucceeded = false;

      if (error) {
        const isMissingRpc = error.code === 'PGRST202' || error.code === '404';
        console.error('Error calling apply_trainer_run_rewards RPC:', error);

        if (!isMissingRpc) {
          throw error;
        }

        if (import.meta.env.DEV) {
          console.debug('[TrainerRun]', 'applyRunRewards_rpc_missing_fallback_to_direct_updates');
        }

        const updatePromises = [
          supabase
            .from('profiles')
            .update({ pokegems: newPokegems })
            .eq('user_id', user.id),
          supabase
            .from('trainer_progress')
            .update({
              highest_stage_cleared: newHighest,
              total_battles_won: (trainerProgress?.total_battles_won || 0) + 1,
              total_pokemon_defeated: (trainerProgress?.total_pokemon_defeated || 0) + rewards.enemiesDefeated,
            })
            .eq('user_id', user.id),
          ...pokemonUpdates.map((update) =>
            supabase
              .from('trainer_pokemon')
              .update({
                experience: update.experience,
                level: update.level,
              })
              .eq('id', update.id)
              .eq('user_id', user.id)
          ),
        ];

        const fallbackResults = await Promise.all(updatePromises);
        const fallbackError = fallbackResults.find((result) => result.error)?.error;

        if (fallbackError) {
          throw fallbackError;
        }

        rpcSucceeded = true;
      } else {
        const result = data as any;
        if (!result?.success) {
          toast.error(result?.message || 'Failed to apply rewards');
          return false;
        }

        if (import.meta.env.DEV) {
          console.debug('[TrainerRun]', 'applyRunRewards_rpc_success', result);
        }

        rpcSucceeded = true;
      }

      if (!rpcSucceeded) {
        return false;
      }

      // 4. Update local state
      setPokegems(newPokegems);
      setTrainerProgress(prev => prev ? {
        ...prev,
        highest_stage_cleared: newHighest,
        total_battles_won: (prev.total_battles_won || 0) + 1,
        total_pokemon_defeated: (prev.total_pokemon_defeated || 0) + rewards.enemiesDefeated,
      } : null);

      // Update trainer pokemon local state
      setTrainerPokemon(prev => prev.map(p => {
        const updated = pokemonUpdates.find(u => u.id === p.id);
        return updated ? { ...p, experience: updated.experience, level: updated.level } : p;
      }));

      // 5. Async secondary updates (don't block on these)
      Promise.all([
        // Add clan points
        rewards.enemiesDefeated > 0 ? supabase.rpc('add_clan_points', {
          p_user_id: user.id,
          p_points: rewards.enemiesDefeated * 2,
          p_activity_type: 'trainer_enemies',
          p_count: rewards.enemiesDefeated
        }) : Promise.resolve(),

        // Track achievements
        Promise.all([
          rewards.enemiesDefeated > 0 ? updateAchievementProgress('trainer_defeats', rewards.enemiesDefeated, true) : Promise.resolve(),
          newHighest > currentHighest ? updateAchievementProgress('trainer_stage', newHighest - currentHighest, true) : Promise.resolve(),
        ]),

        // Track roulette boost
        Promise.all([
          rewards.enemiesDefeated > 0 ? supabase.rpc('update_roulette_boost_progress', {
            p_user_id: user.id,
            p_task_type: 'trainer_enemies_defeated',
            p_increment: rewards.enemiesDefeated,
          }) : Promise.resolve(),
          newHighest > currentHighest ? supabase.rpc('update_roulette_boost_progress', {
            p_user_id: user.id,
            p_task_type: 'trainer_stages_cleared',
            p_increment: newHighest - currentHighest,
          }) : Promise.resolve(),
        ]),
      ]).catch(error => {
        console.error('Error in secondary trainer reward updates:', error);
      });

      // Show level up toasts
      for (const { name, newLevel } of levelUps) {
        toast.success(`${name} leveled up to ${newLevel}!`);
      }

      if (import.meta.env.DEV) console.debug('[TrainerRun]', 'applyRunRewards_done', { localAfter: { newPokegems } });

      return true;
    } catch (error) {
      console.error('Error applying run rewards:', error);
      if (import.meta.env.DEV) console.debug('[TrainerRun]', 'applyRunRewards_failed', { error });
      toast.error('Failed to save rewards');
      return false;
    }
  }, [user, pokegems, trainerProgress, trainerPokemon, updateAchievementProgress]);

  // Get team pokemon data
  const getTeamPokemon = useCallback(() => {
    if (!trainerTeam) return [];
    
    const teamPokemonIds = [
      trainerTeam.slot_1_pokemon_id,
      trainerTeam.slot_2_pokemon_id,
      trainerTeam.slot_3_pokemon_id,
    ].filter(Boolean) as string[];
    
    return trainerPokemon.filter(p => teamPokemonIds.includes(p.id));
  }, [trainerTeam, trainerPokemon]);

  // Delete multiple trainer pokemon
  const deleteTrainerPokemon = useCallback(async (pokemonIds: string[]): Promise<boolean> => {
    if (!user || pokemonIds.length === 0) return false;
    
    try {
      const { error } = await supabase
        .from('trainer_pokemon')
        .delete()
        .in('id', pokemonIds)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTrainerPokemon(prev => prev.filter(p => !pokemonIds.includes(p.id)));
      return true;
    } catch (error) {
      console.error('Error deleting trainer pokemon:', error);
      toast.error('Failed to delete pokemon');
      return false;
    }
  }, [user]);

  // Roll pokemon stat using Status Upgrade item (via server RPC)
  const rollPokemonStat = useCallback(async (
    pokemonId: string,
    stat: 'stat_damage' | 'stat_speed' | 'stat_effect'
  ): Promise<StatGrade | null> => {
    if (!user) return null;
    
    const pokemon = trainerPokemon.find(p => p.id === pokemonId);
    if (!pokemon) return null;
    
    try {
      // Roll new grade client-side
      const { rollRandomStat } = await import('@/data/trainerPokemonPool');
      const newGrade = rollRandomStat();
      
      // Execute atomically on server (consumes item + updates stat)
      const { data, error } = await supabase.rpc('roll_pokemon_stat', {
        p_user_id: user.id,
        p_pokemon_id: pokemonId,
        p_stat: stat,
        p_new_grade: newGrade,
      });
      
      if (error) {
        console.error('Error rolling stat:', error);
        toast.error('Erro ao rolar status');
        return null;
      }
      
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.message || 'Erro ao rolar status');
        return null;
      }
      
      // Update local state
      setTrainerPokemon(prev => prev.map(p => 
        p.id === pokemonId ? { ...p, [stat]: newGrade as any } : p
      ));
      
      return newGrade;
    } catch (error) {
      console.error('Error rolling stat:', error);
      toast.error('Failed to roll stat');
      return null;
    }
  }, [user, trainerPokemon]);

  // Evolve trainer pokemon
  const evolveTrainerPokemon = useCallback(async (
    pokemonId: string,
    duplicateId: string,
    targetPokemonId: number,
    targetPokemonName: string
  ): Promise<boolean> => {
    if (!user) return false;
    
    const pokemon = trainerPokemon.find(p => p.id === pokemonId);
    if (!pokemon) return false;
    const evolvedPokemon = getPokemonById(targetPokemonId);
    
    try {
      // Delete duplicate and update pokemon
      await Promise.all([
        supabase.from('trainer_pokemon').delete().eq('id', duplicateId),
        supabase.from('trainer_pokemon').update({
          pokemon_id: targetPokemonId,
          pokemon_name: targetPokemonName,
          pokemon_type: evolvedPokemon?.type ?? pokemon.pokemon_type,
          secondary_type: evolvedPokemon?.secondaryType ?? pokemon.secondary_type,
          star_rating: evolvedPokemon?.starRating ?? pokemon.star_rating,
          power: evolvedPokemon?.basePower ?? pokemon.power,
          is_evolved: true,
          evolved_from: pokemon.pokemon_name,
          is_shiny: pokemon.is_shiny,
        }).eq('id', pokemonId),
      ]);
      
      // Consume essences
      const { ESSENCE_ITEM_IDS } = await import('@/data/essenceConfig');
      const { getTrainerEvolutionRequirements } = await import('@/data/trainerEvolutionData');
      const req = getTrainerEvolutionRequirements(pokemon.pokemon_id);
      if (req) {
        const essenceItemId = ESSENCE_ITEM_IDS[pokemon.pokemon_type as keyof typeof ESSENCE_ITEM_IDS];
        const { data: itemData } = await supabase
          .from('user_items')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('item_id', essenceItemId)
          .single();
        
        if (itemData) {
          await supabase
            .from('user_items')
            .update({ quantity: Math.max(0, itemData.quantity - req.essencesRequired) })
            .eq('user_id', user.id)
            .eq('item_id', essenceItemId);
        }
      }
      
      await loadTrainerData();
      return true;
    } catch (error) {
      console.error('Error evolving pokemon:', error);
      toast.error('Failed to evolve pokemon');
      return false;
    }
  }, [user, trainerPokemon, loadTrainerData]);

  // Set pet slot
  const setPetSlot = useCallback(async (pokemonId: number, pokemonName: string, rarity: string, isShiny: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('trainer_teams')
        .update({
          pet_pokemon_id: pokemonId,
          pet_pokemon_name: pokemonName,
          pet_rarity: rarity,
          pet_is_shiny: isShiny,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTrainerTeam(prev => prev ? {
        ...prev,
        pet_pokemon_id: pokemonId,
        pet_pokemon_name: pokemonName,
        pet_rarity: rarity,
        pet_is_shiny: isShiny,
      } : null);
      
      return true;
    } catch (error) {
      console.error('Error setting pet:', error);
      toast.error('Failed to set pet');
      return false;
    }
  }, [user]);

  // Remove pet slot
  const removePet = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('trainer_teams')
        .update({
          pet_pokemon_id: null,
          pet_pokemon_name: null,
          pet_rarity: null,
          pet_is_shiny: false,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTrainerTeam(prev => prev ? {
        ...prev,
        pet_pokemon_id: undefined,
        pet_pokemon_name: undefined,
        pet_rarity: undefined,
        pet_is_shiny: false,
      } : null);
      
      return true;
    } catch (error) {
      console.error('Error removing pet:', error);
      toast.error('Failed to remove pet');
      return false;
    }
  }, [user]);

  return {
    gameMode,
    switchGameMode,
    trainerPokemon,
    trainerTeam,
    trainerProgress,
    pokegems,
    pokecoins,
    isLoading,
    isInitialized,
    addTrainerPokemon,
    updateTeamSlot,
    updateProgress,
    updatePokegems,
    purchaseAutoFarm,
    applyRunRewards,
    getTeamPokemon,
    loadTrainerData,
    deleteTrainerPokemon,
    rollPokemonStat,
    evolveTrainerPokemon,
    setPetSlot,
    removePet,
  };
};