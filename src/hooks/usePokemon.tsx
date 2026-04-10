import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useMissions } from './useMissions';
import { useAchievements } from './useAchievements';
import { fetchSharedProfile, subscribeSharedProfile, updateSharedProfileSnapshot } from './profileCache';
import { UNOVA_POKEMON } from '@/data/unovaPokemon';
import { KALOS_POKEMON } from '@/data/kalosPokemon';
import { ALOLA_POKEMON } from '@/data/alolaPokemon';

// Helper function to update launch event progress
const updateLaunchEventProgress = async (userId: string, category: string, increment: number = 1) => {
  const { data, error } = await supabase.rpc('update_launch_event_progress', {
    p_user_id: userId,
    p_category: category,
    p_increment: increment,
  });
  
  if (error) {
    console.error('[LAUNCH_EVENT] Error updating progress:', error);
  } else {
    console.log('[LAUNCH_EVENT] Progress updated:', { category, increment, data });
  }
};

// XP por raridade
const XP_BY_RARITY: Record<string, number> = {
  common: 20,
  uncommon: 25,
  rare: 40,
  pseudo: 75,
  starter: 100,
  legendary: 500,
  secret: 2500
};

// Calcular probabilidades ajustadas com base na sorte
const calculateAdjustedProbabilities = (luckMultiplier: number) => {
  const baseChances: Record<string, number> = {
    common: 0.65,
    uncommon: 0.25,
    rare: 0.10,
    pseudo: 0.01,
    starter: 0.005,
    legendary: 0.001,
    secret: 0.0001
  };
  
  // Raridades que aumentam com sorte
  const increasedRarities = ['rare', 'pseudo', 'starter', 'legendary', 'secret'];
  // Raridades que diminuem
  const decreasedRarities = ['common', 'uncommon'];
  
  // Calcular incremento baseado no multiplicador de sorte
  const increment = (luckMultiplier - 1.0);
  
  // Redistribuir probabilidades
  const adjustedChances = { ...baseChances };
  
  // Aumentar raridades altas
  increasedRarities.forEach(rarity => {
    adjustedChances[rarity] *= (1 + increment);
  });
  
  // Diminuir raridades baixas para compensar
  const totalIncrease = increasedRarities.reduce((sum, r) => 
    sum + (adjustedChances[r] - baseChances[r]), 0);
  
  const decreasePerRarity = totalIncrease / decreasedRarities.length;
  decreasedRarities.forEach(rarity => {
    adjustedChances[rarity] = Math.max(0.01, adjustedChances[rarity] - decreasePerRarity);
  });
  
  // Normalizar para somar 1.0
  const total = Object.values(adjustedChances).reduce((a, b) => a + b, 0);
  Object.keys(adjustedChances).forEach(key => {
    adjustedChances[key] /= total;
  });
  
  return adjustedChances;
};

export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'starter' | 'pseudo' | 'legendary' | 'secret' | 'xerelete';
  isShiny?: boolean;
}

export interface PokemonInventoryItem {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  quantity: number;
  sprite: string;
  is_shiny: boolean;
}

export interface UserSpins {
  free_spins: number;
  base_free_spins: number;
  last_spin_reset?: string;
}

