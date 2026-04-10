// Trainer Mode Pokemon Pool - Kanto Season
import { getEffectiveDamageMultiplier } from './typeModifiers';

export interface TrainerPokemon {
  id: number;
  name: string;
  type: string;
  secondaryType?: string;
  starRating: number;
  basePower: number;
  bannerChance: number; // Percentage chance when summoning
  canAppearInBanner: boolean;
  evolvesFrom?: string;
  evolvesTo?: string;
  evolutionLevel?: number;
  evolutionDuplicates?: number;
  isNatural: boolean; // Natural = not evolved, used for power scaling
}

// Stats multipliers by grade
export const STAT_GRADES = ['C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+'] as const;
export type StatGrade = typeof STAT_GRADES[number];

export const DAMAGE_MULTIPLIERS: Record<StatGrade, number> = {
  'C-': 0.95,  // -5%
  'C': 1.00,   // 0%
  'C+': 1.05,  // +5%
  'B-': 1.15,  // +15%
  'B': 1.25,   // +25%
  'B+': 1.40,  // +40%
  'A-': 1.55,  // +55%
  'A': 1.75,   // +75%
  'A+': 1.95,  // +95%
  'S-': 2.05,  // +105%
  'S': 2.15,   // +115%
  'S+': 2.25,  // +125%
};

export const SPEED_VALUES: Record<StatGrade, number> = {
  'C-': 1.0,   // 1 attack per second
  'C': 0.97,   // 1.03 attacks per second
  'C+': 0.94,  // 1.06 attacks per second
  'B-': 0.91,  // 1.10 attacks per second
  'B': 0.88,   // 1.14 attacks per second
  'B+': 0.85,  // 1.18 attacks per second
  'A-': 0.82,  // 1.22 attacks per second
  'A': 0.79,   // 1.27 attacks per second
  'A+': 0.76,  // 1.32 attacks per second
  'S-': 0.73,  // 1.37 attacks per second
  'S': 0.70,   // 1.43 attacks per second
  'S+': 0.65,  // 1.54 attacks per second
};

// Effect chances by stat grade
export const EFFECT_CHANCES: Record<StatGrade, number> = {
  'C-': 0.03,   // 3%
  'C': 0.035,   // 3.5%
  'C+': 0.04,   // 4%
  'B-': 0.045,  // 4.5%
  'B': 0.05,    // 5%
  'B+': 0.055,  // 5.5%
  'A-': 0.06,   // 6%
  'A': 0.065,   // 6.5%
  'A+': 0.07,   // 7%
  'S-': 0.075,  // 7.5%
  'S': 0.08,    // 8%
  'S+': 0.09,   // 9%
};

// Power scaling: evolved pokemon are 15% weaker than natural ones
export const EVOLVED_POWER_PENALTY = 0.85;

// ===============================
// LEVEL SYSTEM
// ===============================

export const MAX_POKEMON_LEVEL = 70;
export const DAMAGE_BASE_MULTIPLIER = 0.08; // Nerfed from 0.3 for harder progression

// XP required to reach next level (exponential curve)
export const getXPForNextLevel = (currentLevel: number): number => {
  return Math.floor(50 * Math.pow(1.15, currentLevel));
};

// Total XP required to reach a specific level
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForNextLevel(i);
  }
  return total;
};

// Calculate level from total XP
export const getLevelFromTotalXP = (totalXP: number): number => {
  let level = 1;
  let xpAccumulated = 0;
  while (level < MAX_POKEMON_LEVEL) {
    const xpNeeded = getXPForNextLevel(level);
    if (xpAccumulated + xpNeeded > totalXP) break;
    xpAccumulated += xpNeeded;
    level++;
  }
  return level;
};

// Calculate damage with level bonus (+1% per level above 1)
// Optional pokemonType parameter applies type-based damage modifiers
export const calculatePokemonDamage = (
  basePower: number,
  damageGrade: StatGrade,
  level: number,
  pokemonType?: string
): number => {
  const gradeMultiplier = DAMAGE_MULTIPLIERS[damageGrade];
  const levelBonus = 1 + ((level - 1) * 0.01); // +1% per level
  
  // Apply type modifier if type is provided
  const typeModifier = pokemonType ? getEffectiveDamageMultiplier(pokemonType) : 1.0;
  
  return Math.floor(basePower * DAMAGE_BASE_MULTIPLIER * gradeMultiplier * levelBonus * typeModifier);
};

