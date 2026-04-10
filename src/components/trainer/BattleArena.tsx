import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, FastForward, Swords, Zap, Sparkles, Bot, ChevronRight, Clock, Trophy, Gift, StopCircle, Package, Shield, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { TYPE_COLORS, type PokemonType, SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE, NO_EFFECT } from '@/data/typeAdvantages';
import pokegemIcon from '@/assets/pokegem.png';
import battleArenaBg from '@/assets/battle-arena-bg.png';
import { 
  generateStageWaves, 
  hasBoss,
  hasMiniBoss,
  getStunConfig,
  calculateEnemyDrop,
  calculateEnemyXP,
  type StageEnemy 
} from '@/data/stageEnemies';
import { 
  STATUS_EFFECTS, 
  getEffectForType, 
  isAllyEffect, 
  isSelfEffect, 
  getEffectChance,
  canEnemyStun,
  getStunMissChance,
  getDamageModifier,
  type StatusEffect,
  type ActiveEffectState 
} from '@/data/statusEffects';
import { calculatePokemonDamage, type StatGrade, EFFECT_CHANCES, getPetDamageMultiplier, SPEED_VALUES } from '@/data/trainerPokemonPool';
import { getEffectiveSpeedMultiplier } from '@/data/typeModifiers';
import { EFFECT_BADGE_INFO, TYPE_BADGE_COLORS } from '@/data/typeIcons';
import { calculateItemDrops, type ItemDrop } from '@/data/essenceConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';

// Combat constants
const CRIT_CHANCE = 0.05; // 5% base crit chance
const CRIT_MULTIPLIER = 2.0; // 2x damage on crit
const MIN_STAR_FOR_EFFECTS = 3; // Only 3★+ Pokemon can apply effects

interface BattleArenaProps {
  teamPokemon: TrainerPokemonData[];
  hasAutoFarm: boolean;
  pokegems: number;
  highestStageCleared: number;
  petRarity?: string;
  petIsShiny?: boolean;
  onRunComplete: (rewards: RunRewards) => Promise<void>;
  onPurchaseAutoFarm: () => Promise<boolean>;
}

export interface RunRewards {
  pokegems: number;
  pokemonXP: { pokemonId: string; xp: number }[];
  highestStage: number;
  enemiesDefeated: number;
  itemDrops?: { itemId: number; quantity: number }[];
}

// Accumulated drop for UI display
interface AccumulatedDrop {
  itemId: number;
  name: string;
  iconUrl: string;
  quantity: number;
  type: string;
}

// Accumulated pack drop for UI display
interface AccumulatedPackDrop {
  packId: string;
  packName: string;
  quantity: number;
}

const PACK_ARTWORK: Record<string, string> = {
  brasa_comum: '/packs/brasacomum.png',
  aurora_incomum: '/packs/uncommonaurora.png',
  prisma_raro: '/packs/rareprism.png',
  eclipse_epico: '/packs/epiceclipse.png',
  reliquia_lendaria: '/packs/legendaryrelic.png',
  secreto_ruina: '/packs/secretancient.png',
};

// Current enemy state with new effect tracking
interface EnemyState {
  id: string;
  name: string;
  pokemonId: number;
  type: PokemonType;
  secondaryType?: PokemonType;
  maxHp: number;
  currentHp: number;
  isBoss?: boolean;
  isMiniBoss?: boolean;
  isChallenger?: boolean;
  activeEffects: ActiveEffectState[];
  stunCooldown: number;
  isShaking: boolean;
  isDying?: boolean;
}

// Team pokemon state - now includes starRating for effect eligibility
interface TeamPokemonState {
  id: string;
  name: string;
  pokemonId: number;
  type: PokemonType;
  damage: number;
  level: number;
  starRating: number; // For 3★+ effect check
  effectGrade: StatGrade;
  speedGrade: StatGrade;
  isStunned: boolean;
  stunRemaining: number;
}

interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  effectiveness: 'super' | 'normal' | 'weak' | 'none';
  isHeal?: boolean;
  isEffect?: boolean;
  effectIcon?: string;
  isTeamHit?: boolean;
}

type BattleState = 'idle' | 'fighting' | 'stage_complete' | 'run_complete';
type RunEndReason = 'timeout' | 'stage_limit';

const RUN_DURATION = 300; // 5 minutes in seconds for the ENTIRE RUN
const AUTO_FARM_COST = 150; // Pokegems
const TOTAL_WAVES = 6;
const TOTAL_STAGES = 100;
const WAVE_TRANSITION_DELAY = 150; // 150ms for ultra-snappy wave transitions
const STAGE_TRANSITION_DELAY = 500; // 500ms for fast stage transitions
const ENEMY_DEATH_DURATION = 200; // 200ms death animation
const ENEMY_SPAWN_DURATION = 150; // 150ms spawn animation

