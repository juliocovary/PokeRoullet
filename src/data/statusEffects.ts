// Status Effects System for Trainer Mode - Combat Mechanics v2

import type { PokemonType } from './typeAdvantages';

export interface StatusEffect {
  id: string;
  name: string;
  nameKey: string; // i18n key
  description: string;
  descriptionKey: string; // i18n key
  type: PokemonType;
  duration: number; // in seconds
  tickInterval?: number; // for DoT effects, in seconds
  
  // Damage over time
  damagePerTick?: number; // percentage (0.06 = 6%)
  damageSource?: 'max_hp' | 'attacker_atk'; // What the % is based on
  
  // Damage modifiers
  damageReceivedModifier?: number; // multiplier (1.15 = +15% damage taken)
  damageDealtModifier?: number; // multiplier for team attacks
  
  // Electric specific - first hit bonus
  firstHitBonus?: number; // multiplier for first attack after paralysis (1.5 = 50% more)
  
  // Anti-stun mechanics
  preventsStun?: boolean; // Prevents enemy from stunning team
  stunMissChance?: number; // Chance for enemy stun to miss (0.5 = 50%)
  
  // Freeze specific
  skipChance?: number; // chance to skip attack (1 = 100% frozen)
  fireDamageBonus?: number; // Fire type bonus damage while frozen (1.5 = 50% more)
  
  // Dragon specific - stacking damage
  damageStackPerSecond?: number; // +5% damage per second = 0.05
  maxDamageStack?: number; // Maximum stack (0.20 = 20%)
  
  // Stacking
  canStack?: boolean;
  maxStacks?: number;
  
  // Visual
  icon: string;
  color: string;
}

// Runtime tracking for effects (not in the base StatusEffect)
export interface ActiveEffectState {
  effect: StatusEffect;
  remainingDuration: number;
  stacks: number;
  tickCooldown: number;
  // Runtime state
  firstHitConsumed?: boolean; // For paralysis - has the bonus been used?
  currentDamageStack?: number; // For dragon - current accumulated stack
  attackerAtk?: number; // For ATK-based DoT - store attacker's damage
}

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
  // 🔥 FIRE - Burning
  burning: {
    id: 'burning',
    name: 'Burning',
    nameKey: 'effects.burning.name',
    description: 'Taking fire damage over time (6% ATK/s)',
    descriptionKey: 'effects.burning.description',
    type: 'fire',
    duration: 4,
    tickInterval: 1,
    damagePerTick: 0.06, // 6% of attacker's ATK per second
    damageSource: 'attacker_atk',
    canStack: false,
    icon: '🔥',
    color: '#F08030',
  },
  
  // 🌊 WATER - Bubble
  bubble: {
    id: 'bubble',
    name: 'Bubble',
    nameKey: 'effects.bubble.name',
    description: 'Taking 15% increased damage from all sources',
    descriptionKey: 'effects.bubble.description',
    type: 'water',
    duration: 5,
    damageReceivedModifier: 1.15, // +15% damage received
    canStack: false,
    icon: '💧',
    color: '#6890F0',
  },
  
  // 🌱 GRASS - Rooting
  rooting: {
    id: 'rooting',
    name: 'Rooted',
    nameKey: 'effects.rooting.name',
    description: 'Taking damage over time (3% ATK/s), cannot stun team',
    descriptionKey: 'effects.rooting.description',
    type: 'grass',
    duration: 5,
    tickInterval: 1,
    damagePerTick: 0.03, // 3% of attacker's ATK per second
    damageSource: 'attacker_atk',
    preventsStun: true,
    canStack: false,
    icon: '🌿',
    color: '#78C850',
  },
  
  // ⚡ ELECTRIC - Paralyzed
  paralyzed: {
    id: 'paralyzed',
    name: 'Paralyzed',
    nameKey: 'effects.paralyzed.name',
    description: 'First hit deals 1.5x damage, cannot stun team',
    descriptionKey: 'effects.paralyzed.description',
    type: 'electric',
    duration: 4,
    firstHitBonus: 1.5, // 50% more damage on first hit
    preventsStun: true,
    canStack: false,
    icon: '⚡',
    color: '#F8D030',
  },
  
  // 🧠 PSYCHIC - Vulnerable
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    nameKey: 'effects.vulnerable.name',
    description: 'Taking 30% increased damage, 50% stun miss chance',
    descriptionKey: 'effects.vulnerable.description',
    type: 'psychic',
    duration: 4,
    damageReceivedModifier: 1.3, // +30% damage received
    stunMissChance: 0.5, // 50% chance to miss stun
    canStack: false,
    icon: '🔮',
    color: '#F85888',
  },
  
  // 🧊 ICE - Freeze
  freeze: {
    id: 'freeze',
    name: 'Frozen',
    nameKey: 'effects.freeze.name',
    description: 'Cannot act, Fire attacks deal 1.5x damage',
    descriptionKey: 'effects.freeze.description',
    type: 'ice',
    duration: 5,
    skipChance: 1, // 100% - cannot act
    fireDamageBonus: 1.5, // Fire deals 50% more damage
    canStack: false,
    icon: '❄️',
    color: '#98D8D8',
  },
  
  // 🐉 DRAGON - Draconic Pressure
  draconicPressure: {
    id: 'draconicPressure',
    name: 'Draconic Pressure',
    nameKey: 'effects.draconicPressure.name',
    description: 'Takes +5% damage per second (max 40%) for 8s',
    descriptionKey: 'effects.draconicPressure.description',
    type: 'dragon',
    duration: 8,
    tickInterval: 1,
    damageStackPerSecond: 0.05, // +5% per second
    maxDamageStack: 0.40, // Max +40%
    canStack: false,
    icon: '🐉',
    color: '#7038F8',
  },
};

