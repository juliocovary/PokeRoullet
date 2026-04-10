// Stage Enemies Configuration for Kanto Region (100 Stages)

import type { PokemonType } from './typeAdvantages';

export interface StageEnemy {
  pokemonId: number;
  pokemonName: string;
  pokemonType: PokemonType;
  secondaryType?: PokemonType;
  baseHp: number;
  baseDamage: number;
  isBoss?: boolean;
  isMiniBoss?: boolean;
  isChallenger?: boolean;
}

export interface StageConfig {
  stageNumber: number;
  waves: StageEnemy[][];
  challenger: StageEnemy;
  boss?: StageEnemy;
  miniBoss?: StageEnemy;
}

// Drop configuration by enemy type
export const DROP_CONFIG = {
  normal: { chance: 0.10, minGems: 1, maxGems: 2 },
  challenger: { chance: 0.15, minGems: 1, maxGems: 3 },
  miniBoss: { chance: 1.0, minGems: 1, maxGems: 3 },
  boss: { chance: 1.0, minGems: 2, maxGems: 5 },
};

// XP configuration by enemy type
export const XP_CONFIG = {
  normal: { base: 5, stageMultiplier: 2 },
  challenger: { base: 10, stageMultiplier: 3 },
  miniBoss: { base: 25, stageMultiplier: 4 },
  boss: { base: 50, stageMultiplier: 5 },
};

// Calculate pokegem drop for defeated enemy
export const calculateEnemyDrop = (isBoss: boolean, isMiniBoss: boolean, isChallenger: boolean): number => {
  let config;
  if (isBoss) config = DROP_CONFIG.boss;
  else if (isMiniBoss) config = DROP_CONFIG.miniBoss;
  else if (isChallenger) config = DROP_CONFIG.challenger;
  else config = DROP_CONFIG.normal;
  
  const roll = Math.random();
  const shouldDrop = roll <= config.chance;
  
  if (import.meta.env.DEV) {
    console.debug('[PokegemDrop]', {
      isBoss,
      isMiniBoss,
      isChallenger,
      config,
      roll: roll.toFixed(3),
      shouldDrop,
    });
  }
  
  // Check if drop occurs based on chance (random <= chance = success)
  if (!shouldDrop) return 0;
  
  // Calculate random drop amount between min and max
  const amount = Math.floor(Math.random() * (config.maxGems - config.minGems + 1)) + config.minGems;
  
  if (import.meta.env.DEV) {
    console.debug('[PokegemDrop]', 'Dropped:', amount, 'gems');
  }
  
  return amount;
};

// Calculate XP for defeating enemy
export const calculateEnemyXP = (stage: number, isBoss: boolean, isMiniBoss: boolean, isChallenger: boolean): number => {
  let config;
  if (isBoss) config = XP_CONFIG.boss;
  else if (isMiniBoss) config = XP_CONFIG.miniBoss;
  else if (isChallenger) config = XP_CONFIG.challenger;
  else config = XP_CONFIG.normal;
  
  return Math.floor(config.base + stage * config.stageMultiplier);
};

// Stun configuration for enemies
export interface StunConfig {
  stunCooldown: number;    // Seconds between stun attempts
  stunChance: number;      // 0-1 probability
  stunDuration: number;    // Seconds the stun lasts
}

export const STUN_CONFIG: Record<'normal' | 'miniBoss' | 'boss' | 'challenger', StunConfig> = {
  normal: { stunCooldown: 4, stunChance: 0.2, stunDuration: 3 },
  miniBoss: { stunCooldown: 3, stunChance: 0.35, stunDuration: 5 },
  boss: { stunCooldown: 2.5, stunChance: 0.45, stunDuration: 5 },
  challenger: { stunCooldown: 3.5, stunChance: 0.25, stunDuration: 3 },
};