const BattleArena = ({ 
  teamPokemon, 
  hasAutoFarm,
  pokegems,
  highestStageCleared,
  petRarity,
  petIsShiny,
  onRunComplete, 
  onPurchaseAutoFarm,
}: BattleArenaProps) => {
  const { t } = useTranslation(['trainer', 'modals']);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const debug = useCallback((...args: any[]) => {
    if (import.meta.env.DEV) console.debug('[TrainerRun]', ...args);
  }, []);
  
  const [currentStage, setCurrentStage] = useState(1);
  const [currentWave, setCurrentWave] = useState(1);
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [currentEnemy, setCurrentEnemy] = useState<EnemyState | null>(null);
  const [teamState, setTeamState] = useState<TeamPokemonState[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [wavesData, setWavesData] = useState<StageEnemy[][]>([]);
  const [timeRemaining, setTimeRemaining] = useState(RUN_DURATION);
  const [autoFarmEnabled, setAutoFarmEnabled] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Accumulated rewards during the run (persistent across runs when Auto Farm is active)
  const [accumulatedGems, setAccumulatedGems] = useState(0);
  const [accumulatedXP, setAccumulatedXP] = useState<Map<string, number>>(new Map());
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [highestStageReached, setHighestStageReached] = useState(0);
  const [runsCompleted, setRunsCompleted] = useState(0);
  
  // Total accumulated across multiple auto-farm runs
  const [totalAccumulatedGems, setTotalAccumulatedGems] = useState(0);
  const [totalAccumulatedXP, setTotalAccumulatedXP] = useState<Map<string, number>>(new Map());
  const [totalEnemiesDefeated, setTotalEnemiesDefeated] = useState(0);
  
  // Pack drops accumulated during the run
  const [accumulatedPackDrops, setAccumulatedPackDrops] = useState<AccumulatedPackDrop[]>([]);
  
  // Item drops accumulated during the run
  const [accumulatedDrops, setAccumulatedDrops] = useState<AccumulatedDrop[]>([]);
  const [totalAccumulatedDrops, setTotalAccumulatedDrops] = useState<AccumulatedDrop[]>([]);
  
  const battleLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTransitionRef = useRef<NodeJS.Timeout | null>(null);
  const defeatedEnemiesRef = useRef<Set<string>>(new Set());
  const attackCooldownRef = useRef<number>(0);
  const runActiveRef = useRef<boolean>(false);
  const isEndingRunRef = useRef<boolean>(false);
  
  // Function refs to break circular dependencies
  const handleEnemyDefeatedRef = useRef<(enemy: EnemyState) => void>(() => {});
  const handleStageCompleteRef = useRef<() => void>(() => {});

  const canBattle = teamPokemon.length > 0;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate team attack stats (total damage + average speed) with pet multiplier
  const petMultiplier = petRarity ? getPetDamageMultiplier(petRarity, petIsShiny || false) : 1.0;
  
  const teamAttackStats = useMemo(() => {
    const activeTeam = teamState.filter(p => !p.isStunned);
    if (activeTeam.length === 0) return { totalDamage: 0, avgSpeed: 1.0 };

    const totalDamage = activeTeam.reduce((sum, p) => sum + p.damage, 0);

    const totalSpeed = activeTeam.reduce((sum, p) => {
      const speedGrade = p.speedGrade || 'C';
      const baseSpeed = SPEED_VALUES[speedGrade as StatGrade] ?? SPEED_VALUES.C;
      const typeSpeedMod = getEffectiveSpeedMultiplier(p.type);
      return sum + (baseSpeed * typeSpeedMod);
    }, 0);

    const avgSpeed = totalSpeed / activeTeam.length;

    // Apply pet multiplier to total damage
    return { totalDamage: Math.floor(totalDamage * petMultiplier), avgSpeed };
  }, [teamState, petMultiplier]);

  // Initialize team state for a new run (keepDrops = true when continuing auto-farm)
  const initializeRun = useCallback((keepDrops: boolean = false) => {
    // Reset run-ending guard for a fresh run
    isEndingRunRef.current = false;

    // Mark run as active
    runActiveRef.current = true;
    
    // Reset run-specific state
    setCurrentStage(1);
    setCurrentWave(1);
    setTimeRemaining(RUN_DURATION);
    defeatedEnemiesRef.current.clear();
    attackCooldownRef.current = 0;
    
    if (!keepDrops) {
      // Full reset - new session
      setAccumulatedGems(0);
      setAccumulatedXP(new Map());
      setEnemiesDefeated(0);
      setHighestStageReached(0);
      setRunsCompleted(0);
      setTotalAccumulatedGems(0);
      setTotalAccumulatedXP(new Map());
      setTotalEnemiesDefeated(0);
      // Reset item drops
      setAccumulatedDrops([]);
      setTotalAccumulatedDrops([]);
      setAccumulatedPackDrops([]);
    } else {
      // Auto-farm continuation - accumulate totals from previous run, reset current run
      setTotalAccumulatedGems(prev => prev + accumulatedGems);
      setTotalAccumulatedXP(prev => {
        const newMap = new Map(prev);
        accumulatedXP.forEach((xp, id) => {
          newMap.set(id, (newMap.get(id) || 0) + xp);
        });
        return newMap;
      });
      setTotalEnemiesDefeated(prev => prev + enemiesDefeated);
      setHighestStageReached(prev => Math.max(prev, highestStageReached));
      
      // Move current drops to total accumulated
      setTotalAccumulatedDrops(prev => {
        const updated = [...prev];
        accumulatedDrops.forEach(drop => {
          const existing = updated.find(d => d.itemId === drop.itemId);
          if (existing) {
            existing.quantity += drop.quantity;
          } else {
            updated.push({ ...drop });
          }
        });
        return updated;
      });
      
      // Reset current run counters
      setAccumulatedGems(0);
      setAccumulatedXP(new Map());
      setEnemiesDefeated(0);
      setAccumulatedDrops([]);
    }
    
    // Initialize team state with level-based damage
    const initialTeamState: TeamPokemonState[] = teamPokemon.map(p => {
      let damage = calculatePokemonDamage(p.power, p.stat_damage as StatGrade, p.level, p.pokemon_type);
      // Shiny units deal 50% more damage
      if (p.is_shiny) {
        damage = Math.floor(damage * 1.5);
      }
      return {
        id: p.id,
        name: p.pokemon_name,
        pokemonId: p.pokemon_id,
        type: p.pokemon_type as PokemonType,
        damage,
        level: p.level,
        starRating: p.star_rating,
        effectGrade: p.stat_effect as StatGrade,
        speedGrade: p.stat_speed as StatGrade,
        isStunned: false,
        stunRemaining: 0,
      };
    });
    setTeamState(initialTeamState);

    // Generate waves for stage 1
    const waves = generateStageWaves(1);
    setWavesData(waves);
    
    // Spawn first enemy
    spawnEnemy(waves[0][0], 1);
    
    setBattleState('fighting');
  }, [teamPokemon, accumulatedGems, accumulatedXP, enemiesDefeated, highestStageReached, accumulatedDrops]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveTransitionRef.current) {
        clearTimeout(waveTransitionRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (battleLoopRef.current) {
        cancelAnimationFrame(battleLoopRef.current);
      }
    };
  }, []);

  // Timer countdown (runs for entire run, not per stage)
  const isRunTimerActive = battleState === 'fighting' || battleState === 'stage_complete';

  useEffect(() => {
    if (isRunTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => Math.max(prev - 1, 0));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunTimerActive]);

  // Handle run end (time's up or stage 100 reached)
  // Timeout should always open rewards screen for manual collection
  const handleRunEnd = useCallback(async (reason: RunEndReason = 'stage_limit') => {
    // Guard against duplicate end processing
    if (isEndingRunRef.current) {
      return;
    }
    isEndingRunRef.current = true;

    // CRITICAL: Mark run as inactive IMMEDIATELY to stop all processing
    runActiveRef.current = false;
    
    // CRITICAL: Cancel battle loop IMMEDIATELY
    if (battleLoopRef.current) {
      cancelAnimationFrame(battleLoopRef.current);
      battleLoopRef.current = null;
    }
    
    // CRITICAL: Cancel timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // CRITICAL: Clear any pending wave transitions
    if (waveTransitionRef.current) {
      clearTimeout(waveTransitionRef.current);
      waveTransitionRef.current = null;
    }
    
    const shouldAutoRestart = reason !== 'timeout' && autoFarmEnabled && hasAutoFarm && user;

    // If Auto Farm is active (and not timeout), collect rewards silently and restart
    if (shouldAutoRestart) {
      // Collect current run rewards silently
      const allDrops = [...totalAccumulatedDrops, ...accumulatedDrops];
      const mergedDrops: AccumulatedDrop[] = [];
      allDrops.forEach(drop => {
        const existing = mergedDrops.find(d => d.itemId === drop.itemId);
        if (existing) {
          existing.quantity += drop.quantity;
        } else {
          mergedDrops.push({ ...drop });
        }
      });
      
      // Save drops to inventory silently
      if (mergedDrops.length > 0) {
        for (const drop of mergedDrops) {
          try {
            await supabase.rpc('add_user_item', {
              p_user_id: user.id,
              p_item_id: drop.itemId,
              p_quantity: drop.quantity,
            });
          } catch (e) {
            console.error('Auto-farm: failed to save drop', e);
          }
        }
      }
      
      // Calculate final rewards for this run
      const finalGems = totalAccumulatedGems + accumulatedGems;
      const finalXP = new Map(totalAccumulatedXP);
      accumulatedXP.forEach((xp, id) => {
        finalXP.set(id, (finalXP.get(id) || 0) + xp);
      });
      const finalEnemies = totalEnemiesDefeated + enemiesDefeated;
      
      const rewards: RunRewards = {
        pokegems: finalGems,
        pokemonXP: Array.from(finalXP.entries()).map(([pokemonId, xp]) => ({ pokemonId, xp })),
        highestStage: highestStageReached,
        enemiesDefeated: finalEnemies,
        itemDrops: mergedDrops.map(d => ({ itemId: d.itemId, quantity: d.quantity })),
      };
      
      // Complete run rewards silently
      try {
        await onRunComplete(rewards);
      } catch (e) {
        console.error('Auto-farm: failed to complete run', e);
      }
      
      setRunsCompleted(prev => prev + 1);
      
      // Reset all state for fresh run
      setCurrentEnemy(null);
      setIsTransitioning(false);
      defeatedEnemiesRef.current.clear();
      setDamageNumbers([]);
      setAccumulatedDrops([]);
      setTotalAccumulatedDrops([]);
      setAccumulatedPackDrops([]);
      setAccumulatedGems(0);
      setTotalAccumulatedGems(0);
      setAccumulatedXP(new Map());
      setTotalAccumulatedXP(new Map());
      setEnemiesDefeated(0);
      setTotalEnemiesDefeated(0);
      
      // Start fresh run immediately (not keeping drops - already collected)
      initializeRun(false);
    } else {
      // Normal end - show rewards screen
      setCurrentEnemy(null);
      setIsTransitioning(false);
      defeatedEnemiesRef.current.clear();
      setDamageNumbers([]);
      setBattleState('run_complete');
    }
  }, [autoFarmEnabled, hasAutoFarm, user, initializeRun, onRunComplete, 
      accumulatedDrops, totalAccumulatedDrops, accumulatedGems, totalAccumulatedGems,
      accumulatedXP, totalAccumulatedXP, enemiesDefeated, totalEnemiesDefeated, highestStageReached]);

  // Trigger run end when timer reaches zero
  useEffect(() => {
    if ((battleState === 'fighting' || battleState === 'stage_complete') && timeRemaining <= 0) {
      handleRunEnd('timeout');
    }
  }, [battleState, timeRemaining, handleRunEnd]);
  
  // Manual end run - player clicked "End Run" button
  // Always shows rewards screen, even if Auto Farm is active
  const handleEndRunManual = useCallback(() => {
    // Stop run processing immediately
    runActiveRef.current = false;
    isEndingRunRef.current = true;

    if (battleLoopRef.current) {
      cancelAnimationFrame(battleLoopRef.current);
      battleLoopRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear any pending transitions
    if (waveTransitionRef.current) {
      clearTimeout(waveTransitionRef.current);
      waveTransitionRef.current = null;
    }
    
    // Disable auto farm so it doesn't restart
    setAutoFarmEnabled(false);
    
    // Show rewards screen
    setBattleState('run_complete');
  }, []);

  // Helper to get all drops combined
  const getAllDrops = useCallback((): AccumulatedDrop[] => {
    const combined = [...totalAccumulatedDrops];
    
    accumulatedDrops.forEach(drop => {
      const existing = combined.find(d => d.itemId === drop.itemId);
      if (existing) {
        existing.quantity += drop.quantity;
      } else {
        combined.push({ ...drop });
      }
    });
    
    return combined;
  }, [accumulatedDrops, totalAccumulatedDrops]);

  // Collect rewards and end run - includes all accumulated drops
  const handleCollectRewards = useCallback(async () => {
    if (isCollecting || !user) return;
    setIsCollecting(true);

    // Calculate final totals (current run + previous auto-farm runs)
    const finalGems = totalAccumulatedGems + accumulatedGems;
    const finalXP = new Map(totalAccumulatedXP);
    accumulatedXP.forEach((xp, id) => {
      finalXP.set(id, (finalXP.get(id) || 0) + xp);
    });
    const finalEnemies = totalEnemiesDefeated + enemiesDefeated;
    
    // Combine all item drops
    const allDrops = getAllDrops();
    const itemDropsForReward = allDrops.map(drop => ({
      itemId: drop.itemId,
      quantity: drop.quantity,
    }));

    const rewards: RunRewards = {
      pokegems: finalGems,
      pokemonXP: Array.from(finalXP.entries()).map(([pokemonId, xp]) => ({ pokemonId, xp })),
      highestStage: highestStageReached,
      enemiesDefeated: finalEnemies,
      itemDrops: itemDropsForReward,
    };

    debug('collect_rewards_click', {
      rewards,
      runsCompleted,
      before: { accumulatedGems, totalAccumulatedGems, highestStageReached, enemiesDefeated },
      itemDrops: allDrops,
    });

    try {
      // Save item drops to user inventory
      if (allDrops.length > 0) {
        for (const drop of allDrops) {
          await supabase.rpc('add_user_item', {
            p_user_id: user.id,
            p_item_id: drop.itemId,
            p_quantity: drop.quantity,
          });
        }
      }
      
      await onRunComplete(rewards);
      debug('collect_rewards_done');
    } catch (error) {
      debug('collect_rewards_error', error);
      console.error('Failed to collect rewards:', error);
    } finally {
      setIsCollecting(false);
      isEndingRunRef.current = false;
      setBattleState('idle');
      setCurrentStage(1);
      setCurrentWave(1);
      // Reset all accumulated state
      setTotalAccumulatedGems(0);
      setTotalAccumulatedXP(new Map());
      setTotalEnemiesDefeated(0);
      setRunsCompleted(0);
      // Reset item drops
      setAccumulatedDrops([]);
      setTotalAccumulatedDrops([]);
      setAccumulatedPackDrops([]);
    }
  }, [accumulatedGems, accumulatedXP, highestStageReached, enemiesDefeated, totalAccumulatedGems, totalAccumulatedXP, totalEnemiesDefeated, runsCompleted, onRunComplete, debug, isCollecting, user, getAllDrops]);

  // Spawn an enemy for the current wave - with overkill damage system
  const spawnEnemy = useCallback((
    enemyData: StageEnemy, 
    waveNumber: number, 
    overkillDamage: number = 0,
    currentWaveNum: number = waveNumber,
    waves: StageEnemy[][] = wavesData
  ) => {
    // CRITICAL: Guard - don't spawn if run is not active
    if (!runActiveRef.current) {
      console.log('[BattleArena] spawnEnemy ignored - run not active');
      return;
    }
    
    const effectiveHp = enemyData.baseHp - overkillDamage;
    
    // If overkill damage kills this enemy before it appears
    if (effectiveHp <= 0) {
      // Overkill carry-over: skip damage numbers to avoid visual clutter
      // The original hit already showed the full damage on the previous enemy
      
      // Create a temporary enemy object for reward calculation
      const tempEnemy: EnemyState = {
        id: `enemy-${waveNumber}-${Date.now()}-overkill`,
        name: enemyData.pokemonName,
        pokemonId: enemyData.pokemonId,
        type: enemyData.pokemonType,
        secondaryType: enemyData.secondaryType,
        maxHp: enemyData.baseHp,
        currentHp: 0,
        isBoss: enemyData.isBoss,
        isMiniBoss: enemyData.isMiniBoss,
        isChallenger: enemyData.isChallenger,
        activeEffects: [],
        stunCooldown: 0,
        isShaking: false,
      };
      
      // Grant rewards for this enemy using ref
      handleEnemyDefeatedRef.current(tempEnemy);
      
      // Calculate remaining overkill
      const remainingOverkill = Math.abs(effectiveHp);
      
      // Check if we need to go to next wave or complete stage
      if (waveNumber >= TOTAL_WAVES) {
        // Stage complete - overkill does NOT transfer between stages
        setIsTransitioning(false); // Reset so battle loop can resume after stage transition
        handleStageCompleteRef.current();
      } else {
        // Recursively process next wave immediately (no delay for overkill)
        const nextWave = waveNumber + 1;
        setCurrentWave(nextWave);
        if (nextWave <= waves.length) {
          spawnEnemy(waves[nextWave - 1][0], nextWave, remainingOverkill, nextWave, waves);
        }
      }
      return;
    }
    
    // Enemy survives overkill - spawn with reduced HP
    const stunConfig = getStunConfig(enemyData.isBoss, enemyData.isMiniBoss, enemyData.isChallenger);
    
    const enemy: EnemyState = {
      id: `enemy-${waveNumber}-${Date.now()}`,
      name: enemyData.pokemonName,
      pokemonId: enemyData.pokemonId,
      type: enemyData.pokemonType,
      secondaryType: enemyData.secondaryType,
      maxHp: enemyData.baseHp,
      currentHp: effectiveHp, // Start with reduced HP from overkill
      isBoss: enemyData.isBoss,
      isMiniBoss: enemyData.isMiniBoss,
      isChallenger: enemyData.isChallenger,
      activeEffects: [],
      stunCooldown: stunConfig.stunCooldown,
      isShaking: false,
    };
    setCurrentEnemy(enemy);
    // Reset attack cooldown - first attack after avgSpeed delay
    attackCooldownRef.current = teamAttackStats.avgSpeed;
    setIsTransitioning(false);
  }, [teamAttackStats.avgSpeed, wavesData]);

  // Add floating damage number
  const addDamageNumber = useCallback((
    value: number, 
    isCrit: boolean, 
    effectiveness: number, 
    isHeal?: boolean,
    isEffect?: boolean,
    effectIcon?: string,
    isTeamHit?: boolean
  ) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    const x = isTeamHit ? 35 + Math.random() * 30 : 40 + Math.random() * 20;
    const y = isTeamHit ? 25 + Math.random() * 30 : 30 + Math.random() * 20;
    
    let effectivenessType: 'super' | 'normal' | 'weak' | 'none' = 'normal';
    if (effectiveness >= SUPER_EFFECTIVE) effectivenessType = 'super';
    else if (effectiveness === NO_EFFECT) effectivenessType = 'none';
    else if (effectiveness <= NOT_VERY_EFFECTIVE) effectivenessType = 'weak';
    
    setDamageNumbers(prev => [...prev, { 
      id, value, x, y, isCrit, effectiveness: effectivenessType, isHeal, isEffect, effectIcon, isTeamHit 
    }]);
    
    // Fast timeout so damage numbers disappear quickly for fluid combat
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 250);
  }, []);

  // Trigger shake animation on enemy
  const triggerEnemyShake = useCallback(() => {
    setCurrentEnemy(prev => prev ? { ...prev, isShaking: true } : null);
    setTimeout(() => {
      setCurrentEnemy(prev => prev ? { ...prev, isShaking: false } : null);
    }, 300);
  }, []);

  // Apply status effect to enemy - now stores attacker ATK for ATK-based DoT
  const applyStatusEffect = useCallback((
    enemy: EnemyState,
    effect: StatusEffect,
    attackerAtk?: number
  ): EnemyState => {
    const existingEffect = enemy.activeEffects.find(ae => ae.effect.id === effect.id);
    
    if (existingEffect && effect.canStack && existingEffect.stacks < (effect.maxStacks || 1)) {
      return {
        ...enemy,
        activeEffects: enemy.activeEffects.map(ae => 
          ae.effect.id === effect.id 
            ? { ...ae, stacks: ae.stacks + 1, remainingDuration: effect.duration }
            : ae
        ),
      };
    } else if (!existingEffect) {
      const newEffect: ActiveEffectState = {
        effect,
        remainingDuration: effect.duration,
        stacks: 1,
        tickCooldown: effect.tickInterval || 0,
        firstHitConsumed: false,
        currentDamageStack: 0,
        attackerAtk: attackerAtk || 0,
      };
      return {
        ...enemy,
        activeEffects: [...enemy.activeEffects, newEffect],
      };
    }
    
    // If effect exists and doesn't stack, refresh duration
    return {
      ...enemy,
      activeEffects: enemy.activeEffects.map(ae =>
        ae.effect.id === effect.id
          ? { ...ae, remainingDuration: effect.duration }
          : ae
      ),
    };
  }, []);

  // Process DoT effects on enemy
  const processEnemyEffects = useCallback((enemy: EnemyState, delta: number): { 
    enemy: EnemyState; 
    damageDealt: number; 
  } => {
    let totalDamage = 0;
    let updatedEffects: ActiveEffectState[] = [];

    for (const activeEffect of enemy.activeEffects) {
      let newEffect = { ...activeEffect, remainingDuration: activeEffect.remainingDuration - delta };
      
      if (activeEffect.effect.tickInterval) {
        newEffect.tickCooldown -= delta;
        
        if (newEffect.tickCooldown <= 0) {
          newEffect.tickCooldown = activeEffect.effect.tickInterval;
          
          if (activeEffect.effect.damagePerTick) {
            const damage = Math.floor(enemy.maxHp * activeEffect.effect.damagePerTick * activeEffect.stacks);
            totalDamage += damage;
          }
        }
      }
      
      if (newEffect.remainingDuration > 0) {
        updatedEffects.push(newEffect);
      }
    }

    return {
      enemy: {
        ...enemy,
        activeEffects: updatedEffects,
        currentHp: Math.max(0, enemy.currentHp - totalDamage),
      },
      damageDealt: totalDamage,
    };
  }, []);

  // Handle enemy defeat - accumulate rewards and item drops
  const handleEnemyDefeated = useCallback((enemy: EnemyState) => {
    // CRITICAL: Guard against calls during run transition
    if (!runActiveRef.current) {
      console.log('[BattleArena] Ignoring enemy defeat - run not active');
      return;
    }
    
    if (defeatedEnemiesRef.current.has(enemy.id)) {
      console.log('[BattleArena] Enemy already defeated, skipping:', enemy.id);
      return;
    }
    defeatedEnemiesRef.current.add(enemy.id);
    
    const isBoss = enemy.isBoss || false;
    const isMiniBoss = enemy.isMiniBoss || false;
    const isChallenger = enemy.isChallenger || false;

    console.log('[BattleArena] handleEnemyDefeated called:', {
      enemyName: enemy.name,
      enemyId: enemy.id,
      isBoss,
      isMiniBoss,
      isChallenger,
      currentAccumulatedGems: accumulatedGems,
      currentStage,
    });

    const gemDrop = calculateEnemyDrop(isBoss, isMiniBoss, isChallenger);
    
    console.log('[BattleArena] Gem drop calculated:', {
      gemDrop,
      previousAccumulated: accumulatedGems,
      willBecome: accumulatedGems + gemDrop,
    });
    
    if (gemDrop > 0) {
      setAccumulatedGems(prev => {
        console.log('[BattleArena] setAccumulatedGems:', prev, '+', gemDrop, '=', prev + gemDrop);
        return prev + gemDrop;
      });
    }

    // Calculate item drops
    const itemDrops = calculateItemDrops(isBoss, isMiniBoss, isChallenger, currentStage);
    
    if (itemDrops.length > 0) {
      console.log('[BattleArena] Item drops:', itemDrops);
      
      setAccumulatedDrops(prev => {
        const updated = [...prev];
        itemDrops.forEach(drop => {
          const existing = updated.find(d => d.itemId === drop.itemId);
          if (existing) {
            existing.quantity += drop.quantity;
          } else {
            updated.push({ ...drop });
          }
        });
        return updated;
      });
      
      // Show visual notification for each drop
      itemDrops.forEach((drop, index) => {
        setTimeout(() => {
          addDamageNumber(0, false, 1, false, true, `📦 ${drop.name}`, false);
        }, index * 200);
      });
    }

    debug('enemy_defeated', {
      stage: currentStage,
      wave: currentWave,
      enemy: {
        name: enemy.name,
        pokemonId: enemy.pokemonId,
        isBoss,
        isMiniBoss,
        isChallenger,
      },
      gemDrop,
      itemDrops,
      accumulatedGems_after: gemDrop > 0 ? accumulatedGems + gemDrop : accumulatedGems,
    });

    const xpGained = calculateEnemyXP(currentStage, isBoss, isMiniBoss, isChallenger);
    setAccumulatedXP(prev => {
      const newMap = new Map(prev);
      teamState.forEach(pokemon => {
        const currentXP = newMap.get(pokemon.id) || 0;
        newMap.set(pokemon.id, currentXP + xpGained);
      });
      return newMap;
    });

    setEnemiesDefeated(prev => prev + 1);

    // Roll for pack drops
    if (user) {
      supabase.rpc('grant_pack_drop', { p_user_id: user.id }).then(({ data }) => {
        const result = data as unknown as { success: boolean; drops: { pack_id: string; pack_name: string }[] };
        if (result?.success && result.drops?.length > 0) {
          result.drops.forEach((drop, idx) => {
            const localizedPackName = t(`modals:packs.${drop.pack_id}`, { defaultValue: drop.pack_name });
            setTimeout(() => {
              addDamageNumber(0, false, 1, false, true, `📦 ${localizedPackName}`, false);
            }, idx * 300);
          });
          // Accumulate pack drops
          setAccumulatedPackDrops(prev => {
            const next = [...prev];
            result.drops.forEach(drop => {
              const localizedPackName = t(`modals:packs.${drop.pack_id}`, { defaultValue: drop.pack_name });
              const existing = next.find(p => p.packId === drop.pack_id);
              if (existing) {
                existing.quantity += 1;
              } else {
                next.push({ packId: drop.pack_id, packName: localizedPackName, quantity: 1 });
              }
            });
            return next;
          });
        }
      });
    }
  }, [currentStage, currentWave, teamState, accumulatedGems, debug, addDamageNumber, user]);

  // Go to next wave - with overkill damage support
  const goToNextWave = useCallback((overkillDamage: number = 0) => {
    const nextWave = currentWave + 1;
    setCurrentWave(nextWave);
    
    setTeamState(prev => prev.map(p => ({ ...p, isStunned: false, stunRemaining: 0 })));
    
    if (nextWave <= wavesData.length) {
      spawnEnemy(wavesData[nextWave - 1][0], nextWave, overkillDamage, nextWave, wavesData);
    }
  }, [currentWave, wavesData, spawnEnemy]);

  // Go to next stage
  const goToNextStage = useCallback(() => {
    const nextStage = currentStage + 1;
    
    if (nextStage > TOTAL_STAGES) {
      handleRunEnd('stage_limit');
      return;
    }
    
    setCurrentStage(nextStage);
    setCurrentWave(1);
    setHighestStageReached(prev => Math.max(prev, currentStage));
    
    const waves = generateStageWaves(nextStage);
    setWavesData(waves);
    
    setTeamState(prev => prev.map(p => ({ ...p, isStunned: false, stunRemaining: 0 })));
    
    spawnEnemy(waves[0][0], 1);
    setBattleState('fighting');
  }, [currentStage, spawnEnemy, handleRunEnd]);

  // Handle stage completion
  const handleStageComplete = useCallback(() => {
    setHighestStageReached(prev => Math.max(prev, currentStage));
    setBattleState('stage_complete');
    
    if (autoFarmEnabled && hasAutoFarm) {
      // Ultra-fast transition for auto-farm mode
      waveTransitionRef.current = setTimeout(() => {
        goToNextStage();
      }, 300); // 300ms quick stage advance in auto-farm
    }
  }, [currentStage, autoFarmEnabled, hasAutoFarm, goToNextStage]);

  // Update function refs to break circular dependencies
  useEffect(() => {
    handleEnemyDefeatedRef.current = handleEnemyDefeated;
  }, [handleEnemyDefeated]);

  useEffect(() => {
    handleStageCompleteRef.current = handleStageComplete;
  }, [handleStageComplete]);

  // Ref for current enemy to avoid stale closure issues
  const currentEnemyRef = useRef(currentEnemy);
  useEffect(() => {
    currentEnemyRef.current = currentEnemy;
  }, [currentEnemy]);

  // Main battle loop - NEW ATTACK SYSTEM
  const tick = useCallback((timestamp: number) => {
    // CRITICAL: Skip if run is not active (prevents stale closure processing)
    if (!runActiveRef.current) {
      return;
    }
    
    const enemy = currentEnemyRef.current;
    
    // Skip if not fighting, no enemy, or transitioning between enemies
    if (battleState !== 'fighting' || !enemy || isTransitioning) {
      return; // External loop handles next frame
    }

    // Skip if enemy already dead (will be handled by transition)
    if (enemy.currentHp <= 0) {
      return; // External loop handles next frame
    }

    const rawDelta = (timestamp - lastTickRef.current) / 1000;
    const delta = Math.min(rawDelta * battleSpeed, 0.1);
    lastTickRef.current = timestamp;

    // 1. Update stun timers on team
    setTeamState(prev => prev.map(p => {
      if (p.isStunned) {
        const newStunRemaining = p.stunRemaining - delta;
        if (newStunRemaining <= 0) {
          return { ...p, isStunned: false, stunRemaining: 0 };
        }
        return { ...p, stunRemaining: newStunRemaining };
      }
      return p;
    }));

    // 2. Attack interval system based on team average speed
    attackCooldownRef.current -= delta;
    
    if (attackCooldownRef.current <= 0 && teamAttackStats.totalDamage > 0) {
      let baseDamage = teamAttackStats.totalDamage;
      
      // CRITICAL HIT: 5% chance for 2x damage
      const isCrit = Math.random() < CRIT_CHANCE;
      if (isCrit) {
        baseDamage *= CRIT_MULTIPLIER;
      }
      
      // Apply damage modifiers from enemy effects (Bubble, Vulnerable, Freeze+Fire, Paralyzed first hit, Dragon stacks)
      const activeTeam = teamState.filter(p => !p.isStunned);
      const primaryType = activeTeam.length > 0 ? activeTeam[0].type : undefined;
      const { modifier, consumedFirstHit } = getDamageModifier(
        currentEnemyRef.current?.activeEffects || [], 
        primaryType
      );
      
      const finalDamage = Math.round(baseDamage * modifier);
      
      // If first hit bonus was consumed, update the effect state
      if (consumedFirstHit) {
        setCurrentEnemy(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            activeEffects: prev.activeEffects.map(ae => 
              ae.effect.firstHitBonus && !ae.firstHitConsumed 
                ? { ...ae, firstHitConsumed: true } 
                : ae
            ),
          };
        });
      }
      
      // Use ref to get current HP (avoids stale closure)
      const currentHp = currentEnemyRef.current?.currentHp ?? 0;
      
      // Calculate raw HP BEFORE clamping to detect overkill
      const rawHp = currentHp - finalDamage;
      const newHp = Math.max(0, rawHp);
      
      // Show team hit damage number (with crit indicator)
      addDamageNumber(Math.round(finalDamage), isCrit, 1, false, false, undefined, true);
      
      // Check if enemy will die from this attack
      if (rawHp <= 0) {
        const overkillDamage = Math.abs(rawHp);
        
        setIsTransitioning(true);
        handleEnemyDefeated(enemy);
        
        setCurrentEnemy(prev => prev ? { ...prev, isDying: true, currentHp: 0 } : null);
        
        setTimeout(() => {
          setCurrentEnemy(null);
          
          if (currentWave >= TOTAL_WAVES) {
            handleStageComplete();
          } else {
            // Immediate transition for auto-farm, brief delay otherwise
            const delay = autoFarmEnabled ? 50 : WAVE_TRANSITION_DELAY;
            waveTransitionRef.current = setTimeout(() => {
              goToNextWave(overkillDamage);
            }, delay);
          }
        }, ENEMY_DEATH_DURATION);
        
        return;
      } else {
        setCurrentEnemy(prev => prev ? { ...prev, currentHp: newHp } : null);
        triggerEnemyShake();
      }
      
      attackCooldownRef.current = teamAttackStats.avgSpeed;
    }

    // 3. Process DoT effects and status effects only if enemy is alive
    setCurrentEnemy(prevEnemy => {
      if (!prevEnemy || prevEnemy.currentHp <= 0) return prevEnemy;

      let updatedEnemy = { ...prevEnemy };

      // Process DoT effects
      const { enemy: processedEnemy, damageDealt } = processEnemyEffects(updatedEnemy, delta);
      updatedEnemy = processedEnemy;

      if (damageDealt > 0) {
        addDamageNumber(damageDealt, false, 1, false, true, '💀');
      }

      // Apply status effects from team attacks - ONLY 3★+ Pokemon can apply effects
      teamState.forEach(pokemon => {
        if (pokemon.isStunned) return;
        if (pokemon.starRating < MIN_STAR_FOR_EFFECTS) return; // 3★+ restriction
        
        const effect = getEffectForType(pokemon.type);
        if (effect && !isAllyEffect(effect.id) && !isSelfEffect(effect.id)) {
          // Use the new effect chance system (D=5%, S=7%)
          const chance = EFFECT_CHANCES[pokemon.effectGrade] * delta;
          if (Math.random() < chance) {
            updatedEnemy = applyStatusEffect(updatedEnemy, effect, pokemon.damage);
            addDamageNumber(0, false, 1, false, true, effect.icon);
          }
        }
      });

      // Enemy stun attack
      const stunConfig = getStunConfig(updatedEnemy.isBoss, updatedEnemy.isMiniBoss, updatedEnemy.isChallenger);
      updatedEnemy.stunCooldown -= delta;

      if (updatedEnemy.stunCooldown <= 0) {
        const availableTargets = teamState.filter(p => !p.isStunned);
        if (availableTargets.length > 0 && Math.random() < stunConfig.stunChance) {
          const targetIndex = Math.floor(Math.random() * availableTargets.length);
          const targetId = availableTargets[targetIndex].id;
          
          setTeamState(prev => prev.map(p => 
            p.id === targetId 
              ? { ...p, isStunned: true, stunRemaining: stunConfig.stunDuration }
              : p
          ));
        }
        updatedEnemy.stunCooldown = stunConfig.stunCooldown;
      }

      return updatedEnemy;
    });

    // Note: NO requestAnimationFrame here - external loop handles it
  }, [
    battleState, battleSpeed, teamState, currentWave, teamAttackStats,
    isTransitioning, processEnemyEffects, applyStatusEffect, addDamageNumber, 
    triggerEnemyShake, goToNextWave, handleStageComplete, handleEnemyDefeated
  ]);

  // Store tick in a ref to avoid recreating the battle loop
  const tickRef = useRef<(timestamp: number) => void>();
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Stable tick wrapper that uses the ref
  const stableTick = useCallback((timestamp: number) => {
    tickRef.current?.(timestamp);
  }, []);

  // Start/stop battle loop
  useEffect(() => {
    if (battleState === 'fighting') {
      lastTickRef.current = performance.now();
      // Note: attackCooldownRef is NOT reset here - only on new run/enemy spawn
      
      const loop = (timestamp: number) => {
        // CRITICAL: Don't reschedule if run is not active
        if (!runActiveRef.current) {
          battleLoopRef.current = null;
          return;
        }
        stableTick(timestamp);
        battleLoopRef.current = requestAnimationFrame(loop);
      };
      battleLoopRef.current = requestAnimationFrame(loop);
    }
    
    return () => {
      if (battleLoopRef.current) {
        cancelAnimationFrame(battleLoopRef.current);
        battleLoopRef.current = null;
      }
    };
  }, [battleState, stableTick]);

  const toggleSpeed = useCallback(() => {
    setBattleSpeed(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1);
  }, []);

  const handlePurchaseAutoFarm = async () => {
    const success = await onPurchaseAutoFarm();
    if (success) {
      setAutoFarmEnabled(true);
    }
  };

  // Calculate total damage for display
  const totalDamage = useMemo(() => {
    return teamState
      .filter(p => !p.isStunned)
      .reduce((sum, p) => sum + p.damage, 0);
  }, [teamState]);

  const activeTeamCount = teamState.filter(p => !p.isStunned).length;
  const stunnedPokemon = teamState.filter(p => p.isStunned);
  const isNewRecord = highestStageReached > highestStageCleared;

  // ==================== IDLE STATE ====================
  if (battleState === 'idle') {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl",
          isMobile ? "min-h-[560px]" : "min-h-[400px]"
        )}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
        
        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl border border-amber-500/20 shadow-[inset_0_0_60px_rgba(245,158,11,0.05)]" />

        <div className="relative text-center space-y-6 px-6">
          {/* Icon with glow effect */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-amber-500 blur-2xl opacity-40 scale-150 animate-pulse" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-amber-500/30 shadow-2xl">
              <Swords className="h-14 w-14 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              {t('run.title')}
            </h2>
            <div className="flex items-center justify-center gap-3 text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="font-semibold">5:00</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="font-semibold">{t('run.highestStage')}: {highestStageCleared}</span>
              </div>
            </div>
          </div>

          {canBattle ? (
            <Button
              onClick={() => initializeRun(false)}
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:via-red-400 hover:to-orange-400 text-white font-bold px-12 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] border-0 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              <Play className="h-6 w-6 mr-2" />
              {t('run.start')}
            </Button>
          ) : (
            <div className="text-amber-400 text-sm flex items-center gap-2 bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/30">
              <Zap className="h-5 w-5" />
              {t('team.noTeam')}
            </div>
          )}

          {/* Auto Farm Button */}
          {canBattle && (
            <div className="pt-2">
              {hasAutoFarm ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAutoFarmEnabled(!autoFarmEnabled)}
                  className={cn(
                    "border-2 transition-all duration-300 rounded-xl",
                    autoFarmEnabled 
                      ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]" 
                      : "border-slate-600 text-slate-400 hover:border-purple-500/50 hover:text-purple-300"
                  )}
                >
                  <Bot className="h-5 w-5 mr-2" />
                  {autoFarmEnabled ? t('run.autoFarmOn') : t('run.autoFarmOff')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handlePurchaseAutoFarm}
                  disabled={pokegems < AUTO_FARM_COST}
                  className="border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 rounded-xl transition-all duration-300"
                >
                  <Bot className="h-5 w-5 mr-2" />
                  {t('run.autoFarmPurchase')} ({AUTO_FARM_COST} <img src={pokegemIcon} alt="PokeGems" className="h-4 w-4 inline ml-1" />)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== RUN COMPLETE STATE ====================
  if (battleState === 'run_complete') {
    const finalGems = totalAccumulatedGems + accumulatedGems;
    const finalXPTotal = (() => {
      const finalXP = new Map(totalAccumulatedXP);
      accumulatedXP.forEach((xp, id) => {
        finalXP.set(id, (finalXP.get(id) || 0) + xp);
      });
      return Array.from(finalXP.values()).reduce((a, b) => a + b, 0);
    })();
    const finalEnemies = totalEnemiesDefeated + enemiesDefeated;
    const allDrops = getAllDrops();

    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl",
          isMobile ? "min-h-[560px]" : "min-h-[400px]"
        )}
      >
        {/* Animated Victory Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-pulse" />
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-amber-400/40 animate-pulse"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.3}s`,
                width: `${16 + (i % 3) * 4}px`,
                height: `${16 + (i % 3) * 4}px`,
              }}
            />
          ))}
        </div>
        
        <div className="absolute inset-0 rounded-2xl border border-amber-500/30 shadow-[inset_0_0_80px_rgba(245,158,11,0.1)]" />

        <div className="relative text-center space-y-6 px-6 py-8 max-w-md w-full overflow-y-auto max-h-full">
          {/* Trophy Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 scale-150 animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-600 to-amber-700 p-5 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)]">
              <Trophy className="h-12 w-12 text-amber-100 drop-shadow-lg" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
              {t('run.complete')}
            </h2>
            
            {isNewRecord && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-400/40 animate-pulse">
                <Sparkles className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-bold">{t('run.newRecord')}</span>
              </div>
            )}
            
            {runsCompleted > 0 && (
              <div className="inline-flex items-center gap-2 text-purple-300 text-sm">
                <Bot className="h-4 w-4" />
                <span className="font-semibold">{runsCompleted + 1} {t('run.runsCompleted')}</span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 space-y-4 border border-slate-700/50 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
                <div className="text-slate-400 text-xs font-medium mb-1">{t('run.highestStage')}</div>
                <div className="text-2xl font-black text-white">{highestStageReached}</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
                <div className="text-slate-400 text-xs font-medium mb-1">{t('run.enemiesDefeated')}</div>
                <div className="text-2xl font-black text-white">{finalEnemies}</div>
              </div>
            </div>
            
            <div className="border-t border-slate-700/50 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{t('run.totalGems')}</span>
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30">
                  <img src={pokegemIcon} alt="PokeGems" className="h-5 w-5" />
                  <span className="font-black text-green-300 text-lg">+{finalGems}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{t('run.teamXP')}</span>
                <span className="font-black text-purple-300 text-lg">+{finalXPTotal} XP</span>
              </div>
            </div>
          </div>

          {/* Items Obtained */}
          {(allDrops.length > 0 || accumulatedPackDrops.length > 0) && (
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 shadow-xl">
              <h3 className="text-amber-300 font-bold text-sm mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('run.itemsObtained')}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {allDrops.map((drop, idx) => (
                  <div 
                    key={`item-${drop.itemId}-${idx}`}
                    className="relative flex flex-col items-center p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:border-amber-500/50 transition-all group"
                  >
                    <img 
                      src={drop.iconUrl} 
                      alt={drop.name}
                      className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg">
                      {drop.quantity}
                    </span>
                    <span className="text-slate-400 text-[10px] mt-1 text-center">
                      {drop.name}
                    </span>
                  </div>
                ))}
                {accumulatedPackDrops.map((pack, idx) => (
                  <div 
                    key={`pack-${pack.packId}-${idx}`}
                    className="relative flex flex-col items-center p-2 rounded-lg bg-slate-800/80 border border-violet-500/40 hover:border-violet-400/60 transition-all group"
                  >
                    <img 
                      src={PACK_ARTWORK[pack.packId] || '/packs/brasacomum.png'} 
                      alt={pack.packName}
                      className="w-10 h-14 object-contain group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg">
                      {pack.quantity}
                    </span>
                    <span className="text-slate-400 text-[10px] mt-1 text-center line-clamp-1">
                      {pack.packName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleCollectRewards}
            disabled={isCollecting}
            size="lg"
            className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-amber-950 font-black px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] border-0 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            <Gift className="h-6 w-6 mr-2" />
            {isCollecting ? 'Saving...' : t('run.collectAll')}
          </Button>
        </div>
      </div>
    );
  }

  // ==================== FIGHTING / STAGE COMPLETE STATE ====================
  return (
    <div
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden",
        isMobile ? "min-h-[560px]" : "min-h-[400px]"
      )}
    >
      {/* Battle Arena Background */}
      <div 
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${battleArenaBg})`
        }}
      />
      
      {/* Overlay para melhorar contraste dos elementos */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-red-500/20 shadow-[inset_0_0_60px_rgba(220,38,38,0.05)]" />
      
      {/* ========== TOP HEADER ========== */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-20",
        isMobile ? "p-2.5" : "p-3"
      )}>
        <div className={cn(
          "flex items-center justify-between gap-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10",
          isMobile ? "px-2.5 py-2.5" : "px-3 py-2"
        )}>
          {/* Stage/Wave Info */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-1.5 rounded-lg shadow-lg">
              <Swords className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div>
              <div className={cn(
                "font-black text-white tracking-wide",
                isMobile ? "text-sm" : "text-lg"
              )}>
                {t('battle.stage', { number: currentStage })}
              </div>
              <div className={cn(
                "text-slate-400 font-medium",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                {t('battle.wave', { current: currentWave, total: TOTAL_WAVES })}
              </div>
            </div>
          </div>
          
          {/* Right side stats */}
          <div className="flex items-center gap-1.5">
            {/* End Run Button */}
            {(battleState === 'fighting' || battleState === 'stage_complete') && (
              <Button
                onClick={handleEndRunManual}
                size="sm"
                className={cn(
                  "bg-red-600/80 hover:bg-red-500 border-0 text-white font-bold transition-all rounded-lg",
                  isMobile ? "px-2 py-1 h-7 text-[10px]" : "px-3 text-xs"
                )}
              >
                <StopCircle className={cn(isMobile ? "h-3 w-3" : "h-4 w-4 mr-1")} />
                {!isMobile && t('run.endRun')}
              </Button>
            )}
            
            {/* Auto-Farm Indicator */}
            {runsCompleted > 0 && !isMobile && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                <Bot className="h-3 w-3" />
                {runsCompleted}
              </div>
            )}
            
            {/* Accumulated Gems */}
            <div className={cn(
              "flex items-center gap-1 rounded-lg bg-green-500/20 text-green-300 font-bold border border-green-500/30",
              isMobile ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
            )}>
              <img src={pokegemIcon} alt="PokeGems" className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              {totalAccumulatedGems + accumulatedGems}
            </div>
            
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-1 rounded-lg font-mono font-bold border transition-all",
              timeRemaining < 60 
                ? "bg-red-500/30 text-red-300 border-red-500/50 animate-pulse" 
                : "bg-slate-800/60 text-white border-slate-700/50",
              isMobile ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
            )}>
              <Clock className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* ========== BATTLE ARENA CENTER ========== */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isMobile ? "pt-20 pb-32 px-3" : "pt-8 pb-24"
      )}>
        {/* Floating Damage Numbers */}
        {damageNumbers.map(dmg => (
          <div
            key={dmg.id}
            className={cn(
              "absolute font-black pointer-events-none z-30",
              dmg.isTeamHit ? "animate-team-hit text-4xl" : "animate-damage-float text-xl",
              dmg.isCrit && "text-2xl",
              dmg.isHeal && "text-emerald-400",
              dmg.isEffect && "text-purple-400",
              dmg.isTeamHit && (dmg.isCrit ? "text-yellow-300" : "text-red-500"),
              !dmg.isTeamHit && !dmg.isHeal && !dmg.isEffect && dmg.effectiveness === 'super' && "text-green-400",
              !dmg.isTeamHit && !dmg.isHeal && !dmg.isEffect && dmg.effectiveness === 'normal' && "text-white",
              !dmg.isTeamHit && !dmg.isHeal && !dmg.isEffect && dmg.effectiveness === 'weak' && "text-orange-400",
              !dmg.isTeamHit && !dmg.isHeal && !dmg.isEffect && dmg.effectiveness === 'none' && "text-slate-500"
            )}
            style={{ 
              left: `${dmg.x}%`, 
              top: `${dmg.y}%`,
              textShadow: dmg.isTeamHit && dmg.isCrit
                ? '0 0 20px rgba(250,204,21,0.8), 0 4px 8px rgba(0,0,0,0.9)' 
                : dmg.isTeamHit
                ? '0 0 12px rgba(239,68,68,0.6), 0 4px 8px rgba(0,0,0,0.9)'
                : '0 2px 10px rgba(0,0,0,0.9)',
            }}
          >
            {dmg.effectIcon && <span className="mr-1">{dmg.effectIcon}</span>}
            {dmg.isHeal ? `+${dmg.value}` : dmg.value > 0 ? `${dmg.value}` : ''}
          </div>
        ))}

        {/* Enemy Display - Centered in the marked circle */}
        {currentEnemy && battleState === 'fighting' && (
          <div className="z-20">
            <EnemyDisplay enemy={currentEnemy} isMobile={isMobile} />
          </div>
        )}
        
        {/* Stage Complete Display */}
        {battleState === 'stage_complete' && (
          <div className="text-center space-y-6 px-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 scale-150 animate-pulse" />
              <div className={cn(
                "relative font-black bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent flex items-center justify-center gap-3",
                isMobile ? "text-2xl" : "text-4xl"
              )}>
                <Sparkles className={cn("text-amber-400", isMobile ? "h-6 w-6" : "h-10 w-10")} />
                {t('battle.stageComplete', { stage: currentStage })}
                <Sparkles className={cn("text-amber-400", isMobile ? "h-6 w-6" : "h-10 w-10")} />
              </div>
            </div>
            
            <div className={cn(
              "flex justify-center flex-wrap",
              isMobile ? "gap-2" : "gap-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10",
                isMobile ? "px-3 py-2" : "px-5 py-3"
              )}>
                <img src={pokegemIcon} alt="PokeGems" className={cn(isMobile ? "h-5 w-5" : "h-7 w-7")} />
                <span className={cn("font-black text-white", isMobile ? "text-lg" : "text-2xl")}>
                  {totalAccumulatedGems + accumulatedGems}
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10",
                isMobile ? "px-3 py-2" : "px-5 py-3"
              )}>
                <Clock className={cn("text-slate-400", isMobile ? "h-5 w-5" : "h-7 w-7")} />
                <span className={cn("font-black text-white", isMobile ? "text-lg" : "text-2xl")}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              {runsCompleted > 0 && (
                <div className={cn(
                  "flex items-center gap-2 bg-purple-500/20 rounded-xl border border-purple-500/30",
                  isMobile ? "px-3 py-2" : "px-5 py-3"
                )}>
                  <Bot className={cn("text-purple-400", isMobile ? "h-5 w-5" : "h-7 w-7")} />
                  <span className={cn("font-black text-purple-300", isMobile ? "text-lg" : "text-2xl")}>
                    {runsCompleted}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Drops Panel */}
      {(battleState === 'fighting' || battleState === 'stage_complete') && (getAllDrops().length > 0 || accumulatedPackDrops.length > 0) && (
        <div className={cn(
          "absolute z-20",
          isMobile ? "bottom-32 right-2 w-36" : "bottom-32 right-4 w-48"
        )}>
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-b border-amber-500/30">
              <Package className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300 font-bold text-xs">{t('run.drops')}</span>
            </div>
            <div className="p-2 max-h-28 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {getAllDrops().map((drop, idx) => (
                  <div 
                    key={`item-${drop.itemId}-${idx}`}
                    className="relative flex flex-col items-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 hover:border-amber-500/50 transition-all group"
                  >
                    <img 
                      src={drop.iconUrl} 
                      alt={drop.name}
                      className={cn(
                        "object-contain group-hover:scale-110 transition-transform",
                        isMobile ? "w-5 h-5" : "w-7 h-7"
                      )}
                    />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[12px] text-center">
                      {drop.quantity}
                    </span>
                  </div>
                ))}
                {accumulatedPackDrops.map((pack, idx) => (
                  <div 
                    key={`pack-${pack.packId}-${idx}`}
                    className="relative flex flex-col items-center p-1.5 rounded-lg bg-slate-900/60 border border-violet-500/50 hover:border-violet-400/70 transition-all group"
                  >
                    <img 
                      src={PACK_ARTWORK[pack.packId] || '/packs/brasacomum.png'} 
                      alt={pack.packName}
                      className={cn(
                        "object-contain group-hover:scale-110 transition-transform",
                        isMobile ? "w-5 h-7" : "w-7 h-9"
                      )}
                    />
                    <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[12px] text-center">
                      {pack.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== BOTTOM PANEL ========== */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-20",
        isMobile ? "p-2.5" : "p-3"
      )}>
        {/* Team Stats */}
        <div className={cn(
          "bg-black/40 backdrop-blur-md rounded-xl border border-white/10",
          isMobile ? "px-3 py-2 mb-2" : "px-4 py-3 mb-3"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 p-1.5 rounded-lg">
                  <Swords className={cn("text-white", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                </div>
                <span className={cn("text-white font-black", isMobile ? "text-base" : "text-xl")}>
                  {Math.round(totalDamage)}
                </span>
              </div>
              {!isMobile && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="text-xs">@ {teamAttackStats.avgSpeed.toFixed(2)}s</span>
                  <span className="bg-slate-800/60 px-2 py-0.5 rounded text-xs font-semibold">
                    {activeTeamCount}/{teamState.length}
                  </span>
                </div>
              )}
            </div>
            
            {stunnedPokemon.length > 0 && (
              <div className={cn("flex items-center gap-1", isMobile ? "text-[10px]" : "text-xs")}>
                <Zap className="h-3 w-3 text-yellow-400" />
                {stunnedPokemon.map(p => (
                  <div key={p.id} className="flex items-center gap-0.5 bg-yellow-500/20 px-1.5 py-0.5 rounded border border-yellow-500/30">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`}
                      className={cn("pixelated", isMobile ? "w-4 h-4" : "w-5 h-5")}
                      alt={p.name}
                    />
                    <span className="text-yellow-300 font-bold">{p.stunRemaining.toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stage Complete Actions */}
        {battleState === 'stage_complete' && (
          <div className={cn(
            "flex items-center justify-center flex-wrap gap-2"
          )}>
            {currentStage < TOTAL_STAGES && (
              <Button
                onClick={goToNextStage}
                size={isMobile ? "default" : "lg"}
                className={cn(
                  "relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-amber-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border-0 transition-all rounded-xl",
                  isMobile ? "flex-1 px-4" : "px-8"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                {t('battle.nextStage')}
                <ChevronRight className={cn(isMobile ? "h-4 w-4 ml-1" : "h-5 w-5 ml-2")} />
              </Button>
            )}

            {hasAutoFarm ? (
              <Button
                variant="outline"
                size={isMobile ? "default" : "lg"}
                onClick={() => setAutoFarmEnabled(!autoFarmEnabled)}
                className={cn(
                  "border-2 transition-all rounded-xl",
                  autoFarmEnabled 
                    ? "bg-purple-500/20 border-purple-400 text-purple-300" 
                    : "border-slate-600 text-slate-400 hover:border-purple-500/50",
                  isMobile && "flex-1"
                )}
              >
                <Bot className={cn(isMobile ? "h-4 w-4 mr-1" : "h-5 w-5 mr-2")} />
                {autoFarmEnabled ? t('run.autoFarmOn') : t('run.autoFarmOff')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size={isMobile ? "default" : "lg"}
                onClick={handlePurchaseAutoFarm}
                disabled={pokegems < AUTO_FARM_COST}
                className={cn(
                  "border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 rounded-xl",
                  isMobile && "flex-1"
                )}
              >
                <Bot className={cn(isMobile ? "h-4 w-4 mr-1" : "h-5 w-5 mr-2")} />
                {isMobile ? "Auto" : t('run.autoFarmPurchase')} ({AUTO_FARM_COST})
              </Button>
            )}

            <Button
              variant="outline"
              size={isMobile ? "default" : "lg"}
              onClick={handleEndRunManual}
              className={cn(
                "border-2 border-red-500/50 text-red-300 hover:bg-red-500/20 rounded-xl",
                isMobile && "flex-1"
              )}
            >
              {t('run.endRun') || 'End Run'}
            </Button>
            
            {currentStage >= TOTAL_STAGES && (
              <p className={cn("text-amber-400 w-full text-center", isMobile ? "text-xs" : "text-sm")}>
                🏆 {t('battle.maxStageReached')}
              </p>
            )}
          </div>
        )}

        {/* Fighting State spacer */}
        {battleState === 'fighting' && (
          <div className="h-2" />
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes damage-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          40% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-35px) scale(0.8); }
        }
        .animate-damage-float {
          animation: damage-float 0.5s ease-out forwards;
        }
        @keyframes team-hit-float {
          0% { opacity: 1; transform: translateY(0) scale(1.3); }
          30% { opacity: 1; transform: translateY(-15px) scale(1.5); }
          100% { opacity: 0; transform: translateY(-30px) scale(1); }
        }
        .animate-team-hit {
          animation: team-hit-float 0.5s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-6px) rotate(-1deg); }
          40% { transform: translateX(6px) rotate(1deg); }
          60% { transform: translateX(-4px) rotate(0deg); }
          80% { transform: translateX(4px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out;
        }
        @keyframes enemy-spawn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { opacity: 1; transform: scale(1.05) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-enemy-spawn {
          animation: enemy-spawn 0.15s ease-out forwards;
        }
        @keyframes enemy-death {
          0% { opacity: 1; transform: scale(1); filter: brightness(1); }
          50% { opacity: 0.8; transform: scale(1.1); filter: brightness(2); }
          100% { opacity: 0; transform: scale(0.3); filter: brightness(3); }
        }
        .animate-enemy-death {
          animation: enemy-death 0.2s ease-out forwards;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ==================== ENEMY DISPLAY COMPONENT ====================
const EnemyDisplay = ({ enemy, isMobile }: { enemy: EnemyState; isMobile: boolean }) => {
  const { t } = useTranslation('trainer');
  const hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy.pokemonId}.png`;
  const typeColor = TYPE_COLORS[enemy.type] || '#A8A878';
  const isLowHp = hpPercent < 30;

  return (
    <div className={cn("relative flex flex-col items-center", isMobile ? "max-w-full px-2" : "") }>
      {/* Boss/Mini-boss Label */}
      {(enemy.isBoss || enemy.isMiniBoss) && (
        <div className="relative mb-3 z-10">
          {/* Glow effect backdrop */}
          <div className={cn(
            "absolute inset-0 blur-xl opacity-60 rounded-full animate-pulse",
            enemy.isBoss && "bg-red-500",
            enemy.isMiniBoss && "bg-orange-500"
          )} />
          
          {/* Main tag */}
          <div className={cn(
            "relative px-4 py-1.5 rounded-full font-black uppercase tracking-wider backdrop-blur-sm border-2 shadow-2xl transition-all duration-300 hover:scale-105",
            isMobile ? "text-[10px]" : "text-xs",
            enemy.isBoss && "bg-gradient-to-br from-red-600 via-red-500 to-red-700 text-white border-red-300/60 shadow-red-500/50",
            enemy.isMiniBoss && "bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 text-white border-orange-300/60 shadow-orange-500/50"
          )}
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            boxShadow: enemy.isBoss 
              ? '0 0 30px rgba(239, 68, 68, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 0 30px rgba(249, 115, 22, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn("text-lg", isMobile && "text-base")}>
                {enemy.isBoss && '👑'}
                {enemy.isMiniBoss && '⚔️'}
              </span>
              <span className="font-black">
                {enemy.isBoss && t('battle.boss')}
                {enemy.isMiniBoss && t('battle.miniBoss')}
              </span>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      )}

      {/* Enemy Name */}
      <h3 className={cn(
        "font-black text-white tracking-wide text-center text-balance",
        isMobile ? "text-2xl mb-2 max-w-[16rem]" : "text-3xl mb-1"
      )}>
        {enemy.name}
      </h3>
      
      {/* Type Badge */}
      <div 
        className={cn(
          "px-3 py-1 rounded-full font-bold text-white shadow-lg border border-white/20 text-center",
          isMobile ? "text-[10px] mb-4 max-w-[15rem] leading-tight" : "text-xs mb-3"
        )}
        style={{ 
          backgroundColor: typeColor,
          boxShadow: `0 0 15px ${typeColor}40`
        }}
      >
        {enemy.type.toUpperCase()}
        {enemy.secondaryType && ` / ${enemy.secondaryType.toUpperCase()}`}
      </div>

      {/* Active Effects */}
      {enemy.activeEffects.length > 0 && (
        <div className={cn("flex gap-1.5 flex-wrap justify-center", isMobile ? "mb-4 max-w-56" : "mb-3") }>
          {enemy.activeEffects.map((ae, i) => (
            <div 
              key={`${ae.effect.id}-${i}`}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border",
                isMobile ? "text-[10px]" : "text-xs"
              )}
              style={{ 
                borderColor: ae.effect.color,
                boxShadow: `0 0 10px ${ae.effect.color}30`
              }}
            >
              <span style={{ filter: `drop-shadow(0 0 6px ${ae.effect.color})` }}>
                {ae.effect.icon}
              </span>
              {!isMobile && <span className="text-white font-semibold">{t(`effects.${ae.effect.id}.name`)}</span>}
              {ae.stacks > 1 && <span className="text-amber-400 font-bold">x{ae.stacks}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Large Sprite with Glow */}
      <div className={cn(
        "relative",
        enemy.isShaking && "animate-shake",
        enemy.isDying ? "animate-enemy-death" : "animate-enemy-spawn"
      )}>
        {/* Glow behind sprite */}
        <div 
          className={cn(
            "absolute inset-0 blur-2xl opacity-40 rounded-full transition-opacity duration-150",
            enemy.isBoss && "bg-red-500 scale-110",
            enemy.isMiniBoss && "bg-orange-500",
            enemy.isChallenger && "bg-purple-500",
            !enemy.isBoss && !enemy.isMiniBoss && !enemy.isChallenger && "bg-slate-400",
            isLowHp && "animate-pulse"
          )} 
        />
        <img 
          src={spriteUrl}
          alt={enemy.name}
          className={cn(
            "relative pixelated drop-shadow-2xl transition-all duration-200",
            isMobile ? "w-40 h-40" : "w-60 h-60",
            enemy.isBoss && "scale-125",
            enemy.isMiniBoss && "scale-110",
            isLowHp && !enemy.isDying && "animate-pulse"
          )}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* HP Bar */}
      <div className={cn("mt-5", isMobile ? "w-full max-w-[17rem]" : "w-80")}>
        <div className={cn(
          "relative bg-black/60 backdrop-blur-sm rounded-full overflow-hidden border-2 border-white/20 shadow-xl",
          isMobile ? "h-6" : "h-7"
        )}>
          {/* HP Fill */}
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-200",
              hpPercent > 50 && "bg-gradient-to-r from-green-600 to-green-400",
              hpPercent <= 50 && hpPercent > 25 && "bg-gradient-to-r from-yellow-600 to-yellow-400",
              hpPercent <= 25 && "bg-gradient-to-r from-red-600 to-red-400",
              isLowHp && "animate-pulse"
            )}
            style={{ width: `${Math.max(0, hpPercent)}%` }}
          />
          {/* Shine effect on HP bar */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"
            style={{ width: `${Math.max(0, hpPercent)}%` }}
          />
          {/* HP Text */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center font-black text-white",
            isMobile ? "text-xs" : "text-sm"
          )}
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {Math.floor(enemy.currentHp).toLocaleString()} / {enemy.maxHp.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
