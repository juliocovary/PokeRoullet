import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TrainerRankingEntry {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  highest_stage: number;
  highest_stage_rank: number | null;
  total_pokemon_defeated: number;
  defeated_rank: number | null;
  updated_at: string;
}

export function useTrainerRankings() {
  const { user } = useAuth();
  const [stageRankings, setStageRankings] = useState<TrainerRankingEntry[]>([]);
  const [defeatedRankings, setDefeatedRankings] = useState<TrainerRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadRankings = async () => {
    try {
      setLoading(true);

      // Fetch stage rankings (top 50)
      const { data: stageData, error: stageError } = await supabase
        .from('trainer_rankings')
        .select('id, user_id, nickname, avatar, highest_stage, highest_stage_rank, total_pokemon_defeated, defeated_rank, updated_at')
        .not('highest_stage_rank', 'is', null)
        .gt('highest_stage', 0)
        .order('highest_stage_rank', { ascending: true })
        .limit(50);

      if (stageError) throw stageError;

      // Fetch defeated rankings (top 50)
      const { data: defeatedData, error: defeatedError } = await supabase
        .from('trainer_rankings')
        .select('id, user_id, nickname, avatar, highest_stage, highest_stage_rank, total_pokemon_defeated, defeated_rank, updated_at')
        .not('defeated_rank', 'is', null)
        .gt('total_pokemon_defeated', 0)
        .order('defeated_rank', { ascending: true })
        .limit(50);

      if (defeatedError) throw defeatedError;

      setStageRankings((stageData as TrainerRankingEntry[]) || []);
      setDefeatedRankings((defeatedData as TrainerRankingEntry[]) || []);

      // Get last update timestamp
      if (stageData && stageData.length > 0) {
        setLastUpdate(new Date((stageData[0] as TrainerRankingEntry).updated_at));
      }
    } catch (error) {
      console.error('Error loading trainer rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMyStagePosition = (): number | null => {
    if (!user) return null;
    const myEntry = stageRankings.find(r => r.user_id === user.id);
    return myEntry?.highest_stage_rank || null;
  };

  const getMyDefeatedPosition = (): number | null => {
    if (!user) return null;
    const myEntry = defeatedRankings.find(r => r.user_id === user.id);
    return myEntry?.defeated_rank || null;
  };

  return {
    stageRankings,
    defeatedRankings,
    loading,
    lastUpdate,
    getMyStagePosition,
    getMyDefeatedPosition,
    refreshRankings: loadRankings,
  };
}