// Base power by star rating
export const BASE_POWER_BY_STAR: Record<number, number> = {
  1: 100,
  2: 180,
  3: 320,
  4: 550,
  5: 900,
  6: 1500,
};

// Banner configuration
export const BANNER_SLOTS_PER_STAR: Record<number, number> = {
  1: 3, // 3 one-star pokemon in banner
  2: 2, // 2 two-star pokemon in banner
  3: 2, // 2 three-star pokemon in banner
  4: 1, // 1 four-star pokemon in banner
  5: 1, // 1 five-star pokemon in banner
  6: 0, // Mew never appears in banner (but can be summoned)
};

// Summon costs
export const SUMMON_COST_SINGLE = 125;
export const SUMMON_COST_MULTI = 550; // 5x summon (discount from 625)

// 1 Star Pokemon (20% each in banner, 3 slots)
export const ONE_STAR_POKEMON: TrainerPokemon[] = [
  { id: 16, name: 'Pidgey', type: 'normal', secondaryType: 'flying', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Pidgeotto', evolutionLevel: 10, evolutionDuplicates: 1, isNatural: true },
  { id: 10, name: 'Caterpie', type: 'bug', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Metapod', evolutionLevel: 7, evolutionDuplicates: 1, isNatural: true },
  { id: 69, name: 'Bellsprout', type: 'grass', secondaryType: 'poison', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Weepinbell', evolutionLevel: 12, evolutionDuplicates: 1, isNatural: true },
  { id: 74, name: 'Geodude', type: 'rock', secondaryType: 'ground', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Graveler', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true },
  { id: 66, name: 'Machop', type: 'fighting', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Machoke', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true },
  { id: 13, name: 'Weedle', type: 'bug', secondaryType: 'poison', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Kakuna', evolutionLevel: 7, evolutionDuplicates: 1, isNatural: true },
  { id: 56, name: 'Mankey', type: 'fighting', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Primeape', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true },
  { id: 60, name: 'Poliwag', type: 'water', starRating: 1, basePower: 100, bannerChance: 20, canAppearInBanner: true, evolvesTo: 'Poliwhirl', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true },
];

// 2 Star Pokemon (10.5% each in banner, 2 slots)
export const TWO_STAR_POKEMON: TrainerPokemon[] = [
  // Natural 2 stars (appear in banner)
  { id: 63, name: 'Abra', type: 'psychic', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Kadabra', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true },
  { id: 129, name: 'Magikarp', type: 'water', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Gyarados', evolutionLevel: 20, evolutionDuplicates: 5, isNatural: true },
  { id: 52, name: 'Meowth', type: 'normal', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Persian', evolutionLevel: 18, evolutionDuplicates: 2, isNatural: true },
  { id: 54, name: 'Psyduck', type: 'water', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Golduck', evolutionLevel: 18, evolutionDuplicates: 2, isNatural: true },
  { id: 58, name: 'Growlithe', type: 'fire', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Arcanine', evolutionLevel: 20, evolutionDuplicates: 3, isNatural: true },
  { id: 92, name: 'Gastly', type: 'ghost', secondaryType: 'poison', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Haunter', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true },
  { id: 133, name: 'Eevee', type: 'normal', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, isNatural: true }, // Special evolution handled separately
  { id: 77, name: 'Ponyta', type: 'fire', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Rapidash', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true },
  { id: 37, name: 'Vulpix', type: 'fire', starRating: 2, basePower: 180, bannerChance: 10.5, canAppearInBanner: true, evolvesTo: 'Ninetales', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true },
  
  // Evolved from 1 star (don't appear in banner)
  { id: 17, name: 'Pidgeotto', type: 'normal', secondaryType: 'flying', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Pidgey', evolvesTo: 'Pidgeot', evolutionLevel: 22, evolutionDuplicates: 2, isNatural: false },
  { id: 11, name: 'Metapod', type: 'bug', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Caterpie', evolvesTo: 'Butterfree', evolutionLevel: 10, evolutionDuplicates: 1, isNatural: false },
  { id: 70, name: 'Weepinbell', type: 'grass', secondaryType: 'poison', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Bellsprout', evolvesTo: 'Victreebel', evolutionLevel: 21, evolutionDuplicates: 2, isNatural: false },
  { id: 75, name: 'Graveler', type: 'rock', secondaryType: 'ground', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Geodude', evolvesTo: 'Golem', evolutionLevel: 25, evolutionDuplicates: 3, isNatural: false },
  { id: 67, name: 'Machoke', type: 'fighting', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Machop', evolvesTo: 'Machamp', evolutionLevel: 28, evolutionDuplicates: 3, isNatural: false },
  { id: 14, name: 'Kakuna', type: 'bug', secondaryType: 'poison', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Weedle', evolvesTo: 'Beedrill', evolutionLevel: 10, evolutionDuplicates: 1, isNatural: false },
  { id: 57, name: 'Primeape', type: 'fighting', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Mankey', isNatural: false },
  { id: 61, name: 'Poliwhirl', type: 'water', starRating: 2, basePower: 153, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Poliwag', evolvesTo: 'Poliwrath', evolutionLevel: 25, evolutionDuplicates: 2, isNatural: false },
];

// 3 Star Pokemon (7.5% each in banner, 2 slots)
export const THREE_STAR_POKEMON: TrainerPokemon[] = [
  // Natural 3 stars (appear in banner)
  { id: 4, name: 'Charmander', type: 'fire', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, evolvesTo: 'Charmeleon', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true },
  { id: 1, name: 'Bulbasaur', type: 'grass', secondaryType: 'poison', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, evolvesTo: 'Ivysaur', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true },
  { id: 7, name: 'Squirtle', type: 'water', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, evolvesTo: 'Wartortle', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true },
  { id: 25, name: 'Pikachu', type: 'electric', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, evolvesTo: 'Raichu', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true },
  { id: 147, name: 'Dratini', type: 'dragon', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, evolvesTo: 'Dragonair', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true },
  { id: 80, name: 'Slowbro', type: 'water', secondaryType: 'psychic', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, isNatural: true },
  { id: 106, name: 'Hitmonlee', type: 'fighting', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, isNatural: true },
  { id: 117, name: 'Seadra', type: 'water', starRating: 3, basePower: 320, bannerChance: 7.5, canAppearInBanner: true, isNatural: true },
  
  // Eeveelutions (evolved, don't appear in banner)
  { id: 134, name: 'Vaporeon', type: 'water', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Eevee', isNatural: false },
  { id: 135, name: 'Jolteon', type: 'electric', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Eevee', isNatural: false },
  { id: 136, name: 'Flareon', type: 'fire', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Eevee', isNatural: false },
  
  // Evolved from 2 star (don't appear in banner)
  { id: 18, name: 'Pidgeot', type: 'normal', secondaryType: 'flying', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Pidgeotto', isNatural: false },
  { id: 12, name: 'Butterfree', type: 'bug', secondaryType: 'flying', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Metapod', isNatural: false },
  { id: 71, name: 'Victreebel', type: 'grass', secondaryType: 'poison', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Weepinbell', isNatural: false },
  { id: 76, name: 'Golem', type: 'rock', secondaryType: 'ground', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Graveler', isNatural: false },
  { id: 68, name: 'Machamp', type: 'fighting', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Machoke', isNatural: false },
  { id: 15, name: 'Beedrill', type: 'bug', secondaryType: 'poison', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Kakuna', isNatural: false },
  { id: 62, name: 'Poliwrath', type: 'water', secondaryType: 'fighting', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Poliwhirl', isNatural: false },
  { id: 64, name: 'Kadabra', type: 'psychic', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Abra', evolvesTo: 'Alakazam', evolutionLevel: 30, evolutionDuplicates: 3, isNatural: false },
  { id: 53, name: 'Persian', type: 'normal', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Meowth', isNatural: false },
  { id: 55, name: 'Golduck', type: 'water', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Psyduck', isNatural: false },
  { id: 93, name: 'Haunter', type: 'ghost', secondaryType: 'poison', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Gastly', evolvesTo: 'Gengar', evolutionLevel: 30, evolutionDuplicates: 3, isNatural: false },
  { id: 78, name: 'Rapidash', type: 'fire', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Ponyta', isNatural: false },
  { id: 38, name: 'Ninetales', type: 'fire', starRating: 3, basePower: 272, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Vulpix', isNatural: false },
];

// 4 Star Pokemon (2.5% each in banner, 1 slot)
export const FOUR_STAR_POKEMON: TrainerPokemon[] = [
  // Natural 4 stars (appear in banner)
  { id: 5, name: 'Charmeleon', type: 'fire', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, evolvesFrom: 'Charmander', evolvesTo: 'Charizard', evolutionLevel: 36, evolutionDuplicates: 3, isNatural: true },
  { id: 2, name: 'Ivysaur', type: 'grass', secondaryType: 'poison', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, evolvesFrom: 'Bulbasaur', evolvesTo: 'Venusaur', evolutionLevel: 32, evolutionDuplicates: 3, isNatural: true },
  { id: 8, name: 'Wartortle', type: 'water', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, evolvesFrom: 'Squirtle', evolvesTo: 'Blastoise', evolutionLevel: 36, evolutionDuplicates: 3, isNatural: true },
  { id: 148, name: 'Dragonair', type: 'dragon', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, evolvesFrom: 'Dratini', evolvesTo: 'Dragonite', evolutionLevel: 45, evolutionDuplicates: 4, isNatural: true },
  { id: 143, name: 'Snorlax', type: 'normal', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, isNatural: true },
  { id: 123, name: 'Scyther', type: 'bug', secondaryType: 'flying', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, isNatural: true },
  { id: 131, name: 'Lapras', type: 'water', secondaryType: 'ice', starRating: 4, basePower: 550, bannerChance: 2.5, canAppearInBanner: true, isNatural: true },
  
  // Evolved from 3 star (don't appear in banner)
  { id: 26, name: 'Raichu', type: 'electric', starRating: 4, basePower: 468, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Pikachu', isNatural: false },
  { id: 65, name: 'Alakazam', type: 'psychic', starRating: 4, basePower: 468, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Kadabra', isNatural: false },
  { id: 94, name: 'Gengar', type: 'ghost', secondaryType: 'poison', starRating: 4, basePower: 468, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Haunter', isNatural: false },
  { id: 59, name: 'Arcanine', type: 'fire', starRating: 4, basePower: 468, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Growlithe', isNatural: false },
  { id: 130, name: 'Gyarados', type: 'water', secondaryType: 'flying', starRating: 4, basePower: 468, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Magikarp', isNatural: false },
];

// 5 Star Pokemon (1% each in banner, 1 slot)
export const FIVE_STAR_POKEMON: TrainerPokemon[] = [
  // Legendaries (natural 5 stars, appear in banner)
  { id: 150, name: 'Mewtwo', type: 'psychic', starRating: 5, basePower: 900, bannerChance: 1, canAppearInBanner: true, isNatural: true },
  { id: 145, name: 'Zapdos', type: 'electric', secondaryType: 'flying', starRating: 5, basePower: 900, bannerChance: 1, canAppearInBanner: true, isNatural: true },
  { id: 144, name: 'Articuno', type: 'ice', secondaryType: 'flying', starRating: 5, basePower: 900, bannerChance: 1, canAppearInBanner: true, isNatural: true },
  { id: 146, name: 'Moltres', type: 'fire', secondaryType: 'flying', starRating: 5, basePower: 900, bannerChance: 1, canAppearInBanner: true, isNatural: true },
  
  // Evolved final forms (weaker than legendaries, don't appear in banner)
  { id: 6, name: 'Charizard', type: 'fire', secondaryType: 'flying', starRating: 5, basePower: 765, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Charmeleon', isNatural: false },
  { id: 3, name: 'Venusaur', type: 'grass', secondaryType: 'poison', starRating: 5, basePower: 765, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Ivysaur', isNatural: false },
  { id: 9, name: 'Blastoise', type: 'water', starRating: 5, basePower: 765, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Wartortle', isNatural: false },
  { id: 149, name: 'Dragonite', type: 'dragon', secondaryType: 'flying', starRating: 5, basePower: 765, bannerChance: 0, canAppearInBanner: false, evolvesFrom: 'Dragonair', isNatural: false },
];

// 6 Star Pokemon (0.5%, never appears in banner but can be summoned)
export const SIX_STAR_POKEMON: TrainerPokemon[] = [
  { id: 151, name: 'Mew', type: 'psychic', starRating: 6, basePower: 1500, bannerChance: 0.5, canAppearInBanner: false, isNatural: true },
];

// All pokemon combined for easy lookup
export const ALL_TRAINER_POKEMON: TrainerPokemon[] = [
  ...ONE_STAR_POKEMON,
  ...TWO_STAR_POKEMON,
  ...THREE_STAR_POKEMON,
  ...FOUR_STAR_POKEMON,
  ...FIVE_STAR_POKEMON,
  ...SIX_STAR_POKEMON,
];

// Helper functions
export const getPokemonByName = (name: string): TrainerPokemon | undefined => {
  return getAllTrainerPokemon().find(p => p.name.toLowerCase() === name.toLowerCase());
};

export const getPokemonById = (id: number): TrainerPokemon | undefined => {
  return getAllTrainerPokemon().find(p => p.id === id);
};

export const getPokemonByStarRating = (stars: number): TrainerPokemon[] => {
  return getAllTrainerPokemon().filter(p => p.starRating === stars);
};

export const getBannerEligiblePokemon = (stars: number): TrainerPokemon[] => {
  return getAllTrainerPokemon().filter(p => p.starRating === stars && p.canAppearInBanner);
};

// Pet Slot - Rarity-based damage multipliers
export const PET_RARITY_MULTIPLIERS: Record<string, number> = {
  common: 1.05,
  uncommon: 1.10,
  rare: 1.15,
  starter: 1.20,
  pseudo: 1.25,
  legendary: 1.30,
  secret: 1.35,
};

export const SHINY_PET_BONUS = 1.25; // 25% extra multiplier for shiny pets

export const getPetDamageMultiplier = (rarity: string, isShiny: boolean): number => {
  const baseMultiplier = PET_RARITY_MULTIPLIERS[rarity] || 1.0;
  return isShiny ? baseMultiplier * SHINY_PET_BONUS : baseMultiplier;
};

// Roll weights for stat grades (lower is rarer)
export const GRADE_ROLL_WEIGHTS: Record<StatGrade, number> = {
  'C-': 20,     // 20%
  'C': 16,      // 16%
  'C+': 14,     // 14%
  'B-': 12,     // 12%
  'B': 10,      // 10%
  'B+': 5.5,    // 5.5%
  'A-': 9,      // 9%
  'A': 6,       // 6%
  'A+': 4,      // 4%
  'S-': 2,      // 2%
  'S': 1,       // 1%
  'S+': 0.5,    // 0.5%
};

// Random stat roll with weighted probability
export const rollRandomStat = (): StatGrade => {
  const totalWeight = Object.values(GRADE_ROLL_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [grade, weight] of Object.entries(GRADE_ROLL_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return grade as StatGrade;
    }
  }
  
  return 'C-'; // Fallback
};

export type TrainerBannerRegion = 'kanto' | 'johto';
export type TrainerBannerCurrency = 'pokecoins' | 'pokegems';

export interface TrainerBannerConfig {
  region: TrainerBannerRegion;
  displayName: string;
  currency: TrainerBannerCurrency;
  costSingle: number;
  costMulti: number;
  rotationMinutes: number;
}

const BANNER_CHANCE_BY_STAR: Record<number, number> = {
  1: 20,
  2: 10.5,
  3: 7.5,
  4: 2.5,
  5: 1,
  6: 0.5,
};

const scaleJohtoBasePower = (starRating: number): number => {
  return Math.round((BASE_POWER_BY_STAR[starRating] || 100) * 1.2);
};

const buildBannerPokemon = (pokemon: Omit<TrainerPokemon, 'bannerChance' | 'canAppearInBanner'>): TrainerPokemon => ({
  ...pokemon,
  bannerChance: BANNER_CHANCE_BY_STAR[pokemon.starRating] ?? 0,
  canAppearInBanner: true,
});

export const TRAINER_BANNER_CONFIGS: Record<TrainerBannerRegion, TrainerBannerConfig> = {
  kanto: {
    region: 'kanto',
    displayName: 'Kanto',
    currency: 'pokecoins',
    costSingle: SUMMON_COST_SINGLE,
    costMulti: SUMMON_COST_MULTI,
    rotationMinutes: 30,
  },
  johto: {
    region: 'johto',
    displayName: 'Johto',
    currency: 'pokegems',
    costSingle: 100,
    costMulti: 450,
    rotationMinutes: 30,
  },
};

export const getTrainerBannerConfig = (region: TrainerBannerRegion): TrainerBannerConfig => {
  return TRAINER_BANNER_CONFIGS[region] ?? TRAINER_BANNER_CONFIGS.kanto;
};

export const JOHTO_ONE_STAR_POKEMON: TrainerPokemon[] = [
  buildBannerPokemon({ id: 161, name: 'Sentret', type: 'normal', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Furret', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 163, name: 'Hoothoot', type: 'normal', secondaryType: 'flying', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Noctowl', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 165, name: 'Ledyba', type: 'bug', secondaryType: 'flying', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Ledian', evolutionLevel: 18, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 167, name: 'Spinarak', type: 'bug', secondaryType: 'poison', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Ariados', evolutionLevel: 22, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 170, name: 'Chinchou', type: 'water', secondaryType: 'electric', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Lanturn', evolutionLevel: 25, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 172, name: 'Pichu', type: 'electric', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Pikachu', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 173, name: 'Cleffa', type: 'fairy', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Clefairy', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 174, name: 'Igglybuff', type: 'normal', secondaryType: 'fairy', starRating: 1, basePower: scaleJohtoBasePower(1), evolvesTo: 'Jigglypuff', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
];

export const JOHTO_TWO_STAR_POKEMON: TrainerPokemon[] = [
  buildBannerPokemon({ id: 175, name: 'Togepi', type: 'fairy', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Togetic', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 177, name: 'Natu', type: 'psychic', secondaryType: 'flying', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Xatu', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 179, name: 'Mareep', type: 'electric', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Flaaffy', evolutionLevel: 18, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 183, name: 'Marill', type: 'water', secondaryType: 'fairy', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Azumarill', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 185, name: 'Sudowoodo', type: 'rock', starRating: 2, basePower: scaleJohtoBasePower(2), isNatural: true }),
  buildBannerPokemon({ id: 191, name: 'Sunkern', type: 'grass', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Sunflora', evolutionLevel: 15, evolutionDuplicates: 1, isNatural: true }),
  buildBannerPokemon({ id: 194, name: 'Wooper', type: 'water', secondaryType: 'ground', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Quagsire', evolutionLevel: 20, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 193, name: 'Yanma', type: 'bug', secondaryType: 'flying', starRating: 2, basePower: scaleJohtoBasePower(2), evolvesTo: 'Yanmega', evolutionLevel: 30, evolutionDuplicates: 3, isNatural: true }),
  buildBannerPokemon({ id: 203, name: 'Girafarig', type: 'normal', secondaryType: 'psychic', starRating: 2, basePower: scaleJohtoBasePower(2), isNatural: true }),
];

export const JOHTO_THREE_STAR_POKEMON: TrainerPokemon[] = [
  buildBannerPokemon({ id: 246, name: 'Larvitar', type: 'rock', secondaryType: 'ground', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesTo: 'Pupitar', evolutionLevel: 30, evolutionDuplicates: 3, isNatural: true }),
  buildBannerPokemon({ id: 152, name: 'Chikorita', type: 'grass', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesTo: 'Bayleef', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 155, name: 'Cyndaquil', type: 'fire', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesTo: 'Quilava', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 158, name: 'Totodile', type: 'water', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesTo: 'Croconaw', evolutionLevel: 16, evolutionDuplicates: 2, isNatural: true }),
  buildBannerPokemon({ id: 196, name: 'Espeon', type: 'psychic', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesFrom: 'Eevee', isNatural: false }),
  buildBannerPokemon({ id: 197, name: 'Umbreon', type: 'dark', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesFrom: 'Eevee', isNatural: false }),
  buildBannerPokemon({ id: 169, name: 'Crobat', type: 'poison', secondaryType: 'flying', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesFrom: 'Golbat', isNatural: false }),
  buildBannerPokemon({ id: 230, name: 'Kingdra', type: 'water', secondaryType: 'dragon', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesFrom: 'Seadra', isNatural: false }),
  buildBannerPokemon({ id: 233, name: 'Porygon2', type: 'normal', starRating: 3, basePower: scaleJohtoBasePower(3), evolvesFrom: 'Porygon', isNatural: false }),
];

export const JOHTO_FOUR_STAR_POKEMON: TrainerPokemon[] = [
  buildBannerPokemon({ id: 153, name: 'Bayleef', type: 'grass', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Chikorita', evolvesTo: 'Meganium', evolutionLevel: 32, evolutionDuplicates: 3, isNatural: false }),
  buildBannerPokemon({ id: 156, name: 'Quilava', type: 'fire', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Cyndaquil', evolvesTo: 'Typhlosion', evolutionLevel: 36, evolutionDuplicates: 3, isNatural: false }),
  buildBannerPokemon({ id: 159, name: 'Croconaw', type: 'water', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Totodile', evolvesTo: 'Feraligatr', evolutionLevel: 32, evolutionDuplicates: 3, isNatural: false }),
  buildBannerPokemon({ id: 247, name: 'Pupitar', type: 'rock', secondaryType: 'ground', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Larvitar', evolvesTo: 'Tyranitar', evolutionLevel: 30, evolutionDuplicates: 3, isNatural: false }),
  buildBannerPokemon({ id: 181, name: 'Ampharos', type: 'electric', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Flaaffy', isNatural: false }),
  buildBannerPokemon({ id: 212, name: 'Scizor', type: 'bug', secondaryType: 'steel', starRating: 4, basePower: scaleJohtoBasePower(4), evolvesFrom: 'Scyther', isNatural: false }),
  buildBannerPokemon({ id: 214, name: 'Heracross', type: 'bug', secondaryType: 'fighting', starRating: 4, basePower: scaleJohtoBasePower(4), isNatural: true }),
  buildBannerPokemon({ id: 227, name: 'Skarmory', type: 'steel', secondaryType: 'flying', starRating: 4, basePower: scaleJohtoBasePower(4), isNatural: true }),
  buildBannerPokemon({ id: 241, name: 'Miltank', type: 'normal', starRating: 4, basePower: scaleJohtoBasePower(4), isNatural: true }),
];

export const JOHTO_FIVE_STAR_POKEMON: TrainerPokemon[] = [
  buildBannerPokemon({ id: 243, name: 'Raikou', type: 'electric', starRating: 5, basePower: scaleJohtoBasePower(5), isNatural: true }),
  buildBannerPokemon({ id: 244, name: 'Entei', type: 'fire', starRating: 5, basePower: scaleJohtoBasePower(5), isNatural: true }),
  buildBannerPokemon({ id: 245, name: 'Suicune', type: 'water', starRating: 5, basePower: scaleJohtoBasePower(5), isNatural: true }),
  buildBannerPokemon({ id: 249, name: 'Lugia', type: 'psychic', secondaryType: 'flying', starRating: 5, basePower: scaleJohtoBasePower(5), isNatural: true }),
  buildBannerPokemon({ id: 250, name: 'Ho-Oh', type: 'fire', secondaryType: 'flying', starRating: 5, basePower: scaleJohtoBasePower(5), isNatural: true }),
];

export const JOHTO_SIX_STAR_POKEMON: TrainerPokemon[] = [
  { id: 251, name: 'Celebi', type: 'psychic', secondaryType: 'grass', starRating: 6, basePower: scaleJohtoBasePower(6), bannerChance: 0.5, canAppearInBanner: false, isNatural: true },
];

export const TRAINER_SECRET_POKEMON_BY_REGION: Record<TrainerBannerRegion, TrainerPokemon[]> = {
  kanto: SIX_STAR_POKEMON,
  johto: JOHTO_SIX_STAR_POKEMON,
};

const KANTO_BANNER_POOL_BY_STAR: Record<number, TrainerPokemon[]> = {
  1: ONE_STAR_POKEMON.filter((pokemon) => pokemon.canAppearInBanner),
  2: TWO_STAR_POKEMON.filter((pokemon) => pokemon.canAppearInBanner),
  3: THREE_STAR_POKEMON.filter((pokemon) => pokemon.canAppearInBanner),
  4: FOUR_STAR_POKEMON.filter((pokemon) => pokemon.canAppearInBanner),
  5: FIVE_STAR_POKEMON.filter((pokemon) => pokemon.canAppearInBanner),
};

const JOHTO_BANNER_POOL_BY_STAR: Record<number, TrainerPokemon[]> = {
  1: JOHTO_ONE_STAR_POKEMON,
  2: JOHTO_TWO_STAR_POKEMON,
  3: JOHTO_THREE_STAR_POKEMON,
  4: JOHTO_FOUR_STAR_POKEMON,
  5: JOHTO_FIVE_STAR_POKEMON,
};

export const TRAINER_BANNER_POOL_BY_REGION: Record<TrainerBannerRegion, Record<number, TrainerPokemon[]>> = {
  kanto: KANTO_BANNER_POOL_BY_STAR,
  johto: JOHTO_BANNER_POOL_BY_STAR,
};

function getAllTrainerPokemon(): TrainerPokemon[] {
  return [
    ...ALL_TRAINER_POKEMON,
    ...JOHTO_ONE_STAR_POKEMON,
    ...JOHTO_TWO_STAR_POKEMON,
    ...JOHTO_THREE_STAR_POKEMON,
    ...JOHTO_FOUR_STAR_POKEMON,
    ...JOHTO_FIVE_STAR_POKEMON,
    ...JOHTO_SIX_STAR_POKEMON,
  ];
}

export const TRAINER_BANNER_SLOT_COUNTS: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
  4: 1,
  5: 1,
};

export const TRAINER_BANNER_ROTATION_MINUTES = 30;

export const getTrainerBannerRotationStart = (timestamp: number, rotationMinutes = TRAINER_BANNER_ROTATION_MINUTES): number => {
  const rotationMs = rotationMinutes * 60 * 1000;
  return Math.floor(timestamp / rotationMs) * rotationMs;
};

const seededRandom = (seed: number): (() => number) => {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
};

const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const result = [...array];
  const random = seededRandom(seed);

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

export const generateTrainerBannerPokemon = (region: TrainerBannerRegion, timestamp: number): TrainerPokemon[] => {
  const bannerSeed = Math.floor(getTrainerBannerRotationStart(timestamp) / 1000);
  const pools = TRAINER_BANNER_POOL_BY_REGION[region] ?? TRAINER_BANNER_POOL_BY_REGION.kanto;
  const bannerPokemon: TrainerPokemon[] = [];

  for (let starRating = 1; starRating <= 5; starRating++) {
    const pool = pools[starRating] ?? [];
    const slotsNeeded = TRAINER_BANNER_SLOT_COUNTS[starRating] ?? 0;

    if (pool.length === 0 || slotsNeeded === 0) {
      continue;
    }

    const shuffledPool = shuffleWithSeed(pool, bannerSeed + starRating * 97);
    const selectedPokemon = shuffledPool.slice(0, slotsNeeded);

    selectedPokemon.forEach((pokemon) => {
      bannerPokemon.push({
        ...pokemon,
        bannerChance: BANNER_CHANCE_BY_STAR[starRating] ?? pokemon.bannerChance,
      });
    });
  }

  return bannerPokemon;
};