// Get stun config based on enemy type
export const getStunConfig = (isBoss?: boolean, isMiniBoss?: boolean, isChallenger?: boolean): StunConfig => {
  if (isBoss) return STUN_CONFIG.boss;
  if (isMiniBoss) return STUN_CONFIG.miniBoss;
  if (isChallenger) return STUN_CONFIG.challenger;
  return STUN_CONFIG.normal;
};

// Base stats that scale with stage number
const BASE_ENEMY_HP = 100;
const BASE_ENEMY_DAMAGE = 15;

// Scaling formula: HP scales exponentially with stage
export const calculateScaledHp = (baseHp: number, stage: number): number => {
  // More aggressive scaling for later stages
  const stageMultiplier = Math.pow(1.075, stage);
  return Math.floor(baseHp * stageMultiplier);
};

export const calculateScaledDamage = (baseDamage: number, stage: number): number => {
  return Math.floor(baseDamage * Math.pow(1.06, stage));
};

// Enemy pools by stage range
export const STAGE_ENEMY_POOLS: Record<string, StageEnemy[]> = {
  '1-10': [
    { pokemonId: 16, pokemonName: 'Pidgey', pokemonType: 'normal', secondaryType: 'flying', baseHp: 80, baseDamage: 12 },
    { pokemonId: 13, pokemonName: 'Weedle', pokemonType: 'bug', secondaryType: 'poison', baseHp: 70, baseDamage: 10 },
    { pokemonId: 10, pokemonName: 'Caterpie', pokemonType: 'bug', baseHp: 75, baseDamage: 8 },
    { pokemonId: 19, pokemonName: 'Rattata', pokemonType: 'normal', baseHp: 85, baseDamage: 14 },
  ],
  '11-20': [
    { pokemonId: 19, pokemonName: 'Rattata', pokemonType: 'normal', baseHp: 100, baseDamage: 16 },
    { pokemonId: 23, pokemonName: 'Ekans', pokemonType: 'poison', baseHp: 95, baseDamage: 18 },
    { pokemonId: 21, pokemonName: 'Spearow', pokemonType: 'normal', secondaryType: 'flying', baseHp: 90, baseDamage: 20 },
    { pokemonId: 41, pokemonName: 'Zubat', pokemonType: 'poison', secondaryType: 'flying', baseHp: 85, baseDamage: 15 },
  ],
  '21-30': [
    { pokemonId: 27, pokemonName: 'Sandshrew', pokemonType: 'ground', baseHp: 120, baseDamage: 20 },
    { pokemonId: 29, pokemonName: 'Nidoran♀', pokemonType: 'poison', baseHp: 110, baseDamage: 18 },
    { pokemonId: 32, pokemonName: 'Nidoran♂', pokemonType: 'poison', baseHp: 110, baseDamage: 22 },
    { pokemonId: 41, pokemonName: 'Zubat', pokemonType: 'poison', secondaryType: 'flying', baseHp: 100, baseDamage: 17 },
  ],
  '31-40': [
    { pokemonId: 43, pokemonName: 'Oddish', pokemonType: 'grass', secondaryType: 'poison', baseHp: 130, baseDamage: 22 },
    { pokemonId: 46, pokemonName: 'Paras', pokemonType: 'bug', secondaryType: 'grass', baseHp: 125, baseDamage: 20 },
    { pokemonId: 50, pokemonName: 'Diglett', pokemonType: 'ground', baseHp: 90, baseDamage: 28 },
    { pokemonId: 48, pokemonName: 'Venonat', pokemonType: 'bug', secondaryType: 'poison', baseHp: 135, baseDamage: 24 },
  ],
  '41-50': [
    { pokemonId: 52, pokemonName: 'Meowth', pokemonType: 'normal', baseHp: 140, baseDamage: 26 },
    { pokemonId: 54, pokemonName: 'Psyduck', pokemonType: 'water', baseHp: 150, baseDamage: 28 },
    { pokemonId: 56, pokemonName: 'Mankey', pokemonType: 'fighting', baseHp: 130, baseDamage: 32 },
    { pokemonId: 60, pokemonName: 'Poliwag', pokemonType: 'water', baseHp: 145, baseDamage: 25 },
  ],
  '51-60': [
    { pokemonId: 58, pokemonName: 'Growlithe', pokemonType: 'fire', baseHp: 160, baseDamage: 34 },
    { pokemonId: 60, pokemonName: 'Poliwag', pokemonType: 'water', baseHp: 155, baseDamage: 28 },
    { pokemonId: 66, pokemonName: 'Machop', pokemonType: 'fighting', baseHp: 170, baseDamage: 36 },
    { pokemonId: 63, pokemonName: 'Abra', pokemonType: 'psychic', baseHp: 100, baseDamage: 45 },
  ],
  '61-70': [
    { pokemonId: 74, pokemonName: 'Geodude', pokemonType: 'rock', secondaryType: 'ground', baseHp: 200, baseDamage: 32 },
    { pokemonId: 77, pokemonName: 'Ponyta', pokemonType: 'fire', baseHp: 165, baseDamage: 40 },
    { pokemonId: 79, pokemonName: 'Slowpoke', pokemonType: 'water', secondaryType: 'psychic', baseHp: 220, baseDamage: 30 },
    { pokemonId: 81, pokemonName: 'Magnemite', pokemonType: 'electric', secondaryType: 'steel', baseHp: 140, baseDamage: 42 },
  ],
  '71-80': [
    { pokemonId: 81, pokemonName: 'Magnemite', pokemonType: 'electric', secondaryType: 'steel', baseHp: 160, baseDamage: 48 },
    { pokemonId: 92, pokemonName: 'Gastly', pokemonType: 'ghost', secondaryType: 'poison', baseHp: 130, baseDamage: 52 },
    { pokemonId: 96, pokemonName: 'Drowzee', pokemonType: 'psychic', baseHp: 180, baseDamage: 44 },
    { pokemonId: 109, pokemonName: 'Koffing', pokemonType: 'poison', baseHp: 175, baseDamage: 46 },
  ],
  '81-90': [
    { pokemonId: 100, pokemonName: 'Voltorb', pokemonType: 'electric', baseHp: 150, baseDamage: 55 },
    { pokemonId: 98, pokemonName: 'Krabby', pokemonType: 'water', baseHp: 170, baseDamage: 50 },
    { pokemonId: 102, pokemonName: 'Exeggcute', pokemonType: 'grass', secondaryType: 'psychic', baseHp: 190, baseDamage: 48 },
    { pokemonId: 104, pokemonName: 'Cubone', pokemonType: 'ground', baseHp: 180, baseDamage: 52 },
  ],
  '91-100': [
    { pokemonId: 111, pokemonName: 'Rhyhorn', pokemonType: 'ground', secondaryType: 'rock', baseHp: 250, baseDamage: 55 },
    { pokemonId: 113, pokemonName: 'Chansey', pokemonType: 'normal', baseHp: 400, baseDamage: 35 },
    { pokemonId: 147, pokemonName: 'Dratini', pokemonType: 'dragon', baseHp: 180, baseDamage: 60 },
    { pokemonId: 137, pokemonName: 'Porygon', pokemonType: 'normal', baseHp: 200, baseDamage: 58 },
  ],
};