// Pokemon da 1ª e 2ª geração com suas raridades
const GEN1_POKEMON: Pokemon[] = [
  // Kanto Pokemon (IDs 1-150) in numerical order
  { id: 1, name: 'bulbasaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png', rarity: 'starter' },
  { id: 2, name: 'ivysaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png', rarity: 'starter' },
  { id: 3, name: 'venusaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png', rarity: 'starter' },
  { id: 4, name: 'charmander', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png', rarity: 'starter' },
  { id: 5, name: 'charmeleon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png', rarity: 'starter' },
  { id: 6, name: 'charizard', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png', rarity: 'starter' },
  { id: 7, name: 'squirtle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png', rarity: 'starter' },
  { id: 8, name: 'wartortle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png', rarity: 'starter' },
  { id: 9, name: 'blastoise', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png', rarity: 'starter' },
  { id: 10, name: 'caterpie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png', rarity: 'common' },
  { id: 11, name: 'metapod', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/11.png', rarity: 'common' },
  { id: 12, name: 'butterfree', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/12.png', rarity: 'uncommon' },
  { id: 13, name: 'weedle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/13.png', rarity: 'common' },
  { id: 14, name: 'kakuna', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/14.png', rarity: 'common' },
  { id: 15, name: 'beedrill', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/15.png', rarity: 'uncommon' },
  { id: 16, name: 'pidgey', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png', rarity: 'common' },
  { id: 17, name: 'pidgeotto', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/17.png', rarity: 'common' },
  { id: 18, name: 'pidgeot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/18.png', rarity: 'uncommon' },
  { id: 19, name: 'rattata', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png', rarity: 'common' },
  { id: 20, name: 'raticate', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/20.png', rarity: 'uncommon' },
  { id: 21, name: 'spearow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/21.png', rarity: 'common' },
  { id: 22, name: 'fearow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/22.png', rarity: 'uncommon' },
  { id: 23, name: 'ekans', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/23.png', rarity: 'common' },
  { id: 24, name: 'arbok', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/24.png', rarity: 'uncommon' },
  { id: 25, name: 'pikachu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', rarity: 'rare' },
  { id: 26, name: 'raichu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png', rarity: 'rare' },
  { id: 27, name: 'sandshrew', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/27.png', rarity: 'common' },
  { id: 28, name: 'sandslash', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/28.png', rarity: 'uncommon' },
  { id: 29, name: 'nidoran-f', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/29.png', rarity: 'common' },
  { id: 30, name: 'nidorina', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/30.png', rarity: 'uncommon' },
  { id: 31, name: 'nidoqueen', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/31.png', rarity: 'rare' },
  { id: 32, name: 'nidoran-m', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/32.png', rarity: 'common' },
  { id: 33, name: 'nidorino', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/33.png', rarity: 'uncommon' },
  { id: 34, name: 'nidoking', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/34.png', rarity: 'rare' },
  { id: 35, name: 'clefairy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/35.png', rarity: 'common' },
  { id: 36, name: 'clefable', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/36.png', rarity: 'uncommon' },
  { id: 37, name: 'vulpix', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/37.png', rarity: 'common' },
  { id: 38, name: 'ninetales', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/38.png', rarity: 'rare' },
  { id: 39, name: 'jigglypuff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png', rarity: 'common' },
  { id: 40, name: 'wigglytuff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/40.png', rarity: 'uncommon' },
  { id: 41, name: 'zubat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png', rarity: 'common' },
  { id: 42, name: 'golbat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/42.png', rarity: 'uncommon' },
  { id: 43, name: 'oddish', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/43.png', rarity: 'common' },
  { id: 44, name: 'gloom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/44.png', rarity: 'uncommon' },
  { id: 45, name: 'vileplume', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/45.png', rarity: 'rare' },
  { id: 46, name: 'paras', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/46.png', rarity: 'common' },
  { id: 47, name: 'parasect', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/47.png', rarity: 'uncommon' },
  { id: 48, name: 'venonat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/48.png', rarity: 'common' },
  { id: 49, name: 'venomoth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/49.png', rarity: 'uncommon' },
  { id: 50, name: 'diglett', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/50.png', rarity: 'common' },
  { id: 51, name: 'dugtrio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/51.png', rarity: 'uncommon' },
  { id: 52, name: 'meowth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png', rarity: 'common' },
  { id: 53, name: 'persian', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/53.png', rarity: 'uncommon' },
  { id: 54, name: 'psyduck', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png', rarity: 'common' },
  { id: 55, name: 'golduck', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/55.png', rarity: 'uncommon' },
  { id: 56, name: 'mankey', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/56.png', rarity: 'common' },
  { id: 57, name: 'primeape', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/57.png', rarity: 'uncommon' },
  { id: 58, name: 'growlithe', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/58.png', rarity: 'common' },
  { id: 59, name: 'arcanine', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/59.png', rarity: 'rare' },
  { id: 60, name: 'poliwag', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/60.png', rarity: 'common' },
  { id: 61, name: 'poliwhirl', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/61.png', rarity: 'uncommon' },
  { id: 62, name: 'poliwrath', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/62.png', rarity: 'uncommon' },
  { id: 63, name: 'abra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/63.png', rarity: 'common' },
  { id: 64, name: 'kadabra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/64.png', rarity: 'uncommon' },
  { id: 65, name: 'alakazam', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png', rarity: 'rare' },
  { id: 66, name: 'machop', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/66.png', rarity: 'common' },
  { id: 67, name: 'machoke', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/67.png', rarity: 'uncommon' },
  { id: 68, name: 'machamp', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png', rarity: 'rare' },
  { id: 69, name: 'bellsprout', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/69.png', rarity: 'common' },
  { id: 70, name: 'weepinbell', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/70.png', rarity: 'uncommon' },
  { id: 71, name: 'victreebel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/71.png', rarity: 'rare' },
  { id: 72, name: 'tentacool', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/72.png', rarity: 'common' },
  { id: 73, name: 'tentacruel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/73.png', rarity: 'uncommon' },
  { id: 74, name: 'geodude', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png', rarity: 'common' },
  { id: 75, name: 'graveler', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/75.png', rarity: 'uncommon' },
  { id: 76, name: 'golem', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/76.png', rarity: 'rare' },
  { id: 77, name: 'ponyta', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/77.png', rarity: 'common' },
  { id: 78, name: 'rapidash', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/78.png', rarity: 'uncommon' },
  { id: 79, name: 'slowpoke', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/79.png', rarity: 'common' },
  { id: 80, name: 'slowbro', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/80.png', rarity: 'rare' },
  { id: 81, name: 'magnemite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/81.png', rarity: 'common' },
  { id: 82, name: 'magneton', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/82.png', rarity: 'uncommon' },
  { id: 83, name: 'farfetchd', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/83.png', rarity: 'common' },
  { id: 84, name: 'doduo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/84.png', rarity: 'common' },
  { id: 85, name: 'dodrio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/85.png', rarity: 'uncommon' },
  { id: 86, name: 'seel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/86.png', rarity: 'common' },
  { id: 87, name: 'dewgong', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/87.png', rarity: 'uncommon' },
  { id: 88, name: 'grimer', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/88.png', rarity: 'common' },
  { id: 89, name: 'muk', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/89.png', rarity: 'uncommon' },
  { id: 90, name: 'shellder', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/90.png', rarity: 'common' },
  { id: 91, name: 'cloyster', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/91.png', rarity: 'uncommon' },
  { id: 92, name: 'gastly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/92.png', rarity: 'common' },
  { id: 93, name: 'haunter', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/93.png', rarity: 'uncommon' },
  { id: 94, name: 'gengar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png', rarity: 'rare' },
  { id: 95, name: 'onix', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png', rarity: 'common' },
  { id: 96, name: 'drowzee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/96.png', rarity: 'common' },
  { id: 97, name: 'hypno', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/97.png', rarity: 'uncommon' },
  { id: 98, name: 'krabby', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/98.png', rarity: 'common' },
  { id: 99, name: 'kingler', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/99.png', rarity: 'uncommon' },
  { id: 100, name: 'voltorb', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/100.png', rarity: 'common' },
  { id: 101, name: 'electrode', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/101.png', rarity: 'uncommon' },
  { id: 102, name: 'exeggcute', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/102.png', rarity: 'common' },
  { id: 103, name: 'exeggutor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/103.png', rarity: 'uncommon' },
  { id: 104, name: 'cubone', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/104.png', rarity: 'common' },
  { id: 105, name: 'marowak', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/105.png', rarity: 'uncommon' },
  { id: 106, name: 'hitmonlee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/106.png', rarity: 'rare' },
  { id: 107, name: 'hitmonchan', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/107.png', rarity: 'rare' },
  { id: 108, name: 'lickitung', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/108.png', rarity: 'common' },
  { id: 109, name: 'koffing', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/109.png', rarity: 'common' },
  { id: 110, name: 'weezing', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/110.png', rarity: 'uncommon' },
  { id: 111, name: 'rhyhorn', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/111.png', rarity: 'common' },
  { id: 112, name: 'rhydon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/112.png', rarity: 'uncommon' },
  { id: 113, name: 'chansey', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/113.png', rarity: 'common' },
  { id: 114, name: 'tangela', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/114.png', rarity: 'uncommon' },
  { id: 115, name: 'kangaskhan', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/115.png', rarity: 'rare' },
  { id: 116, name: 'horsea', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/116.png', rarity: 'common' },
  { id: 117, name: 'seadra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/117.png', rarity: 'uncommon' },
  { id: 118, name: 'goldeen', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/118.png', rarity: 'common' },
  { id: 119, name: 'seaking', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/119.png', rarity: 'uncommon' },
  { id: 120, name: 'staryu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/120.png', rarity: 'common' },
  { id: 121, name: 'starmie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/121.png', rarity: 'uncommon' },
  { id: 122, name: 'mr-mime', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/122.png', rarity: 'rare' },
  { id: 123, name: 'scyther', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/123.png', rarity: 'rare' },
  { id: 124, name: 'jynx', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/124.png', rarity: 'rare' },
  { id: 125, name: 'electabuzz', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/125.png', rarity: 'uncommon' },
  { id: 126, name: 'magmar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/126.png', rarity: 'uncommon' },
  { id: 127, name: 'pinsir', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/127.png', rarity: 'rare' },
  { id: 128, name: 'tauros', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/128.png', rarity: 'rare' },
  { id: 129, name: 'magikarp', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png', rarity: 'common' },
  { id: 130, name: 'gyarados', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png', rarity: 'rare' },
  { id: 131, name: 'lapras', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png', rarity: 'rare' },
  { id: 132, name: 'ditto', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png', rarity: 'rare' },
  { id: 133, name: 'eevee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png', rarity: 'uncommon' },
  { id: 134, name: 'vaporeon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png', rarity: 'rare' },
  { id: 135, name: 'jolteon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png', rarity: 'rare' },
  { id: 136, name: 'flareon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png', rarity: 'rare' },
  { id: 137, name: 'porygon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/137.png', rarity: 'rare' },
  { id: 138, name: 'omanyte', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/138.png', rarity: 'common' },
  { id: 139, name: 'omastar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/139.png', rarity: 'rare' },
  { id: 140, name: 'kabuto', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/140.png', rarity: 'common' },
  { id: 141, name: 'kabutops', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/141.png', rarity: 'rare' },
  { id: 142, name: 'aerodactyl', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/142.png', rarity: 'rare' },
  { id: 143, name: 'snorlax', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png', rarity: 'rare' },
  { id: 144, name: 'articuno', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png', rarity: 'legendary' },
  { id: 145, name: 'zapdos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png', rarity: 'legendary' },
  { id: 146, name: 'moltres', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png', rarity: 'legendary' },
  { id: 147, name: 'dratini', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/147.png', rarity: 'uncommon' },
  { id: 148, name: 'dragonair', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/148.png', rarity: 'rare' },
  { id: 149, name: 'dragonite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png', rarity: 'pseudo' },
  { id: 150, name: 'mewtwo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', rarity: 'legendary' },
  
  // Johto Pokemon (IDs 152-250)
  { id: 152, name: 'chikorita', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/152.png', rarity: 'starter' },
  { id: 153, name: 'bayleef', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/153.png', rarity: 'starter' },
  { id: 154, name: 'meganium', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/154.png', rarity: 'starter' },
  { id: 155, name: 'cyndaquil', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/155.png', rarity: 'starter' },
  { id: 156, name: 'quilava', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/156.png', rarity: 'starter' },
  { id: 157, name: 'typhlosion', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/157.png', rarity: 'starter' },
  { id: 158, name: 'totodile', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/158.png', rarity: 'starter' },
  { id: 159, name: 'croconaw', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/159.png', rarity: 'starter' },
  { id: 160, name: 'feraligatr', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/160.png', rarity: 'starter' },
  { id: 161, name: 'sentret', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/161.png', rarity: 'common' },
  { id: 162, name: 'furret', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/162.png', rarity: 'uncommon' },
  { id: 163, name: 'hoothoot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/163.png', rarity: 'common' },
  { id: 164, name: 'noctowl', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/164.png', rarity: 'uncommon' },
  { id: 165, name: 'ledyba', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/165.png', rarity: 'common' },
  { id: 166, name: 'ledian', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/166.png', rarity: 'uncommon' },
  { id: 167, name: 'spinarak', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/167.png', rarity: 'common' },
  { id: 168, name: 'ariados', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/168.png', rarity: 'uncommon' },
  { id: 169, name: 'crobat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/169.png', rarity: 'rare' },
  { id: 170, name: 'chinchou', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/170.png', rarity: 'common' },
  { id: 171, name: 'lanturn', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/171.png', rarity: 'uncommon' },
  { id: 172, name: 'pichu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/172.png', rarity: 'rare' },
  { id: 173, name: 'cleffa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/173.png', rarity: 'common' },
  { id: 174, name: 'igglybuff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/174.png', rarity: 'common' },
  { id: 175, name: 'togepi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/175.png', rarity: 'rare' },
  { id: 176, name: 'togetic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/176.png', rarity: 'rare' },
  { id: 177, name: 'natu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/177.png', rarity: 'common' },
  { id: 178, name: 'xatu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/178.png', rarity: 'uncommon' },
  { id: 179, name: 'mareep', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/179.png', rarity: 'common' },
  { id: 180, name: 'flaaffy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/180.png', rarity: 'uncommon' },
  { id: 181, name: 'ampharos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/181.png', rarity: 'rare' },
  { id: 182, name: 'bellossom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/182.png', rarity: 'rare' },
  { id: 183, name: 'marill', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/183.png', rarity: 'common' },
  { id: 184, name: 'azumarill', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/184.png', rarity: 'uncommon' },
  { id: 185, name: 'sudowoodo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/185.png', rarity: 'uncommon' },
  { id: 186, name: 'politoed', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/186.png', rarity: 'rare' },
  { id: 187, name: 'hoppip', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/187.png', rarity: 'common' },
  { id: 188, name: 'skiploom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/188.png', rarity: 'common' },
  { id: 189, name: 'jumpluff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/189.png', rarity: 'uncommon' },
  { id: 190, name: 'aipom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/190.png', rarity: 'common' },
  { id: 191, name: 'sunkern', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/191.png', rarity: 'common' },
  { id: 192, name: 'sunflora', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/192.png', rarity: 'uncommon' },
  { id: 193, name: 'yanma', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/193.png', rarity: 'common' },
  { id: 194, name: 'wooper', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/194.png', rarity: 'common' },
  { id: 195, name: 'quagsire', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/195.png', rarity: 'uncommon' },
  { id: 196, name: 'espeon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png', rarity: 'rare' },
  { id: 197, name: 'umbreon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png', rarity: 'rare' },
  { id: 198, name: 'murkrow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/198.png', rarity: 'common' },
  { id: 199, name: 'slowking', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/199.png', rarity: 'rare' },
  { id: 200, name: 'misdreavus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/200.png', rarity: 'uncommon' },
  { id: 201, name: 'unown', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/201.png', rarity: 'rare' },
  { id: 202, name: 'wobbuffet', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/202.png', rarity: 'uncommon' },
  { id: 203, name: 'girafarig', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/203.png', rarity: 'uncommon' },
  { id: 204, name: 'pineco', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/204.png', rarity: 'common' },
  { id: 205, name: 'forretress', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/205.png', rarity: 'uncommon' },
  { id: 206, name: 'dunsparce', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/206.png', rarity: 'uncommon' },
  { id: 207, name: 'gligar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/207.png', rarity: 'common' },
  { id: 208, name: 'steelix', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/208.png', rarity: 'rare' },
  { id: 209, name: 'snubbull', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/209.png', rarity: 'common' },
  { id: 210, name: 'granbull', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/210.png', rarity: 'uncommon' },
  { id: 211, name: 'qwilfish', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/211.png', rarity: 'uncommon' },
  { id: 212, name: 'scizor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/212.png', rarity: 'rare' },
  { id: 213, name: 'shuckle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/213.png', rarity: 'uncommon' },
  { id: 214, name: 'heracross', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/214.png', rarity: 'rare' },
  { id: 215, name: 'sneasel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/215.png', rarity: 'uncommon' },
  { id: 216, name: 'teddiursa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/216.png', rarity: 'common' },
  { id: 217, name: 'ursaring', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/217.png', rarity: 'uncommon' },
  { id: 218, name: 'slugma', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/218.png', rarity: 'common' },
  { id: 219, name: 'magcargo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/219.png', rarity: 'uncommon' },
  { id: 220, name: 'swinub', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/220.png', rarity: 'common' },
  { id: 221, name: 'piloswine', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/221.png', rarity: 'uncommon' },
  { id: 222, name: 'corsola', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/222.png', rarity: 'uncommon' },
  { id: 223, name: 'remoraid', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/223.png', rarity: 'common' },
  { id: 224, name: 'octillery', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/224.png', rarity: 'uncommon' },
  { id: 225, name: 'delibird', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/225.png', rarity: 'uncommon' },
  { id: 226, name: 'mantine', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/226.png', rarity: 'uncommon' },
  { id: 227, name: 'skarmory', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/227.png', rarity: 'rare' },
  { id: 228, name: 'houndour', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/228.png', rarity: 'common' },
  { id: 229, name: 'houndoom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/229.png', rarity: 'rare' },
  { id: 230, name: 'kingdra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/230.png', rarity: 'rare' },
  { id: 231, name: 'phanpy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/231.png', rarity: 'common' },
  { id: 232, name: 'donphan', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/232.png', rarity: 'uncommon' },
  { id: 233, name: 'porygon2', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/233.png', rarity: 'rare' },
  { id: 234, name: 'stantler', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/234.png', rarity: 'uncommon' },
  { id: 235, name: 'smeargle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/235.png', rarity: 'uncommon' },
  { id: 236, name: 'tyrogue', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/236.png', rarity: 'uncommon' },
  { id: 237, name: 'hitmontop', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/237.png', rarity: 'rare' },
  { id: 238, name: 'smoochum', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/238.png', rarity: 'uncommon' },
  { id: 239, name: 'elekid', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/239.png', rarity: 'uncommon' },
  { id: 240, name: 'magby', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/240.png', rarity: 'uncommon' },
  { id: 241, name: 'miltank', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/241.png', rarity: 'uncommon' },
  { id: 242, name: 'blissey', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/242.png', rarity: 'rare' },
  { id: 243, name: 'raikou', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/243.png', rarity: 'legendary' },
  { id: 244, name: 'entei', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/244.png', rarity: 'legendary' },
  { id: 245, name: 'suicune', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png', rarity: 'legendary' },
  { id: 246, name: 'larvitar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/246.png', rarity: 'uncommon' },
  { id: 247, name: 'pupitar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/247.png', rarity: 'rare' },
  { id: 248, name: 'tyranitar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png', rarity: 'pseudo' },
  { id: 249, name: 'lugia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png', rarity: 'legendary' },
  { id: 250, name: 'ho-oh', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png', rarity: 'legendary' },
  
  // Hoenn Pokemon (IDs 252-386)
  { id: 252, name: 'treecko', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/252.png', rarity: 'starter' },
  { id: 253, name: 'grovyle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/253.png', rarity: 'starter' },
  { id: 254, name: 'sceptile', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/254.png', rarity: 'starter' },
  { id: 255, name: 'torchic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/255.png', rarity: 'starter' },
  { id: 256, name: 'combusken', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/256.png', rarity: 'starter' },
  { id: 257, name: 'blaziken', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/257.png', rarity: 'starter' },
  { id: 258, name: 'mudkip', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/258.png', rarity: 'starter' },
  { id: 259, name: 'marshtomp', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/259.png', rarity: 'starter' },
  { id: 260, name: 'swampert', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/260.png', rarity: 'starter' },
  { id: 261, name: 'poochyena', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/261.png', rarity: 'common' },
  { id: 262, name: 'mightyena', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/262.png', rarity: 'uncommon' },
  { id: 263, name: 'zigzagoon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/263.png', rarity: 'common' },
  { id: 264, name: 'linoone', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/264.png', rarity: 'uncommon' },
  { id: 265, name: 'wurmple', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/265.png', rarity: 'common' },
  { id: 266, name: 'silcoon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/266.png', rarity: 'common' },
  { id: 267, name: 'beautifly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/267.png', rarity: 'uncommon' },
  { id: 268, name: 'cascoon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/268.png', rarity: 'common' },
  { id: 269, name: 'dustox', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/269.png', rarity: 'uncommon' },
  { id: 270, name: 'lotad', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/270.png', rarity: 'common' },
  { id: 271, name: 'lombre', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/271.png', rarity: 'uncommon' },
  { id: 272, name: 'ludicolo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/272.png', rarity: 'rare' },
  { id: 273, name: 'seedot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/273.png', rarity: 'common' },
  { id: 274, name: 'nuzleaf', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/274.png', rarity: 'uncommon' },
  { id: 275, name: 'shiftry', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/275.png', rarity: 'rare' },
  { id: 276, name: 'taillow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/276.png', rarity: 'common' },
  { id: 277, name: 'swellow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/277.png', rarity: 'uncommon' },
  { id: 278, name: 'wingull', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/278.png', rarity: 'common' },
  { id: 279, name: 'pelipper', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/279.png', rarity: 'uncommon' },
  { id: 280, name: 'ralts', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/280.png', rarity: 'common' },
  { id: 281, name: 'kirlia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/281.png', rarity: 'uncommon' },
  { id: 282, name: 'gardevoir', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png', rarity: 'rare' },
  { id: 283, name: 'surskit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/283.png', rarity: 'common' },
  { id: 284, name: 'masquerain', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/284.png', rarity: 'uncommon' },
  { id: 285, name: 'shroomish', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/285.png', rarity: 'common' },
  { id: 286, name: 'breloom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/286.png', rarity: 'rare' },
  { id: 287, name: 'slakoth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/287.png', rarity: 'common' },
  { id: 288, name: 'vigoroth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/288.png', rarity: 'uncommon' },
  { id: 289, name: 'slaking', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/289.png', rarity: 'rare' },
  { id: 290, name: 'nincada', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/290.png', rarity: 'common' },
  { id: 291, name: 'ninjask', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/291.png', rarity: 'uncommon' },
  { id: 292, name: 'shedinja', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/292.png', rarity: 'rare' },
  { id: 293, name: 'whismur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/293.png', rarity: 'common' },
  { id: 294, name: 'loudred', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/294.png', rarity: 'uncommon' },
  { id: 295, name: 'exploud', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/295.png', rarity: 'rare' },
  { id: 296, name: 'makuhita', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/296.png', rarity: 'common' },
  { id: 297, name: 'hariyama', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/297.png', rarity: 'uncommon' },
  { id: 298, name: 'azurill', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/298.png', rarity: 'common' },
  { id: 299, name: 'nosepass', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/299.png', rarity: 'uncommon' },
  { id: 300, name: 'skitty', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/300.png', rarity: 'common' },
  { id: 301, name: 'delcatty', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/301.png', rarity: 'uncommon' },
  { id: 302, name: 'sableye', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/302.png', rarity: 'rare' },
  { id: 303, name: 'mawile', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/303.png', rarity: 'rare' },
  { id: 304, name: 'aron', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/304.png', rarity: 'common' },
  { id: 305, name: 'lairon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/305.png', rarity: 'uncommon' },
  { id: 306, name: 'aggron', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/306.png', rarity: 'rare' },
  { id: 307, name: 'meditite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/307.png', rarity: 'common' },
  { id: 308, name: 'medicham', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/308.png', rarity: 'uncommon' },
  { id: 309, name: 'electrike', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/309.png', rarity: 'common' },
  { id: 310, name: 'manectric', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/310.png', rarity: 'uncommon' },
  { id: 311, name: 'plusle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/311.png', rarity: 'uncommon' },
  { id: 312, name: 'minun', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/312.png', rarity: 'uncommon' },
  { id: 313, name: 'volbeat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/313.png', rarity: 'uncommon' },
  { id: 314, name: 'illumise', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/314.png', rarity: 'uncommon' },
  { id: 315, name: 'roselia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/315.png', rarity: 'uncommon' },
  { id: 316, name: 'gulpin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/316.png', rarity: 'common' },
  { id: 317, name: 'swalot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/317.png', rarity: 'uncommon' },
  { id: 318, name: 'carvanha', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/318.png', rarity: 'common' },
  { id: 319, name: 'sharpedo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/319.png', rarity: 'rare' },
  { id: 320, name: 'wailmer', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/320.png', rarity: 'common' },
  { id: 321, name: 'wailord', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/321.png', rarity: 'uncommon' },
  { id: 322, name: 'numel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/322.png', rarity: 'common' },
  { id: 323, name: 'camerupt', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/323.png', rarity: 'uncommon' },
  { id: 324, name: 'torkoal', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/324.png', rarity: 'uncommon' },
  { id: 325, name: 'spoink', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/325.png', rarity: 'common' },
  { id: 326, name: 'grumpig', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/326.png', rarity: 'uncommon' },
  { id: 327, name: 'spinda', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/327.png', rarity: 'uncommon' },
  { id: 328, name: 'trapinch', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/328.png', rarity: 'common' },
  { id: 329, name: 'vibrava', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/329.png', rarity: 'uncommon' },
  { id: 330, name: 'flygon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/330.png', rarity: 'rare' },
  { id: 331, name: 'cacnea', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/331.png', rarity: 'common' },
  { id: 332, name: 'cacturne', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/332.png', rarity: 'uncommon' },
  { id: 333, name: 'swablu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/333.png', rarity: 'common' },
  { id: 334, name: 'altaria', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/334.png', rarity: 'rare' },
  { id: 335, name: 'zangoose', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/335.png', rarity: 'uncommon' },
  { id: 336, name: 'seviper', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/336.png', rarity: 'uncommon' },
  { id: 337, name: 'lunatone', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/337.png', rarity: 'uncommon' },
  { id: 338, name: 'solrock', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/338.png', rarity: 'uncommon' },
  { id: 339, name: 'barboach', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/339.png', rarity: 'common' },
  { id: 340, name: 'whiscash', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/340.png', rarity: 'uncommon' },
  { id: 341, name: 'corphish', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/341.png', rarity: 'common' },
  { id: 342, name: 'crawdaunt', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/342.png', rarity: 'uncommon' },
  { id: 343, name: 'baltoy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/343.png', rarity: 'common' },
  { id: 344, name: 'claydol', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/344.png', rarity: 'uncommon' },
  { id: 345, name: 'lileep', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/345.png', rarity: 'uncommon' },
  { id: 346, name: 'cradily', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/346.png', rarity: 'rare' },
  { id: 347, name: 'anorith', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/347.png', rarity: 'uncommon' },
  { id: 348, name: 'armaldo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/348.png', rarity: 'rare' },
  { id: 349, name: 'feebas', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/349.png', rarity: 'common' },
  { id: 350, name: 'milotic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/350.png', rarity: 'rare' },
  { id: 351, name: 'castform', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/351.png', rarity: 'uncommon' },
  { id: 352, name: 'kecleon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/352.png', rarity: 'uncommon' },
  { id: 353, name: 'shuppet', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/353.png', rarity: 'common' },
  { id: 354, name: 'banette', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/354.png', rarity: 'uncommon' },
  { id: 355, name: 'duskull', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/355.png', rarity: 'common' },
  { id: 356, name: 'dusclops', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/356.png', rarity: 'uncommon' },
  { id: 357, name: 'tropius', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/357.png', rarity: 'uncommon' },
  { id: 358, name: 'chimecho', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/358.png', rarity: 'uncommon' },
  { id: 359, name: 'absol', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/359.png', rarity: 'rare' },
  { id: 360, name: 'wynaut', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/360.png', rarity: 'uncommon' },
  { id: 361, name: 'snorunt', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/361.png', rarity: 'common' },
  { id: 362, name: 'glalie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/362.png', rarity: 'uncommon' },
  { id: 363, name: 'spheal', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/363.png', rarity: 'common' },
  { id: 364, name: 'sealeo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/364.png', rarity: 'uncommon' },
  { id: 365, name: 'walrein', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/365.png', rarity: 'rare' },
  { id: 366, name: 'clamperl', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/366.png', rarity: 'common' },
  { id: 367, name: 'huntail', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/367.png', rarity: 'uncommon' },
  { id: 368, name: 'gorebyss', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/368.png', rarity: 'uncommon' },
  { id: 369, name: 'relicanth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/369.png', rarity: 'rare' },
  { id: 370, name: 'luvdisc', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/370.png', rarity: 'common' },
  { id: 371, name: 'bagon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/371.png', rarity: 'uncommon' },
  { id: 372, name: 'shelgon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/372.png', rarity: 'rare' },
  { id: 373, name: 'salamence', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/373.png', rarity: 'pseudo' },
  { id: 374, name: 'beldum', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/374.png', rarity: 'uncommon' },
  { id: 375, name: 'metang', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/375.png', rarity: 'rare' },
  { id: 376, name: 'metagross', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/376.png', rarity: 'pseudo' },
  { id: 377, name: 'regirock', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/377.png', rarity: 'legendary' },
  { id: 378, name: 'regice', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/378.png', rarity: 'legendary' },
  { id: 379, name: 'registeel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/379.png', rarity: 'legendary' },
  { id: 380, name: 'latias', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/380.png', rarity: 'legendary' },
  { id: 381, name: 'latios', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/381.png', rarity: 'legendary' },
  { id: 382, name: 'kyogre', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/382.png', rarity: 'legendary' },
  { id: 383, name: 'groudon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/383.png', rarity: 'legendary' },
  { id: 384, name: 'rayquaza', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png', rarity: 'legendary' },
  { id: 386, name: 'deoxys', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/386.png', rarity: 'legendary' },

  // Sinnoh Pokemon (IDs 387-493)
  { id: 387, name: 'turtwig', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png', rarity: 'starter' },
  { id: 388, name: 'grotle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/388.png', rarity: 'starter' },
  { id: 389, name: 'torterra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/389.png', rarity: 'starter' },
  { id: 390, name: 'chimchar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png', rarity: 'starter' },
  { id: 391, name: 'monferno', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/391.png', rarity: 'starter' },
  { id: 392, name: 'infernape', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/392.png', rarity: 'starter' },
  { id: 393, name: 'piplup', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/393.png', rarity: 'starter' },
  { id: 394, name: 'prinplup', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/394.png', rarity: 'starter' },
  { id: 395, name: 'empoleon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/395.png', rarity: 'starter' },
  { id: 396, name: 'starly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/396.png', rarity: 'common' },
  { id: 397, name: 'staravia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/397.png', rarity: 'uncommon' },
  { id: 398, name: 'staraptor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/398.png', rarity: 'rare' },
  { id: 399, name: 'bidoof', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/399.png', rarity: 'common' },
  { id: 400, name: 'bibarel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/400.png', rarity: 'uncommon' },
  { id: 401, name: 'kricketot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/401.png', rarity: 'common' },
  { id: 402, name: 'kricketune', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/402.png', rarity: 'uncommon' },
  { id: 403, name: 'shinx', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/403.png', rarity: 'common' },
  { id: 404, name: 'luxio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/404.png', rarity: 'uncommon' },
  { id: 405, name: 'luxray', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/405.png', rarity: 'rare' },
  { id: 406, name: 'budew', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/406.png', rarity: 'common' },
  { id: 407, name: 'roserade', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/407.png', rarity: 'rare' },
  { id: 408, name: 'cranidos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/408.png', rarity: 'uncommon' },
  { id: 409, name: 'rampardos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/409.png', rarity: 'rare' },
  { id: 410, name: 'shieldon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/410.png', rarity: 'uncommon' },
  { id: 411, name: 'bastiodon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/411.png', rarity: 'rare' },
  { id: 412, name: 'burmy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/412.png', rarity: 'common' },
  { id: 413, name: 'wormadam', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/413.png', rarity: 'uncommon' },
  { id: 414, name: 'mothim', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/414.png', rarity: 'uncommon' },
  { id: 415, name: 'combee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/415.png', rarity: 'common' },
  { id: 416, name: 'vespiquen', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/416.png', rarity: 'rare' },
  { id: 417, name: 'pachirisu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/417.png', rarity: 'uncommon' },
  { id: 418, name: 'buizel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/418.png', rarity: 'common' },
  { id: 419, name: 'floatzel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/419.png', rarity: 'uncommon' },
  { id: 420, name: 'cherubi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/420.png', rarity: 'common' },
  { id: 421, name: 'cherrim', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/421.png', rarity: 'uncommon' },
  { id: 422, name: 'shellos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/422.png', rarity: 'common' },
  { id: 423, name: 'gastrodon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/423.png', rarity: 'uncommon' },
  { id: 424, name: 'ambipom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/424.png', rarity: 'uncommon' },
  { id: 425, name: 'drifloon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/425.png', rarity: 'common' },
  { id: 426, name: 'drifblim', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/426.png', rarity: 'uncommon' },
  { id: 427, name: 'buneary', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/427.png', rarity: 'common' },
  { id: 428, name: 'lopunny', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/428.png', rarity: 'uncommon' },
  { id: 429, name: 'mismagius', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/429.png', rarity: 'rare' },
  { id: 430, name: 'honchkrow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/430.png', rarity: 'rare' },
  { id: 431, name: 'glameow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/431.png', rarity: 'common' },
  { id: 432, name: 'purugly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/432.png', rarity: 'uncommon' },
  { id: 433, name: 'chingling', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/433.png', rarity: 'common' },
  { id: 434, name: 'stunky', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/434.png', rarity: 'common' },
  { id: 435, name: 'skuntank', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/435.png', rarity: 'uncommon' },
  { id: 436, name: 'bronzor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/436.png', rarity: 'common' },
  { id: 437, name: 'bronzong', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/437.png', rarity: 'uncommon' },
  { id: 438, name: 'bonsly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/438.png', rarity: 'common' },
  { id: 439, name: 'mime-jr', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/439.png', rarity: 'common' },
  { id: 440, name: 'happiny', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/440.png', rarity: 'common' },
  { id: 441, name: 'chatot', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/441.png', rarity: 'uncommon' },
  { id: 442, name: 'spiritomb', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/442.png', rarity: 'rare' },
  { id: 443, name: 'gible', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/443.png', rarity: 'uncommon' },
  { id: 444, name: 'gabite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/444.png', rarity: 'rare' },
  { id: 445, name: 'garchomp', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/445.png', rarity: 'pseudo' },
  { id: 446, name: 'munchlax', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/446.png', rarity: 'uncommon' },
  { id: 447, name: 'riolu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/447.png', rarity: 'uncommon' },
  { id: 448, name: 'lucario', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png', rarity: 'rare' },
  { id: 449, name: 'hippopotas', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/449.png', rarity: 'common' },
  { id: 450, name: 'hippowdon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/450.png', rarity: 'uncommon' },
  { id: 451, name: 'skorupi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/451.png', rarity: 'common' },
  { id: 452, name: 'drapion', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/452.png', rarity: 'uncommon' },
  { id: 453, name: 'croagunk', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/453.png', rarity: 'common' },
  { id: 454, name: 'toxicroak', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/454.png', rarity: 'uncommon' },
  { id: 455, name: 'carnivine', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/455.png', rarity: 'uncommon' },
  { id: 456, name: 'finneon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/456.png', rarity: 'common' },
  { id: 457, name: 'lumineon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/457.png', rarity: 'uncommon' },
  { id: 458, name: 'mantyke', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/458.png', rarity: 'common' },
  { id: 459, name: 'snover', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/459.png', rarity: 'common' },
  { id: 460, name: 'abomasnow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/460.png', rarity: 'uncommon' },
  { id: 461, name: 'weavile', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/461.png', rarity: 'rare' },
  { id: 462, name: 'magnezone', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/462.png', rarity: 'rare' },
  { id: 463, name: 'lickilicky', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/463.png', rarity: 'uncommon' },
  { id: 464, name: 'rhyperior', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/464.png', rarity: 'rare' },
  { id: 465, name: 'tangrowth', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/465.png', rarity: 'uncommon' },
  { id: 466, name: 'electivire', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/466.png', rarity: 'rare' },
  { id: 467, name: 'magmortar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/467.png', rarity: 'rare' },
  { id: 468, name: 'togekiss', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/468.png', rarity: 'rare' },
  { id: 469, name: 'yanmega', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/469.png', rarity: 'uncommon' },
  { id: 470, name: 'leafeon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/470.png', rarity: 'rare' },
  { id: 471, name: 'glaceon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/471.png', rarity: 'rare' },
  { id: 472, name: 'gliscor', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/472.png', rarity: 'uncommon' },
  { id: 473, name: 'mamoswine', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/473.png', rarity: 'rare' },
  { id: 474, name: 'porygon-z', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/474.png', rarity: 'rare' },
  { id: 475, name: 'gallade', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/475.png', rarity: 'rare' },
  { id: 476, name: 'probopass', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/476.png', rarity: 'uncommon' },
  { id: 477, name: 'dusknoir', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/477.png', rarity: 'rare' },
  { id: 478, name: 'froslass', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/478.png', rarity: 'rare' },
  { id: 479, name: 'rotom', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/479.png', rarity: 'rare' },
  { id: 480, name: 'uxie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/480.png', rarity: 'legendary' },
  { id: 481, name: 'mesprit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/481.png', rarity: 'legendary' },
  { id: 482, name: 'azelf', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/482.png', rarity: 'legendary' },
  { id: 483, name: 'dialga', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/483.png', rarity: 'legendary' },
  { id: 484, name: 'palkia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/484.png', rarity: 'legendary' },
  { id: 485, name: 'heatran', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/485.png', rarity: 'legendary' },
  { id: 486, name: 'regigigas', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/486.png', rarity: 'legendary' },
  { id: 487, name: 'giratina', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/487.png', rarity: 'legendary' },
  { id: 488, name: 'cresselia', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/488.png', rarity: 'legendary' },
  { id: 489, name: 'phione', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/489.png', rarity: 'legendary' },
  { id: 490, name: 'manaphy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/490.png', rarity: 'legendary' },
  { id: 491, name: 'darkrai', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/491.png', rarity: 'legendary' },
  { id: 492, name: 'shaymin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/492.png', rarity: 'legendary' },

  // Secret Pokemon
  { id: 151, name: 'mew', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', rarity: 'secret' },
  { id: 251, name: 'celebi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/251.png', rarity: 'secret' },
  { id: 493, name: 'arceus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png', rarity: 'secret' },
  { id: 385, name: 'jirachi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/385.png', rarity: 'secret' },

  // Unova Pokemon (Gen 5) - imported from separate file
  ...UNOVA_POKEMON,
  
  // Kalos Pokemon (Gen 6) - imported from separate file
  ...KALOS_POKEMON,
  
  // Alola Pokemon (Gen 7) - imported from separate file
  ...ALOLA_POKEMON,
];

const POKEMON_NAME_BY_ID = new Map<number, string>(
  GEN1_POKEMON.map((pokemon) => [pokemon.id, pokemon.name])
);

const isGenericPokemonName = (name: string) => /^pokemon[-_\s]*\d+$/i.test(name.trim());

const resolvePokemonNameById = (pokemonId: number, rawName: string): string => {
  if (!rawName || isGenericPokemonName(rawName)) {
    const canonical = POKEMON_NAME_BY_ID.get(pokemonId);
    if (canonical) return canonical;
  }

  return rawName;
};

export const usePokemon = () => {
  const { t } = useTranslation('toasts');
  const { user } = useAuth();
  const { updateMissionProgress } = useMissions();
  const { updateAchievementProgress } = useAchievements();
  const [inventory, setInventory] = useState<PokemonInventoryItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [spins, setSpins] = useState<UserSpins | null>(null);
  const [loading, setLoading] = useState(true);
  const [rouletteBoosts, setRouletteBoosts] = useState<{ luck_bonus: number; secret_chance: number }>({ luck_bonus: 0, secret_chance: 0 });
  const [badgeBuffs, setBadgeBuffs] = useState<{ xp_bonus: number; luck_bonus: number; shiny_bonus: number; secret_active: boolean }>({ xp_bonus: 0, luck_bonus: 0, shiny_bonus: 0, secret_active: false });

  useEffect(() => {
    const unsubscribe = subscribeSharedProfile((sharedProfile) => {
      setProfile(sharedProfile);
    });

    return unsubscribe;
  }, []);

  // Função para adicionar XP
  const addExperience = async (amount: number, source: string, silent = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('add_experience', {
        p_user_id: user.id,
        p_xp_amount: amount
      });

      if (error) {
        console.error('Error adding experience:', error);
        return;
      }

      const result = data[0];
      if (result) {
        setProfile((current: any) => {
          if (!current) return current;

          const nextProfile = {
            ...current,
            experience_points: result.new_xp,
            level: result.new_level,
          };
          updateSharedProfileSnapshot(user.id, nextProfile);
          return nextProfile;
        });

        // Show appropriate toast
        if (result.level_up) {
          if (!silent) {
            toast({
              title: `🎉 Level Up! Nível ${result.new_level}`,
              description: `Parabéns! Você subiu para o nível ${result.new_level}!`,
            });
          }
          
          // Atualizar conquistas de nível quando há level up
          console.log(`[LEVEL_UP] User reached level ${result.new_level}, updating achievements`);
          await updateAchievementProgress('level', 1);
        } else {
          if (!silent) {
            toast({
              title: `+${amount} XP`,
              description: `${source} • Total: ${result.new_xp} XP`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  // Função para obter probabilidades ajustadas (para exibição na UI)
  const getAdjustedProbabilities = () => {
    // Combine roulette boosts + badge buffs for luck
    const luckMultiplier = (profile?.luck_multiplier || 1.0) 
      + (rouletteBoosts.luck_bonus / 100.0) 
      + badgeBuffs.luck_bonus;
    const baseProbs = calculateAdjustedProbabilities(luckMultiplier);
    
    // Apply secret_chance boost from roulette boosts
    let secretMultiplier = 1.0;
    if (rouletteBoosts.secret_chance > 0) {
      secretMultiplier += rouletteBoosts.secret_chance / 100.0;
    }
    // Apply secret badge buff (+50% relative)
    if (badgeBuffs.secret_active) {
      secretMultiplier += 0.50;
    }
    
    if (secretMultiplier > 1.0 && baseProbs.secret !== undefined) {
      const oldSecret = baseProbs.secret;
      baseProbs.secret *= secretMultiplier;
      const diff = baseProbs.secret - oldSecret;
      baseProbs.common = Math.max(0.01, baseProbs.common - diff);
      // Re-normalize
      const total = Object.values(baseProbs).reduce((a, b) => a + b, 0);
      Object.keys(baseProbs).forEach(key => { baseProbs[key] /= total; });
    }
    
    return baseProbs;
  };

  // Carregar dados do usuário
  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Carregar perfil via cache compartilhado para evitar leituras duplicadas
      const profileData = await fetchSharedProfile(user.id);
      setProfile(profileData);

      // Carregar inventário
      const { data: inventoryData } = await supabase
        .from('pokemon_inventory')
        .select('pokemon_id, pokemon_name, rarity, quantity, is_shiny')
        .eq('user_id', user.id);

      if (inventoryData) {
        const inventoryWithSprites = inventoryData.map(item => {
          const normalizedPokemonId = Number(item.pokemon_id);

          return {
            ...item,
            pokemon_name: resolvePokemonNameById(normalizedPokemonId, item.pokemon_name || ''),
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png`
          };
        });
        setInventory(inventoryWithSprites);
      }

      // Carregar spins
      const { data: spinsData } = await supabase
        .from('user_spins')
        .select('free_spins, base_free_spins, last_spin_reset')
        .eq('user_id', user.id)
        .single();

      setSpins(spinsData);

      // Fetch active roulette boosts (luck_bonus, secret_chance)
      const { data: boostsData } = await supabase.rpc('get_active_roulette_boosts', {
        p_user_id: user.id,
      });
      if (boostsData && typeof boostsData === 'object' && !Array.isArray(boostsData)) {
        const bd = boostsData as Record<string, unknown>;
        setRouletteBoosts({
          luck_bonus: Number(bd.luck_bonus) || 0,
          secret_chance: Number(bd.secret_chance) || 0,
        });
      }

      // Fetch badge buffs (luck, secret, shiny, xp)
      const { data: badgeData } = await supabase.rpc('get_badge_buffs');
      if (badgeData && typeof badgeData === 'object' && !Array.isArray(badgeData)) {
        const bb = badgeData as Record<string, unknown>;
        setBadgeBuffs({
          xp_bonus: Number(bb.xp_bonus) || 0,
          luck_bonus: Number(bb.luck_bonus) || 0,
          shiny_bonus: Number(bb.shiny_bonus) || 0,
          secret_active: Boolean(bb.secret_active),
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função removida - agora usamos sistema global de reset

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Girar a roleta com região específica - agora usa função server-side
  // skipSpinDeduction: true para multi-spin (spins já descontados via deduct_multi_spins)
  const spinRoulette = async (region: string = 'kanto', skipReload: boolean = false, skipSpinDeduction: boolean = false): Promise<Pokemon | null> => {
    if (!user) return null;

    // Verificação básica de spins antes de chamar o servidor (pular se já descontados)
    if (!skipReload && !skipSpinDeduction) {
      if (!spins || spins.free_spins <= 0) return null;
    }

    // Selecionar Pokémon localmente usando RNG com luck_multiplier
    const adjustedProbs = getAdjustedProbabilities();
    const random = Math.random();
    let cumulative = 0;
    let selectedRarity = 'common';
    
    for (const [rarity, probability] of Object.entries(adjustedProbs)) {
      cumulative += probability;
      if (random <= cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    // Filtrar por região se necessário
    let regionPokemon = GEN1_POKEMON;
    if (region && region !== 'all') {
      const regionRanges: Record<string, { min: number; max: number }> = {
        kanto: { min: 1, max: 151 },
        johto: { min: 152, max: 251 },
        hoenn: { min: 252, max: 386 },
        sinnoh: { min: 387, max: 493 },
        unova: { min: 494, max: 649 },
        kalos: { min: 650, max: 721 },
        alola: { min: 722, max: 809 },
      };
      const range = regionRanges[region];
      if (range) {
        regionPokemon = GEN1_POKEMON.filter(p => p.id >= range.min && p.id <= range.max);
      }
    }

    // Filtrar por raridade selecionada
    let candidates = regionPokemon.filter(p => p.rarity === selectedRarity);
    if (candidates.length === 0) {
      candidates = regionPokemon.filter(p => p.rarity === 'common');
    }

    // Selecionar Pokémon aleatório dos candidatos
    const selectedPokemon = candidates[Math.floor(Math.random() * candidates.length)];

    // Preparar objeto único de Pokémon para enviar ao servidor
    // NOTA: O shiny agora é calculado no SERVIDOR para garantir que shiny_boost_expires_at
    // está sempre atualizado, especialmente durante multi-spins
    const pokemonData = {
      id: selectedPokemon.id,
      name: selectedPokemon.name,
      rarity: selectedPokemon.rarity
    };

    try {
      // Escolher função baseado em skipSpinDeduction
      // spin_pokemon_roulette: desconta 1 spin + adiciona pokemon
      // add_pokemon_without_spin: apenas adiciona pokemon (spins já descontados)
      // Ambas as funções agora calculam shiny no servidor usando shiny_boost_expires_at do banco
      const rpcName = skipSpinDeduction ? 'add_pokemon_without_spin' : 'spin_pokemon_roulette';
      
      const { data, error } = await supabase.rpc(rpcName, {
        p_user_id: user.id,
        p_region: region,
        p_pokemon_data: pokemonData
        // p_is_shiny removido - agora calculado no servidor
      });

      if (error) {
        console.error('Erro ao processar spin:', error);
        toast({
          title: t('roulette.errorTitle'),
          description: t('roulette.processSpinError'),
          variant: 'destructive',
        });
        return null;
      }

      // A função retorna um objeto JSONB diretamente
      const result = data as {
        success: boolean;
        message?: string;
        pokemon?: {
          id: number;
          name: string;
          rarity: string;
          isShiny: boolean;
        };
        xp_earned?: number;
        leveled_up?: boolean;
        new_level?: number;
        spins_remaining?: number;
        spin_refunded?: boolean;
      } | null;
      
      if (!result || !result.success) {
        console.error('Spin failed:', result?.message);
        if (result?.message?.includes('No free spins')) {
          toast({
            title: t('noSpins.title'),
            description: t('noSpins.description'),
            variant: 'destructive',
          });
        }
        return null;
      }

      // Extrair dados do pokemon do resultado
      const resultPokemon = result.pokemon!;

      // Notify spin refund
      if (result.spin_refunded) {
        toast({
          title: t('roulette.luckySpinTitle'),
          description: t('roulette.luckySpinDescription'),
          duration: 3000,
        });
      }

      // Definir sprite apropriado
      const pokemonSprite = resultPokemon.isShiny 
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${resultPokemon.id}.png`
        : selectedPokemon.sprite;

      const normalizedPokemonName = resolvePokemonNameById(resultPokemon.id, resultPokemon.name);

      // Atualização local imediata para evitar reload completo do inventário/perfil/spins.
      if (typeof result.spins_remaining === 'number' || !skipSpinDeduction) {
        setSpins((current) => {
          if (!current) return current;
          const fallbackSpins = skipSpinDeduction ? current.free_spins : Math.max(0, current.free_spins - 1);
          return {
            ...current,
            free_spins: typeof result.spins_remaining === 'number' ? result.spins_remaining : fallbackSpins,
          };
        });
      }

      if (typeof result.xp_earned === 'number' || typeof result.new_level === 'number') {
        setProfile((current: any) => current ? {
          ...current,
          experience_points: typeof result.xp_earned === 'number'
            ? (Number(current.experience_points) || 0) + result.xp_earned
            : current.experience_points,
          level: typeof result.new_level === 'number' ? result.new_level : current.level,
        } : current);
      }

      setInventory((current) => {
        const existingIndex = current.findIndex(
          (item) => item.pokemon_id === resultPokemon.id && item.is_shiny === resultPokemon.isShiny
        );

        if (existingIndex >= 0) {
          return current.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        return [
          {
            pokemon_id: resultPokemon.id,
            pokemon_name: normalizedPokemonName,
            rarity: resultPokemon.rarity,
            quantity: 1,
            sprite: pokemonSprite,
            is_shiny: resultPokemon.isShiny,
          },
          ...current,
        ];
      });

      // Track roulette boost progress - collector_spins
      try {
        const { error: boostSpinError } = await supabase.rpc('update_roulette_boost_progress', {
          p_user_id: user.id,
          p_task_type: 'collector_spins',
          p_increment: 1,
        });
        if (boostSpinError) throw boostSpinError;
      } catch (e) {
        console.error('Error updating roulette boost (spins):', e);
      }

      // Track mission and achievement progress for spin flow.
      try {
        await updateMissionProgress('spin', 1, true);
      } catch (e) {
        console.error('Error updating spin mission:', e);
      }
      try {
        await updateAchievementProgress('spins', 1, true);
      } catch (e) {
        console.error('Error updating spin achievement:', e);
      }

      if (['rare', 'legendary', 'secret', 'starter', 'pseudo'].includes(resultPokemon.rarity)) {
        try {
          await updateMissionProgress('catch_rare', 1, true);
        } catch (e) {
          console.error('Error updating catch_rare mission:', e);
        }
      }

      if (resultPokemon.rarity === 'legendary') {
        try {
          await updateAchievementProgress('legendary_capture', 1, true);
        } catch (e) {
          console.error('Error updating legendary achievement:', e);
        }
      }

      // Track shiny capture achievement + roulette boost
      if (resultPokemon.isShiny) {
        try {
          await updateAchievementProgress('shiny_capture', 1, true);
        } catch (e) {
          console.error('Error updating shiny achievement:', e);
        }
        try {
          const { error: boostShinyError } = await supabase.rpc('update_roulette_boost_progress', {
            p_user_id: user.id,
            p_task_type: 'shiny_pokemon',
            p_increment: 1,
          });
          if (boostShinyError) throw boostShinyError;
        } catch (e) {
          console.error('Error updating roulette boost (shiny):', e);
        }
      }

      // Recarregamento completo não é mais necessário no fluxo normal do spin.
      // Mantemos isso apenas quando explicitamente solicitado por outros fluxos.
      if (!skipReload) {
        // Nada a fazer aqui: o estado local já foi atualizado sem roundtrip extra.
      }

      return { 
        ...selectedPokemon, 
        isShiny: resultPokemon.isShiny, 
        sprite: pokemonSprite 
      };
    } catch (error) {
      console.error('Error in spinRoulette:', error);
      toast({
        title: t('roulette.errorTitle'),
        description: t('roulette.unexpectedSpinError'),
        variant: 'destructive',
      });
      return null;
    }
  };

  // Selecionar Pokémon inicial - usa função SECURITY DEFINER
  const selectStarter = async (starterPokemon: Pokemon): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('select_starter_pokemon', {
        p_user_id: user.id,
        p_pokemon_id: starterPokemon.id,
        p_pokemon_name: starterPokemon.name,
        p_rarity: starterPokemon.rarity
      });

      if (error) {
        console.error('Erro ao selecionar starter:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao selecionar Pokémon inicial',
          variant: 'destructive',
        });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        await loadUserData();
        return true;
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao selecionar starter:', error);
      return false;
    }
  };

  const sellPokemon = async (pokemonId: number, quantity: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('sell_pokemon', {
        p_user_id: user.id,
        p_pokemon_id: pokemonId,
        p_quantity: quantity
      });

      if (error) {
        console.error('Error selling pokemon:', error);
        return false;
      }

      const result = data[0];
      if (result && result.success) {
        // Atualizar progresso da missão de venda e conquistas
        console.log(`[SELL] Updating sell mission progress with quantity: ${quantity}`);
        await updateMissionProgress('sell', quantity);
        await updateAchievementProgress('sales', quantity);
        
        await loadUserData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error selling pokemon:', error);
      return false;
    }
  };

  return {
    inventory,
    profile,
    spins,
    loading,
    spinRoulette,
    loadUserData,
    selectStarter,
    sellPokemon,
    refreshInventory: loadUserData,
    GEN1_POKEMON,
    getAdjustedProbabilities,
  };
};
