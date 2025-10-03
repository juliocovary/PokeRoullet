import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useMissions } from './useMissions';
import { useAchievements } from './useAchievements';

export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'starter' | 'pseudo' | 'legendary' | 'secret';
}

export interface PokemonInventoryItem {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  quantity: number;
  sprite: string;
}

export interface UserSpins {
  free_spins: number;
  base_free_spins: number;
  last_spin_reset?: string;
}

// Pokemon da 1ª geração com suas raridades rebalanceadas
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
  
  // Secret Pokemon
  { id: 151, name: 'mew', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', rarity: 'secret' },
  { id: 251, name: 'celebi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/251.png', rarity: 'secret' },
  { id: 493, name: 'arceus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png', rarity: 'secret' },
];

export const usePokemon = () => {
  const { user } = useAuth();
  const { updateMissionProgress } = useMissions();
  const { updateAchievementProgress } = useAchievements();
  const [inventory, setInventory] = useState<PokemonInventoryItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [spins, setSpins] = useState<UserSpins | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Probabilidades de raridade atualizadas
  const RARITY_CHANCES = {
    secret: 0.0001, // 0.01%
    legendary: 0.001, // 0.1%
    starter: 0.005, // 0.5%
    pseudo: 0.01, // 1%
    rare: 0.1, // 10%
    uncommon: 0.25, // 25%
    common: 0.6339, // 63.39% (ajustado para somar 100%)
  };

  // Carregar dados do usuário
  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Carregar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      // Carregar inventário
      const { data: inventoryData } = await supabase
        .from('pokemon_inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryData) {
        const inventoryWithSprites = inventoryData.map(item => ({
          ...item,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png`
        }));
        setInventory(inventoryWithSprites);
      }

      // Carregar spins
      const { data: spinsData } = await supabase
        .from('user_spins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSpins(spinsData);
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

  // Girar a roleta
  const spinRoulette = async (): Promise<Pokemon | null> => {
    if (!user || !spins || spins.free_spins <= 0) return null;

    // Atualizar spins e timestamp
    const now = new Date().toISOString();
    const { error: spinsError } = await supabase
      .from('user_spins')
      .update({ 
        free_spins: spins.free_spins - 1,
        last_spin_reset: now
      })
      .eq('user_id', user.id);

    if (spinsError) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar spin',
        variant: 'destructive',
      });
      return null;
    }

    // Selecionar Pokémon aleatório baseado nas probabilidades
    const randomNum = Math.random();
    let cumulativeChance = 0;
    let selectedRarity: string = 'common';

    for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
      cumulativeChance += chance;
      if (randomNum <= cumulativeChance) {
        selectedRarity = rarity;
        break;
      }
    }

    // Filtrar Pokémon da raridade selecionada
    const pokemonOfRarity = GEN1_POKEMON.filter(p => p.rarity === selectedRarity);
    const selectedPokemon = pokemonOfRarity[Math.floor(Math.random() * pokemonOfRarity.length)];

    // Adicionar ao inventário
    const { data: existingPokemon } = await supabase
      .from('pokemon_inventory')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('pokemon_id', selectedPokemon.id)
      .single();

    if (existingPokemon) {
      // Se já existe, incrementar quantidade
      const { error: updateError } = await supabase
        .from('pokemon_inventory')
        .update({ quantity: existingPokemon.quantity + 1 })
        .eq('user_id', user.id)
        .eq('pokemon_id', selectedPokemon.id);

      if (updateError) {
        console.error('Erro ao incrementar quantidade:', updateError);
      }
    } else {
      // Se não existe, inserir novo
      const { error: insertError } = await supabase
        .from('pokemon_inventory')
        .insert({
          user_id: user.id,
          pokemon_id: selectedPokemon.id,
          pokemon_name: selectedPokemon.name,
          rarity: selectedPokemon.rarity,
          quantity: 1,
        });

      if (insertError) {
        console.error('Erro ao inserir no inventário:', insertError);
      }
    }

    // Adicionar XP pela captura silenciosamente (25 XP base)
    await addExperience(25, `Capturou ${selectedPokemon.name}`, true);

    // Atualizar progresso das missões e conquistas
    console.log('[SPIN] Updating spin mission progress');
    await updateMissionProgress('spin', 1);
    await updateAchievementProgress('spins', 1);
    
    // Verificar se é lendário para conquista específica
    if (selectedPokemon.rarity === 'legendary') {
      console.log('[LEGENDARY] Updating legendary capture achievement');
      await updateAchievementProgress('legendary_capture', 1);
    }
    
    // Verificar se é um pokémon raro ou superior para a missão de catch_rare
    if (['rare', 'pseudo', 'legendary', 'secret'].includes(selectedPokemon.rarity)) {
      console.log(`[RARE_CATCH] Updating rare catch mission for ${selectedPokemon.rarity} pokemon`);
      await updateMissionProgress('catch_rare', 1);
    }

    // Recarregar dados
    loadUserData();

    return selectedPokemon;
  };

  // Selecionar Pokémon inicial
  const selectStarter = async (starterPokemon: Pokemon): Promise<boolean> => {
    if (!user) return false;

    try {
      // Atualizar o perfil com o starter selecionado
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ starter_pokemon: starterPokemon.name })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        return false;
      }

      // Adicionar o Pokémon ao inventário
      const { error: inventoryError } = await supabase
        .from('pokemon_inventory')
        .insert({
          user_id: user.id,
          pokemon_id: starterPokemon.id,
          pokemon_name: starterPokemon.name,
          rarity: starterPokemon.rarity,
          quantity: 1,
        });

      if (inventoryError) {
        console.error('Erro ao adicionar starter ao inventário:', inventoryError);
        return false;
      }

      // Recarregar dados
      await loadUserData();
      return true;
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
    GEN1_POKEMON,
  };
};