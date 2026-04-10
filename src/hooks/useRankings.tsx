import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RankingEntry {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  level: number;
  experience_points: number;
  level_rank: number | null;
  pokedex_count: number;
  pokedex_rank: number | null;
  shiny_count: number;
  shiny_rank: number | null;
  updated_at: string;
}

export function useRankings() {
  const { user } = useAuth();
  const [levelRankings, setLevelRankings] = useState<RankingEntry[]>([]);
  const [pokedexRankings, setPokedexRankings] = useState<RankingEntry[]>([]);
  const [shinyRankings, setShinyRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadRankings = async () => {
    try {
      setLoading(true);

      // Fetch level rankings (top 50)
      const { data: levelData, error: levelError } = await supabase
        .from('rankings')
        .select('id, user_id, nickname, avatar, level, experience_points, level_rank, pokedex_count, pokedex_rank, shiny_count, shiny_rank, updated_at')
        .not('level_rank', 'is', null)
        .order('level_rank', { ascending: true })
        .limit(50);

      if (levelError) throw levelError;

      // Fetch pokedex rankings (top 50)
      const { data: pokedexData, error: pokedexError } = await supabase
        .from('rankings')
        .select('id, user_id, nickname, avatar, level, experience_points, level_rank, pokedex_count, pokedex_rank, shiny_count, shiny_rank, updated_at')
        .not('pokedex_rank', 'is', null)
        .order('pokedex_rank', { ascending: true })
        .limit(50);

      if (pokedexError) throw pokedexError;

      // Fetch shiny rankings (top 50)
      const { data: shinyData, error: shinyError } = await supabase
        .from('rankings')
        .select('id, user_id, nickname, avatar, level, experience_points, level_rank, pokedex_count, pokedex_rank, shiny_count, shiny_rank, updated_at')
        .not('shiny_rank', 'is', null)
        .gt('shiny_count', 0)
        .order('shiny_rank', { ascending: true })
        .limit(50);

      if (shinyError) throw shinyError;

      setLevelRankings(levelData || []);
      setPokedexRankings(pokedexData || []);
      setShinyRankings(shinyData || []);

      // Get last update timestamp
      if (levelData && levelData.length > 0) {
        setLastUpdate(new Date(levelData[0].updated_at));
      }
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMyLevelPosition = (): number | null => {
    if (!user) return null;
    const myEntry = levelRankings.find(r => r.user_id === user.id);
    return myEntry?.level_rank || null;
  };

  const getMyPokedexPosition = (): number | null => {
    if (!user) return null;
    const myEntry = pokedexRankings.find(r => r.user_id === user.id);
    return myEntry?.pokedex_rank || null;
  };

  const getMyShinyPosition = (): number | null => {
    if (!user) return null;
    const myEntry = shinyRankings.find(r => r.user_id === user.id);
    return myEntry?.shiny_rank || null;
  };

  // OPTIMIZATION: Removed auto-loading on mount
  // Rankings are now loaded lazily when the RankingModal opens
  // This saves significant Egress by not loading rankings on every page load

  return {
    levelRankings,
    pokedexRankings,
    shinyRankings,
    loading,
    lastUpdate,
    getMyLevelPosition,
    getMyPokedexPosition,
    getMyShinyPosition,
    refreshRankings: loadRankings,
  };
}