// Challengers (stronger enemies at end of each stage)
export const STAGE_CHALLENGERS: Record<string, StageEnemy[]> = {
  '1-10': [
    { pokemonId: 20, pokemonName: 'Raticate', pokemonType: 'normal', baseHp: 200, baseDamage: 25, isChallenger: true },
    { pokemonId: 17, pokemonName: 'Pidgeotto', pokemonType: 'normal', secondaryType: 'flying', baseHp: 180, baseDamage: 22, isChallenger: true },
  ],
  '11-20': [
    { pokemonId: 24, pokemonName: 'Arbok', pokemonType: 'poison', baseHp: 280, baseDamage: 35, isChallenger: true },
    { pokemonId: 22, pokemonName: 'Fearow', pokemonType: 'normal', secondaryType: 'flying', baseHp: 260, baseDamage: 38, isChallenger: true },
  ],
  '21-30': [
    { pokemonId: 28, pokemonName: 'Sandslash', pokemonType: 'ground', baseHp: 350, baseDamage: 42, isChallenger: true },
    { pokemonId: 42, pokemonName: 'Golbat', pokemonType: 'poison', secondaryType: 'flying', baseHp: 320, baseDamage: 40, isChallenger: true },
  ],
  '31-40': [
    { pokemonId: 45, pokemonName: 'Vileplume', pokemonType: 'grass', secondaryType: 'poison', baseHp: 400, baseDamage: 48, isChallenger: true },
    { pokemonId: 51, pokemonName: 'Dugtrio', pokemonType: 'ground', baseHp: 280, baseDamage: 58, isChallenger: true },
  ],
  '41-50': [
    { pokemonId: 55, pokemonName: 'Golduck', pokemonType: 'water', baseHp: 420, baseDamage: 52, isChallenger: true },
    { pokemonId: 57, pokemonName: 'Primeape', pokemonType: 'fighting', baseHp: 380, baseDamage: 62, isChallenger: true },
  ],
  '51-60': [
    { pokemonId: 59, pokemonName: 'Arcanine', pokemonType: 'fire', baseHp: 500, baseDamage: 65, isChallenger: true },
    { pokemonId: 62, pokemonName: 'Poliwrath', pokemonType: 'water', secondaryType: 'fighting', baseHp: 480, baseDamage: 58, isChallenger: true },
  ],
  '61-70': [
    { pokemonId: 76, pokemonName: 'Golem', pokemonType: 'rock', secondaryType: 'ground', baseHp: 550, baseDamage: 60, isChallenger: true },
    { pokemonId: 78, pokemonName: 'Rapidash', pokemonType: 'fire', baseHp: 450, baseDamage: 72, isChallenger: true },
  ],
  '71-80': [
    { pokemonId: 94, pokemonName: 'Gengar', pokemonType: 'ghost', secondaryType: 'poison', baseHp: 400, baseDamage: 85, isChallenger: true },
    { pokemonId: 65, pokemonName: 'Alakazam', pokemonType: 'psychic', baseHp: 350, baseDamage: 95, isChallenger: true },
  ],
  '81-90': [
    { pokemonId: 101, pokemonName: 'Electrode', pokemonType: 'electric', baseHp: 420, baseDamage: 88, isChallenger: true },
    { pokemonId: 103, pokemonName: 'Exeggutor', pokemonType: 'grass', secondaryType: 'psychic', baseHp: 550, baseDamage: 78, isChallenger: true },
  ],
  '91-100': [
    { pokemonId: 112, pokemonName: 'Rhydon', pokemonType: 'ground', secondaryType: 'rock', baseHp: 650, baseDamage: 85, isChallenger: true },
    { pokemonId: 148, pokemonName: 'Dragonair', pokemonType: 'dragon', baseHp: 500, baseDamage: 95, isChallenger: true },
  ],
};

