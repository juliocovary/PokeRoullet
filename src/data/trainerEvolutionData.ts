// Trainer Mode Evolution Configuration
import { evolutionChains } from './evolutionData';
import type { PokemonType } from './typeAdvantages';

export interface TrainerEvolutionRequirement {
  levelRequired: number;
  essencesRequired: number;
  duplicatesRequired: number;
  evolvesTo: number;
  evolvedName: string;
}

// Evolution types with their requirements
export const EVOLUTION_REQUIREMENTS = {
  first: {
    levelRequired: 15,
    essencesRequired: 100,
    duplicatesRequired: 1,
  },
  last: {
    levelRequired: 45,
    essencesRequired: 150,
    duplicatesRequired: 1,
  },
  single: {
    levelRequired: 20,
    essencesRequired: 125,
    duplicatesRequired: 1,
  },
};

// Check if a pokemon ID evolves into another pokemon that also evolves
const hasSubsequentEvolution = (pokemonId: number): boolean => {
  const chain = evolutionChains[pokemonId];
  if (!chain || chain.length === 0) return false;
  
  const evolvedId = chain[0].evolvesTo;
  return !!evolutionChains[evolvedId];
};

// Check if this pokemon is the result of an evolution
const isEvolvedForm = (pokemonId: number): boolean => {
  for (const [, evolutions] of Object.entries(evolutionChains)) {
    if (evolutions.some(e => e.evolvesTo === pokemonId)) {
      return true;
    }
  }
  return false;
};

/**
 * Get the evolution requirements for a trainer pokemon
 * @param pokemonId The pokemon's ID
 * @returns The evolution requirements or null if the pokemon can't evolve
 */
export const getTrainerEvolutionRequirements = (
  pokemonId: number
): TrainerEvolutionRequirement | null => {
  const chain = evolutionChains[pokemonId];
  if (!chain || chain.length === 0) return null;
  
  // Get the first evolution option (for simplicity, we'll use the first one)
  const evolution = chain[0];
  
  // Determine evolution type
  const evolvesToAlsoEvolves = hasSubsequentEvolution(pokemonId);
  const isAlreadyEvolved = isEvolvedForm(pokemonId);
  
  let requirements;
  
  if (evolvesToAlsoEvolves) {
    // First evolution (e.g., Bulbasaur -> Ivysaur)
    requirements = EVOLUTION_REQUIREMENTS.first;
  } else if (isAlreadyEvolved) {
    // Last evolution (e.g., Ivysaur -> Venusaur)
    requirements = EVOLUTION_REQUIREMENTS.last;
  } else {
    // Single evolution (e.g., Vulpix -> Ninetales)
    requirements = EVOLUTION_REQUIREMENTS.single;
  }
  
  return {
    ...requirements,
    evolvesTo: evolution.evolvesTo,
    evolvedName: evolution.evolvedName,
  };
};

/**
 * Get all available evolutions for a pokemon (for pokemon with multiple evolution paths)
 * @param pokemonId The pokemon's ID
 * @returns Array of evolution requirements or empty array
 */
export const getAllTrainerEvolutions = (
  pokemonId: number
): TrainerEvolutionRequirement[] => {
  const chain = evolutionChains[pokemonId];
  if (!chain || chain.length === 0) return [];
  
  const evolvesToAlsoEvolves = hasSubsequentEvolution(pokemonId);
  const isAlreadyEvolved = isEvolvedForm(pokemonId);
  
  let requirements;
  
  if (evolvesToAlsoEvolves) {
    requirements = EVOLUTION_REQUIREMENTS.first;
  } else if (isAlreadyEvolved) {
    requirements = EVOLUTION_REQUIREMENTS.last;
  } else {
    requirements = EVOLUTION_REQUIREMENTS.single;
  }
  
  return chain.map(evolution => ({
    ...requirements,
    evolvesTo: evolution.evolvesTo,
    evolvedName: evolution.evolvedName,
  }));
};

/**
 * Check if a pokemon can evolve given current resources
 */
export const canPokemonEvolve = (
  pokemonId: number,
  pokemonLevel: number,
  pokemonType: PokemonType,
  essenceCount: number,
  duplicateCount: number
): { canEvolve: boolean; reason?: string } => {
  const requirements = getTrainerEvolutionRequirements(pokemonId);
  
  if (!requirements) {
    return { canEvolve: false, reason: 'This Pokémon cannot evolve' };
  }
  
  if (pokemonLevel < requirements.levelRequired) {
    return { 
      canEvolve: false, 
      reason: `Level ${requirements.levelRequired} required (current: ${pokemonLevel})` 
    };
  }
  
  if (essenceCount < requirements.essencesRequired) {
    return { 
      canEvolve: false, 
      reason: `${requirements.essencesRequired} ${pokemonType} essences required (have: ${essenceCount})` 
    };
  }
  
  if (duplicateCount < requirements.duplicatesRequired) {
    return { 
      canEvolve: false, 
      reason: `${requirements.duplicatesRequired} duplicate(s) required (have: ${duplicateCount})` 
    };
  }
  
  return { canEvolve: true };
};