// Map types to their primary status effect (only 7 combat effects)
export const TYPE_TO_EFFECT: Partial<Record<PokemonType, string>> = {
  fire: 'burning',
  water: 'bubble',
  electric: 'paralyzed',
  grass: 'rooting',
  ice: 'freeze',
  psychic: 'vulnerable',
  dragon: 'draconicPressure',
};

// All effects are applied to enemies (no ally/self effects in new system)
export const ALLY_EFFECTS: string[] = [];
export const SELF_EFFECTS: string[] = [];

/**
 * Get the status effect for a given Pokemon type
 */
export const getEffectForType = (type: PokemonType): StatusEffect | null => {
  const effectId = TYPE_TO_EFFECT[type];
  if (!effectId) return null;
  return STATUS_EFFECTS[effectId] || null;
};

/**
 * Check if an effect should be applied to allies (deprecated - all effects target enemies now)
 */
export const isAllyEffect = (effectId: string): boolean => {
  return ALLY_EFFECTS.includes(effectId);
};

/**
 * Check if an effect should be applied to self (deprecated - all effects target enemies now)
 */
export const isSelfEffect = (effectId: string): boolean => {
  return SELF_EFFECTS.includes(effectId);
};

/**
 * Calculate effect chance based on stat grade
 * NEW: D=5%, C=5.5%, B=6%, A=6.5%, S=7%
 */
export const getEffectChance = (baseChance: number, effectGrade: 'D' | 'C' | 'B' | 'A' | 'S'): number => {
  // The base chance is now ignored - we use fixed values per grade
  const gradeChances: Record<string, number> = {
    D: 0.05,   // 5%
    C: 0.055,  // 5.5%
    B: 0.06,   // 6%
    A: 0.065,  // 6.5%
    S: 0.07,   // 7%
  };
  return gradeChances[effectGrade] || 0.05;
};

/**
 * Check if enemy can stun the team (blocked by rooting/paralyzed)
 */
export const canEnemyStun = (activeEffects: ActiveEffectState[]): boolean => {
  return !activeEffects.some(ae => ae.effect.preventsStun === true);
};

/**
 * Get the stun miss chance from effects (vulnerable)
 */
export const getStunMissChance = (activeEffects: ActiveEffectState[]): number => {
  for (const ae of activeEffects) {
    if (ae.effect.stunMissChance && ae.effect.stunMissChance > 0) {
      return ae.effect.stunMissChance;
    }
  }
  return 0;
};

/**
 * Calculate damage modifier from all active effects
 */
export const getDamageModifier = (
  activeEffects: ActiveEffectState[],
  attackerType?: PokemonType
): { 
  modifier: number; 
  consumedFirstHit: boolean;
} => {
  let modifier = 1;
  let consumedFirstHit = false;
  
  for (const ae of activeEffects) {
    // Bubble & Vulnerable - damage received modifier
    if (ae.effect.damageReceivedModifier) {
      modifier *= ae.effect.damageReceivedModifier;
    }
    
    // Freeze - fire damage bonus
    if (ae.effect.fireDamageBonus && attackerType === 'fire') {
      modifier *= ae.effect.fireDamageBonus;
    }
    
    // Paralyzed - first hit bonus (only if not consumed)
    if (ae.effect.firstHitBonus && !ae.firstHitConsumed) {
      modifier *= ae.effect.firstHitBonus;
      consumedFirstHit = true;
    }
    
    // Draconic Pressure - accumulated damage stack
    if (ae.currentDamageStack && ae.currentDamageStack > 0) {
      modifier *= (1 + ae.currentDamageStack);
    }
  }
  
  return { modifier, consumedFirstHit };
};