// Mini-bosses (stages ending in 5)
export const MINI_BOSSES: Record<number, StageEnemy> = {
  5: { pokemonId: 15, pokemonName: 'Beedrill', pokemonType: 'bug', secondaryType: 'poison', baseHp: 400, baseDamage: 45, isMiniBoss: true },
  15: { pokemonId: 24, pokemonName: 'Arbok', pokemonType: 'poison', baseHp: 600, baseDamage: 55, isMiniBoss: true },
  25: { pokemonId: 31, pokemonName: 'Nidoqueen', pokemonType: 'poison', secondaryType: 'ground', baseHp: 800, baseDamage: 65, isMiniBoss: true },
  35: { pokemonId: 47, pokemonName: 'Parasect', pokemonType: 'bug', secondaryType: 'grass', baseHp: 900, baseDamage: 70, isMiniBoss: true },
  45: { pokemonId: 53, pokemonName: 'Persian', pokemonType: 'normal', baseHp: 850, baseDamage: 80, isMiniBoss: true },
  55: { pokemonId: 68, pokemonName: 'Machamp', pokemonType: 'fighting', baseHp: 1100, baseDamage: 95, isMiniBoss: true },
  65: { pokemonId: 80, pokemonName: 'Slowbro', pokemonType: 'water', secondaryType: 'psychic', baseHp: 1300, baseDamage: 85, isMiniBoss: true },
  75: { pokemonId: 110, pokemonName: 'Weezing', pokemonType: 'poison', baseHp: 1200, baseDamage: 100, isMiniBoss: true },
  85: { pokemonId: 99, pokemonName: 'Kingler', pokemonType: 'water', baseHp: 1400, baseDamage: 110, isMiniBoss: true },
  95: { pokemonId: 130, pokemonName: 'Gyarados', pokemonType: 'water', secondaryType: 'flying', baseHp: 1800, baseDamage: 120, isMiniBoss: true },
};

