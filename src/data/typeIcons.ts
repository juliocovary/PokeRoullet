// Type Icons for Status Effects Display
// Using PokeAPI sprites for official type icons

import type { PokemonType } from './typeAdvantages';

// PokeAPI type sprite URLs (Sword/Shield style)
// Type IDs: https://pokeapi.co/api/v2/type/
const POKEAPI_TYPE_SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield';

// Type ID mapping from PokeAPI
const TYPE_IDS: Record<PokemonType, number> = {
  normal: 1,
  fighting: 2,
  flying: 3,
  poison: 4,
  ground: 5,
  rock: 6,
  bug: 7,
  ghost: 8,
  steel: 9,
  fire: 10,
  water: 11,
  grass: 12,
  electric: 13,
  psychic: 14,
  ice: 15,
  dragon: 16,
  dark: 17,
  fairy: 18,
};

/**
 * Get the official PokeAPI type icon URL
 */
export const getTypeIconUrl = (type: PokemonType): string => {
  const typeId = TYPE_IDS[type];
  if (!typeId) return '';
  return `${POKEAPI_TYPE_SPRITES}/${typeId}.png`;
};

/**
 * Type colors for badges and UI elements (matches TYPE_COLORS from typeAdvantages)
 */
export const TYPE_BADGE_COLORS: Record<PokemonType, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-stone-400/80', text: 'text-white', border: 'border-stone-500' },
  fire: { bg: 'bg-orange-500/80', text: 'text-white', border: 'border-orange-600' },
  water: { bg: 'bg-blue-500/80', text: 'text-white', border: 'border-blue-600' },
  electric: { bg: 'bg-yellow-400/80', text: 'text-black', border: 'border-yellow-500' },
  grass: { bg: 'bg-green-500/80', text: 'text-white', border: 'border-green-600' },
  ice: { bg: 'bg-cyan-400/80', text: 'text-black', border: 'border-cyan-500' },
  fighting: { bg: 'bg-red-600/80', text: 'text-white', border: 'border-red-700' },
  poison: { bg: 'bg-purple-500/80', text: 'text-white', border: 'border-purple-600' },
  ground: { bg: 'bg-amber-600/80', text: 'text-white', border: 'border-amber-700' },
  flying: { bg: 'bg-indigo-400/80', text: 'text-white', border: 'border-indigo-500' },
  psychic: { bg: 'bg-pink-500/80', text: 'text-white', border: 'border-pink-600' },
  bug: { bg: 'bg-lime-500/80', text: 'text-black', border: 'border-lime-600' },
  rock: { bg: 'bg-stone-500/80', text: 'text-white', border: 'border-stone-600' },
  ghost: { bg: 'bg-violet-600/80', text: 'text-white', border: 'border-violet-700' },
  dragon: { bg: 'bg-violet-500/80', text: 'text-white', border: 'border-violet-600' },
  dark: { bg: 'bg-stone-700/80', text: 'text-white', border: 'border-stone-800' },
  steel: { bg: 'bg-slate-400/80', text: 'text-black', border: 'border-slate-500' },
  fairy: { bg: 'bg-pink-400/80', text: 'text-black', border: 'border-pink-500' },
};

/**
 * Effect-specific badge info for displaying status effects
 */
export const EFFECT_BADGE_INFO: Record<string, { 
  icon: string; 
  name: string;
  type: PokemonType;
}> = {
  burning: { icon: '🔥', name: 'Burning', type: 'fire' },
  bubble: { icon: '💧', name: 'Bubble', type: 'water' },
  rooting: { icon: '🌿', name: 'Rooted', type: 'grass' },
  paralyzed: { icon: '⚡', name: 'Paralyzed', type: 'electric' },
  vulnerable: { icon: '🔮', name: 'Vulnerable', type: 'psychic' },
  freeze: { icon: '❄️', name: 'Frozen', type: 'ice' },
  draconicPressure: { icon: '🐉', name: 'Pressure', type: 'dragon' },
};
