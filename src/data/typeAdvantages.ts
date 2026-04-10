// Pokemon Type Advantages System

export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

// Type effectiveness multipliers
export const SUPER_EFFECTIVE = 1.5;
export const NOT_VERY_EFFECTIVE = 0.67;
export const NO_EFFECT = 0;
export const NORMAL_EFFECTIVE = 1;

// Type chart: attacker -> defender -> multiplier
// Only storing non-neutral matchups for efficiency
const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: {
    rock: NOT_VERY_EFFECTIVE,
    ghost: NO_EFFECT,
    steel: NOT_VERY_EFFECTIVE,
  },
  fire: {
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    bug: SUPER_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
    steel: SUPER_EFFECTIVE,
  },
  water: {
    fire: SUPER_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    ground: SUPER_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  electric: {
    water: SUPER_EFFECTIVE,
    electric: NOT_VERY_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    ground: NO_EFFECT,
    flying: SUPER_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  grass: {
    fire: NOT_VERY_EFFECTIVE,
    water: SUPER_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    ground: SUPER_EFFECTIVE,
    flying: NOT_VERY_EFFECTIVE,
    bug: NOT_VERY_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
  },
  ice: {
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    ice: NOT_VERY_EFFECTIVE,
    ground: SUPER_EFFECTIVE,
    flying: SUPER_EFFECTIVE,
    dragon: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
  },
  fighting: {
    normal: SUPER_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    flying: NOT_VERY_EFFECTIVE,
    psychic: NOT_VERY_EFFECTIVE,
    bug: NOT_VERY_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    ghost: NO_EFFECT,
    dark: SUPER_EFFECTIVE,
    steel: SUPER_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  poison: {
    grass: SUPER_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    ground: NOT_VERY_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    ghost: NOT_VERY_EFFECTIVE,
    steel: NO_EFFECT,
    fairy: SUPER_EFFECTIVE,
  },
  ground: {
    fire: SUPER_EFFECTIVE,
    electric: SUPER_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    poison: SUPER_EFFECTIVE,
    flying: NO_EFFECT,
    bug: NOT_VERY_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    steel: SUPER_EFFECTIVE,
  },
  flying: {
    electric: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    fighting: SUPER_EFFECTIVE,
    bug: SUPER_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
  },
  psychic: {
    fighting: SUPER_EFFECTIVE,
    poison: SUPER_EFFECTIVE,
    psychic: NOT_VERY_EFFECTIVE,
    dark: NO_EFFECT,
    steel: NOT_VERY_EFFECTIVE,
  },
  bug: {
    fire: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    fighting: NOT_VERY_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    flying: NOT_VERY_EFFECTIVE,
    psychic: SUPER_EFFECTIVE,
    ghost: NOT_VERY_EFFECTIVE,
    dark: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  rock: {
    fire: SUPER_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    fighting: NOT_VERY_EFFECTIVE,
    ground: NOT_VERY_EFFECTIVE,
    flying: SUPER_EFFECTIVE,
    bug: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
  },
  ghost: {
    normal: NO_EFFECT,
    psychic: SUPER_EFFECTIVE,
    ghost: SUPER_EFFECTIVE,
    dark: NOT_VERY_EFFECTIVE,
  },
  dragon: {
    dragon: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fairy: NO_EFFECT,
  },
  dark: {
    fighting: NOT_VERY_EFFECTIVE,
    psychic: SUPER_EFFECTIVE,
    ghost: SUPER_EFFECTIVE,
    dark: NOT_VERY_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  steel: {
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    electric: NOT_VERY_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fairy: SUPER_EFFECTIVE,
  },
  fairy: {
    fire: NOT_VERY_EFFECTIVE,
    fighting: SUPER_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    dragon: SUPER_EFFECTIVE,
    dark: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
  },
};

/**
 * Calculate the type effectiveness multiplier
 * @param attackerType The type of the attacking move
 * @param defenderType The primary type of the defending Pokemon
 * @param defenderSecondaryType Optional secondary type of the defender
 * @returns The damage multiplier
 */
export const getTypeEffectiveness = (
  attackerType: PokemonType,
  defenderType: PokemonType,
  defenderSecondaryType?: PokemonType
): number => {
  let multiplier = TYPE_CHART[attackerType]?.[defenderType] ?? NORMAL_EFFECTIVE;
  
  // If defender has a secondary type, multiply the effectiveness
  if (defenderSecondaryType) {
    const secondaryMultiplier = TYPE_CHART[attackerType]?.[defenderSecondaryType] ?? NORMAL_EFFECTIVE;
    multiplier *= secondaryMultiplier;
  }
  
  return multiplier;
};

/**
 * Get a description of the type matchup
 */
export const getEffectivenessText = (multiplier: number): string => {
  if (multiplier >= 2) return 'super_effective_double';
  if (multiplier >= 1.5) return 'super_effective';
  if (multiplier === 0) return 'no_effect';
  if (multiplier < 0.5) return 'barely_effective';
  if (multiplier < 1) return 'not_very_effective';
  return 'normal';
};

/**
 * Get types that are strong against a given type
 */
export const getWeaknesses = (type: PokemonType): PokemonType[] => {
  const weaknesses: PokemonType[] = [];
  
  for (const [attackerType, matchups] of Object.entries(TYPE_CHART)) {
    if (matchups[type] === SUPER_EFFECTIVE) {
      weaknesses.push(attackerType as PokemonType);
    }
  }
  
  return weaknesses;
};

/**
 * Get types that are weak against a given type
 */
export const getStrengths = (type: PokemonType): PokemonType[] => {
  const strengths: PokemonType[] = [];
  const typeMatchups = TYPE_CHART[type];
  
  if (typeMatchups) {
    for (const [defenderType, multiplier] of Object.entries(typeMatchups)) {
      if (multiplier === SUPER_EFFECTIVE) {
        strengths.push(defenderType as PokemonType);
      }
    }
  }
  
  return strengths;
};

// Type colors for UI
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

// Type icons (emoji representation)
export const TYPE_ICONS: Record<PokemonType, string> = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '👊',
  poison: '☠️',
  ground: '🏔️',
  flying: '🦅',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
};