// Bosses (stages ending in 0)
export const BOSSES: Record<number, StageEnemy> = {
  10: { pokemonId: 20, pokemonName: 'Raticate', pokemonType: 'normal', baseHp: 800, baseDamage: 50, isBoss: true },
  20: { pokemonId: 22, pokemonName: 'Fearow', pokemonType: 'normal', secondaryType: 'flying', baseHp: 1200, baseDamage: 70, isBoss: true },
  30: { pokemonId: 34, pokemonName: 'Nidoking', pokemonType: 'poison', secondaryType: 'ground', baseHp: 1600, baseDamage: 90, isBoss: true },
  40: { pokemonId: 45, pokemonName: 'Vileplume', pokemonType: 'grass', secondaryType: 'poison', baseHp: 1800, baseDamage: 100, isBoss: true },
  50: { pokemonId: 57, pokemonName: 'Primeape', pokemonType: 'fighting', baseHp: 2000, baseDamage: 120, isBoss: true },
  60: { pokemonId: 59, pokemonName: 'Arcanine', pokemonType: 'fire', baseHp: 2500, baseDamage: 140, isBoss: true },
  70: { pokemonId: 76, pokemonName: 'Golem', pokemonType: 'rock', secondaryType: 'ground', baseHp: 3000, baseDamage: 130, isBoss: true },
  80: { pokemonId: 94, pokemonName: 'Gengar', pokemonType: 'ghost', secondaryType: 'poison', baseHp: 2800, baseDamage: 180, isBoss: true },
  90: { pokemonId: 103, pokemonName: 'Exeggutor', pokemonType: 'grass', secondaryType: 'psychic', baseHp: 3500, baseDamage: 170, isBoss: true },
  100: { pokemonId: 149, pokemonName: 'Dragonite', pokemonType: 'dragon', secondaryType: 'flying', baseHp: 5000, baseDamage: 250, isBoss: true },
};

/**
 * Get the enemy pool for a given stage
 */
export const getEnemyPoolForStage = (stage: number): StageEnemy[] => {
  if (stage <= 10) return STAGE_ENEMY_POOLS['1-10'];
  if (stage <= 20) return STAGE_ENEMY_POOLS['11-20'];
  if (stage <= 30) return STAGE_ENEMY_POOLS['21-30'];
  if (stage <= 40) return STAGE_ENEMY_POOLS['31-40'];
  if (stage <= 50) return STAGE_ENEMY_POOLS['41-50'];
  if (stage <= 60) return STAGE_ENEMY_POOLS['51-60'];
  if (stage <= 70) return STAGE_ENEMY_POOLS['61-70'];
  if (stage <= 80) return STAGE_ENEMY_POOLS['71-80'];
  if (stage <= 90) return STAGE_ENEMY_POOLS['81-90'];
  return STAGE_ENEMY_POOLS['91-100'];
};

/**
 * Get challenger pool for a given stage
 */
