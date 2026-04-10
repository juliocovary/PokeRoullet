import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  TRAINER_SECRET_POKEMON_BY_REGION,
  getTrainerBannerConfig,
  getTrainerBannerRotationStart,
  generateTrainerBannerPokemon,
  type TrainerBannerRegion,
  rollRandomStat,
  type TrainerPokemon,
  type StatGrade,
} from '@/data/trainerPokemonPool';

export interface BannerSlot {
  pokemon: TrainerPokemon;
  position: number;
}

export interface SummonResult {
  pokemon: TrainerPokemon;
  statDamage: StatGrade;
  statSpeed: StatGrade;
  statEffect: StatGrade;
  isNew: boolean;
  autoDeleted?: boolean;
}

const INVENTORY_LIMIT = 50;
const AUTO_DELETE_STARS = [1, 2, 3, 4] as const;
type AutoDeleteStar = (typeof AUTO_DELETE_STARS)[number];

const isAutoDeleteStar = (star: number): star is AutoDeleteStar =>
  AUTO_DELETE_STARS.includes(star as AutoDeleteStar);

export const useBanner = (
  onDataChange?: () => Promise<void>,
  bannerRegion: TrainerBannerRegion = 'kanto'
) => {
  const { user } = useAuth();
  const { t } = useTranslation('trainer');
  
  const [bannerSlots, setBannerSlots] = useState<BannerSlot[]>([]);
  const [rotationTimeLeft, setRotationTimeLeft] = useState(0);
  const [isSummoning, setIsSummoning] = useState(false);
  const [lastSummonResult, setLastSummonResult] = useState<SummonResult[] | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [autoDeleteStars, setAutoDeleteStars] = useState<AutoDeleteStar[]>([]);
  const bannerConfig = getTrainerBannerConfig(bannerRegion);

  useEffect(() => {
    if (!user) {
      setAutoDeleteStars([]);
      return;
    }

    const storageKey = `trainer:autoDeleteStars:${user.id}`;
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      setAutoDeleteStars([]);
      return;
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        setAutoDeleteStars([]);
        return;
      }

      const sanitized = parsed.filter((star): star is AutoDeleteStar =>
        typeof star === 'number' && isAutoDeleteStar(star)
      );

      setAutoDeleteStars(Array.from(new Set(sanitized)).sort((a, b) => b - a));
    } catch {
      setAutoDeleteStars([]);
    }
  }, [user]);

  const toggleAutoDeleteStar = useCallback((star: number) => {
    if (!user || !isAutoDeleteStar(star)) return;

    const storageKey = `trainer:autoDeleteStars:${user.id}`;

    setAutoDeleteStars((current) => {
      const next = current.includes(star)
        ? current.filter((value) => value !== star)
        : [...current, star].sort((a, b) => b - a);

      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [user]);

  const shouldAutoDeletePokemon = useCallback((pokemon: TrainerPokemon) => {
    return isAutoDeleteStar(pokemon.starRating) && autoDeleteStars.includes(pokemon.starRating);
  }, [autoDeleteStars]);

  const refreshBannerState = useCallback((timestamp = Date.now()) => {
    const bannerPokemon = generateTrainerBannerPokemon(bannerRegion, timestamp);
    const slots = bannerPokemon.map((pokemon, index) => ({
      pokemon,
      position: index,
    }));

    setBannerSlots(slots);

    const rotationStart = getTrainerBannerRotationStart(timestamp, bannerConfig.rotationMinutes);
    const rotationMs = bannerConfig.rotationMinutes * 60 * 1000;
    const rotationTimeRemaining = Math.max(0, Math.floor((rotationStart + rotationMs - timestamp) / 1000));
    setRotationTimeLeft(rotationTimeRemaining);
    setLastSummonResult(null);
    setIsLoadingBanner(false);
  }, [bannerRegion, bannerConfig.rotationMinutes]);

  const loadBanner = useCallback(async () => {
    try {
      setIsLoadingBanner(true);
      refreshBannerState();
    } catch (error) {
      console.error('Error loading banner:', error);
      setIsLoadingBanner(false);
    }
  }, [refreshBannerState]);

  // Initialize banner and rotation timer
  useEffect(() => {
    loadBanner();

    // Update timer every second
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const rotationStart = getTrainerBannerRotationStart(currentTime, bannerConfig.rotationMinutes);
      const rotationMs = bannerConfig.rotationMinutes * 60 * 1000;
      const timeUntilRotation = rotationStart + rotationMs - currentTime;
      
      if (timeUntilRotation <= 1000 && timeUntilRotation > 0) {
        // Rotation is about to happen, refresh banner
        setTimeout(() => refreshBannerState(), 1500);
      }
      
      setRotationTimeLeft(Math.floor(Math.max(0, timeUntilRotation) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [bannerConfig.rotationMinutes, loadBanner, refreshBannerState]);

  // NOTE: Realtime subscription removed for performance optimization
  // The banner already rotates every 30 minutes via edge function
  // The local timer handles the rotation display, no need for realtime updates

  // Perform summon based on banner chances
  const performSummon = useCallback((): TrainerPokemon => {
    const roll = Math.random() * 100;
    const secretPokemon = TRAINER_SECRET_POKEMON_BY_REGION[bannerRegion]?.[0];
    
    // 0.25% for 6 star (region secret - always available but not in banner)
    if (roll < 0.25) {
      return secretPokemon ?? bannerSlots[0]?.pokemon ?? TRAINER_SECRET_POKEMON_BY_REGION.kanto[0];
    }
    
    // Get the banner pokemon for weighted selection
    const bannerPokemon = bannerSlots.map(slot => slot.pokemon);
    
    // Calculate total chances and select
    // Remaining 99.75% distributed: 1★=58.75%, 2★=20%, 3★=14%, 4★=5%, 5★=2%
    const adjustedRoll = (roll - 0.25) / 99.75 * 100;
    
    if (adjustedRoll < 58.75) {
      // 1-star (58.75% total)
      const oneStarPokemon = bannerPokemon.filter(p => p.starRating === 1);
      return oneStarPokemon[Math.floor(Math.random() * oneStarPokemon.length)] || bannerPokemon[0];
    } else if (adjustedRoll < 78.75) {
      // 2-star (20% total)
      const twoStarPokemon = bannerPokemon.filter(p => p.starRating === 2);
      return twoStarPokemon[Math.floor(Math.random() * twoStarPokemon.length)] || bannerPokemon[0];
    } else if (adjustedRoll < 92.75) {
      // 3-star (14% total)
      const threeStarPokemon = bannerPokemon.filter(p => p.starRating === 3);
      return threeStarPokemon[Math.floor(Math.random() * threeStarPokemon.length)] || bannerPokemon[0];
    } else if (adjustedRoll < 97.75) {
      // 4-star (5%)
      const fourStarPokemon = bannerPokemon.filter(p => p.starRating === 4);
      return fourStarPokemon[0] || bannerPokemon[0];
    } else {
      // 5-star (2%)
      const fiveStarPokemon = bannerPokemon.filter(p => p.starRating === 5);
      return fiveStarPokemon[0] || bannerPokemon[0];
    }
  }, [bannerRegion, bannerSlots]);

  const getCurrencyLabel = useCallback(() => {
    return bannerConfig.currency === 'pokegems'
      ? t('currency.pokegems')
      : t('currency.pokecoins');
  }, [bannerConfig.currency, t]);

  // Single summon
  const summonSingle = useCallback(async (currentCurrency: number): Promise<SummonResult | null> => {
    if (!user) return null;
    
    if (currentCurrency < bannerConfig.costSingle) {
      toast({
        title: t('banner.insufficientCurrency', { currency: getCurrencyLabel() }),
        variant: 'destructive',
      });
      return null;
    }
    
    if (bannerSlots.length === 0) {
      toast({
        title: 'Error',
        description: 'Banner not loaded yet',
        variant: 'destructive',
      });
      return null;
    }
    
    // Pre-roll result so we can decide if inventory space is needed.
    const pokemon = performSummon();
    const shouldAutoDelete = shouldAutoDeletePokemon(pokemon);

    if (!shouldAutoDelete) {
      // Check inventory limit only for units that will be kept.
      const { count, error: countError } = await supabase
        .from('trainer_pokemon')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error checking inventory:', countError);
      } else if (count !== null && count >= INVENTORY_LIMIT) {
        toast({
          title: t('inventory.full'),
          description: t('inventory.fullDescription', { limit: INVENTORY_LIMIT }),
          variant: 'destructive',
        });
        return null;
      }
    }

    setIsSummoning(true);

    try {
      const statDamage = rollRandomStat();
      const statSpeed = rollRandomStat();
      const statEffect = rollRandomStat();

      const currencyField = bannerConfig.currency;
      let isNew = false;

      if (shouldAutoDelete) {
        const { error: deductCurrencyError } = await supabase
          .from('profiles')
          .update({ [currencyField]: currentCurrency - bannerConfig.costSingle })
          .eq('user_id', user.id);

        if (deductCurrencyError) throw deductCurrencyError;
      } else {
        const [deductCurrencyResult, existingPokemonResult] = await Promise.all([
          supabase
            .from('profiles')
            .update({ [currencyField]: currentCurrency - bannerConfig.costSingle })
            .eq('user_id', user.id),
          supabase
            .from('trainer_pokemon')
            .select('id')
            .eq('user_id', user.id)
            .eq('pokemon_id', pokemon.id)
            .maybeSingle(),
        ]);

        if (deductCurrencyResult.error) throw deductCurrencyResult.error;

        isNew = !existingPokemonResult.data;

        const { error: insertError } = await supabase
          .from('trainer_pokemon')
          .insert({
            user_id: user.id,
            pokemon_id: pokemon.id,
            pokemon_name: pokemon.name,
            pokemon_type: pokemon.type,
            secondary_type: pokemon.secondaryType,
            star_rating: pokemon.starRating,
            level: 1,
            experience: 0,
            power: pokemon.basePower,
            stat_damage: statDamage,
            stat_speed: statSpeed,
            stat_effect: statEffect,
            is_evolved: !pokemon.isNatural,
            evolved_from: pokemon.evolvesFrom,
          });

        if (insertError) throw insertError;
      }
      
      const result: SummonResult = {
        pokemon,
        statDamage,
        statSpeed,
        statEffect,
        isNew,
        autoDeleted: shouldAutoDelete,
      };
      
      setLastSummonResult([result]);

      if (onDataChange) {
        void onDataChange();
      }

      // History write is non-critical for reveal timing.
      void supabase
        .from('banner_history')
        .insert({
          user_id: user.id,
          pokemon_obtained: pokemon.name,
          pokemon_id: pokemon.id,
          star_rating: pokemon.starRating,
          stat_damage: statDamage,
          stat_speed: statSpeed,
          stat_effect: statEffect,
          cost_type: bannerConfig.currency,
          cost_amount: bannerConfig.costSingle,
        });
      
      // Refresh trainer state immediately so the inventory and balances update after the summon.
      
      return result;
    } catch (error) {
      console.error('Error performing summon:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform summon',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSummoning(false);
    }
  }, [
    user,
    performSummon,
    t,
    bannerSlots.length,
    onDataChange,
    bannerConfig,
    getCurrencyLabel,
    shouldAutoDeletePokemon,
  ]);

  // Multi summon (5x)
  const summonMulti = useCallback(async (currentCurrency: number): Promise<SummonResult[] | null> => {
    if (!user) return null;
    if (currentCurrency < bannerConfig.costMulti) {
      toast({
        title: t('banner.insufficientCurrency', { currency: getCurrencyLabel() }),
        variant: 'destructive',
      });
      return null;
    }

    if (bannerSlots.length === 0) {
      toast({
        title: 'Error',
        description: 'Banner not loaded yet',
        variant: 'destructive',
      });
      return null;
    }

    const pulls = Array.from({ length: 5 }).map(() => {
      const pokemon = performSummon();
      return {
        pokemon,
        statDamage: rollRandomStat(),
        statSpeed: rollRandomStat(),
        statEffect: rollRandomStat(),
        autoDeleted: shouldAutoDeletePokemon(pokemon),
      };
    });

    const keptPulls = pulls.filter((pull) => !pull.autoDeleted);

    const { count, error: countError } = await supabase
      .from('trainer_pokemon')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error checking inventory:', countError);
    } else if (count !== null && count + keptPulls.length > INVENTORY_LIMIT) {
      toast({
        title: t('inventory.full'),
        description: t('inventory.fullDescription', { limit: INVENTORY_LIMIT }),
        variant: 'destructive',
      });
      return null;
    }

    setIsSummoning(true);

    try {
      const currencyField = bannerConfig.currency;
      const { error: coinError } = await supabase
        .from('profiles')
        .update({ [currencyField]: currentCurrency - bannerConfig.costMulti })
        .eq('user_id', user.id);

      if (coinError) throw coinError;

      const keptPokemonIds = Array.from(new Set(keptPulls.map((pull) => pull.pokemon.id)));
      let alreadyOwnedIds = new Set<number>();

      if (keptPokemonIds.length > 0) {
        const { data: existingPokemonRows, error: existingError } = await supabase
          .from('trainer_pokemon')
          .select('pokemon_id')
          .eq('user_id', user.id)
          .in('pokemon_id', keptPokemonIds);

        if (existingError) throw existingError;

        alreadyOwnedIds = new Set((existingPokemonRows || []).map((row) => row.pokemon_id));
      }

      const seenInBatch = new Set<number>();

      const results: SummonResult[] = pulls.map((pull) => {
        if (pull.autoDeleted) {
          return {
            pokemon: pull.pokemon,
            statDamage: pull.statDamage,
            statSpeed: pull.statSpeed,
            statEffect: pull.statEffect,
            isNew: false,
            autoDeleted: true,
          };
        }

        const isNew = !alreadyOwnedIds.has(pull.pokemon.id) && !seenInBatch.has(pull.pokemon.id);
        seenInBatch.add(pull.pokemon.id);

        return {
          pokemon: pull.pokemon,
          statDamage: pull.statDamage,
          statSpeed: pull.statSpeed,
          statEffect: pull.statEffect,
          isNew,
          autoDeleted: false,
        };
      });

      const trainerRows = results
        .filter((result) => !result.autoDeleted)
        .map((result) => ({
          user_id: user.id,
          pokemon_id: result.pokemon.id,
          pokemon_name: result.pokemon.name,
          pokemon_type: result.pokemon.type,
          secondary_type: result.pokemon.secondaryType,
          star_rating: result.pokemon.starRating,
          level: 1,
          experience: 0,
          power: result.pokemon.basePower,
          stat_damage: result.statDamage,
          stat_speed: result.statSpeed,
          stat_effect: result.statEffect,
          is_evolved: !result.pokemon.isNatural,
          evolved_from: result.pokemon.evolvesFrom,
        }));

      if (trainerRows.length > 0) {
        const { error: multiInsertError } = await supabase
          .from('trainer_pokemon')
          .insert(trainerRows);

        if (multiInsertError) throw multiInsertError;
      }

      setLastSummonResult(results);

      if (onDataChange) {
        void onDataChange();
      }

      const historyRows = results.map((result) => ({
        user_id: user.id,
        pokemon_obtained: result.pokemon.name,
        pokemon_id: result.pokemon.id,
        star_rating: result.pokemon.starRating,
        stat_damage: result.statDamage,
        stat_speed: result.statSpeed,
        stat_effect: result.statEffect,
        cost_type: bannerConfig.currency,
        cost_amount: bannerConfig.costMulti / 5,
      }));

      void supabase
        .from('banner_history')
        .insert(historyRows);

      return results;
    } catch (error) {
      console.error('Error performing multi summon:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform multi summon',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSummoning(false);
    }
  }, [
    user,
    performSummon,
    t,
    bannerSlots.length,
    onDataChange,
    bannerConfig,
    getCurrencyLabel,
    shouldAutoDeletePokemon,
  ]);

  // Format time for display
  const formatTimeLeft = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const clearSummonResult = useCallback(() => {
    setLastSummonResult(null);
  }, []);

  return {
    bannerSlots,
    rotationTimeLeft,
    rotationTimeFormatted: formatTimeLeft(rotationTimeLeft),
    isSummoning,
    isLoadingBanner,
    lastSummonResult,
    autoDeleteStars,
    toggleAutoDeleteStar,
    summonSingle,
    summonMulti,
    clearSummonResult,
    refreshBanner: loadBanner,
    SUMMON_COST_SINGLE: bannerConfig.costSingle,
    SUMMON_COST_MULTI: bannerConfig.costMulti,
    activeBannerRegion: bannerRegion,
    activeBannerConfig: bannerConfig,
  };
};