export const getChallengerPoolForStage = (stage: number): StageEnemy[] => {
  if (stage <= 10) return STAGE_CHALLENGERS['1-10'];
  if (stage <= 20) return STAGE_CHALLENGERS['11-20'];
  if (stage <= 30) return STAGE_CHALLENGERS['21-30'];
  if (stage <= 40) return STAGE_CHALLENGERS['31-40'];
  if (stage <= 50) return STAGE_CHALLENGERS['41-50'];
  if (stage <= 60) return STAGE_CHALLENGERS['51-60'];
  if (stage <= 70) return STAGE_CHALLENGERS['61-70'];
  if (stage <= 80) return STAGE_CHALLENGERS['71-80'];
  if (stage <= 90) return STAGE_CHALLENGERS['81-90'];
  return STAGE_CHALLENGERS['91-100'];
};

/**
 * Generate waves for a stage (6 waves total)
 */
export const generateStageWaves = (stage: number): StageEnemy[][] => {
  const enemyPool = getEnemyPoolForStage(stage);
  const waves: StageEnemy[][] = [];
  
  // 6 waves: waves 1-4 are common enemies, wave 5 is challenger, wave 6 is boss/miniboss/extra challenger
  for (let wave = 0; wave < 6; wave++) {
    if (wave < 4) {
      // Waves 1-4: 1 common enemy per wave
      const randomEnemy = enemyPool[Math.floor(Math.random() * enemyPool.length)];
      waves.push([{
        ...randomEnemy,
        baseHp: calculateScaledHp(randomEnemy.baseHp, stage),
        baseDamage: calculateScaledDamage(randomEnemy.baseDamage, stage),
        isBoss: false,
        isMiniBoss: false,
        isChallenger: false,
      }]);
    } else if (wave === 4) {
      // Wave 5: Challenger
      const challenger = getChallengerForStage(stage);
      waves.push([challenger]);
    } else {
      // Wave 6: Boss (stages ending in 0), Mini-boss (stages ending in 5), or Challenger
      const bossOrMiniBoss = getBossForStage(stage);
      if (bossOrMiniBoss) {
        waves.push([bossOrMiniBoss]);
      } else {
        // Extra challenger for stages not ending in 0 or 5
        const extraChallenger = getChallengerForStage(stage);
        waves.push([{ ...extraChallenger, isChallenger: true }]);
      }
    }
  }
  
  return waves;
};

/**
 * Get the challenger for a stage
 */
export const getChallengerForStage = (stage: number): StageEnemy => {
  const challengerPool = getChallengerPoolForStage(stage);
  const randomChallenger = challengerPool[Math.floor(Math.random() * challengerPool.length)];
  
  return {
    ...randomChallenger,
    baseHp: calculateScaledHp(randomChallenger.baseHp, stage),
    baseDamage: calculateScaledDamage(randomChallenger.baseDamage, stage),
    isChallenger: true,
    isBoss: false,
    isMiniBoss: false,
  };
};

/**
 * Check if stage has a mini-boss
 */
export const hasMiniBoss = (stage: number): boolean => {
  return stage % 10 === 5;
};

/**
 * Check if stage has a boss
 */
export const hasBoss = (stage: number): boolean => {
  return stage % 10 === 0;
};

/**
 * Get boss or mini-boss for a stage
 */
export const getBossForStage = (stage: number): StageEnemy | null => {
  if (hasBoss(stage) && BOSSES[stage]) {
    const boss = BOSSES[stage];
    return {
      ...boss,
      baseHp: calculateScaledHp(boss.baseHp, stage),
      baseDamage: calculateScaledDamage(boss.baseDamage, stage),
      isBoss: true,
      isMiniBoss: false,
      isChallenger: false,
    };
  }
  
  if (hasMiniBoss(stage) && MINI_BOSSES[stage]) {
    const miniBoss = MINI_BOSSES[stage];
    return {
      ...miniBoss,
      baseHp: calculateScaledHp(miniBoss.baseHp, stage),
      baseDamage: calculateScaledDamage(miniBoss.baseDamage, stage),
      isBoss: false,
      isMiniBoss: true,
      isChallenger: false,
    };
  }
  
  return null;
};
