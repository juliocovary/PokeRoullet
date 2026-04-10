import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, Trophy, Coins, Gem, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';

interface ClanMission {
  mission_id: string;
  mission_type: string;
  title: string;
  description: string;
  goal: number;
  frequency: string;
  reward_clan_points: number;
  reward_member_coins: number;
  reward_member_shards: number;
  reward_member_spins: number;
  current_progress: number;
  is_completed: boolean;
}

interface ClanMissionsProps {
  clanId: string;
}

const missionTypeToLocaleKey: Record<string, string> = {
  total_spins: 'totalSpins',
  rare_catches: 'rareCatches',
  total_sells: 'totalSells',
  missions_completed: 'missionsCompleted',
  shiny_catches: 'shinyCatches',
  trainer_enemies_defeated: 'trainerEnemiesDefeated',
};

export const ClanMissions = ({ clanId }: ClanMissionsProps) => {
  const { t } = useTranslation(['clan']);
  const [missions, setMissions] = useState<ClanMission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_clan_missions', {
        p_clan_id: clanId
      });
      if (error) throw error;
      setMissions((data as unknown as ClanMission[]) || []);
    } catch (error) {
      console.error('Error loading clan missions:', error);
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-lg bg-gray-200">
            <Target className="w-8 h-8 text-gray-700" />
          </div>
        </div>
        <p className="text-sm text-gray-600">{t('missions.noMissions')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1 mb-3">
        <div className="p-2 rounded-lg bg-gray-200">
          <Target className="w-5 h-5 text-gray-900" />
        </div>
        <h4 className="font-semibold text-lg text-gray-900">{t('missions.title')}</h4>
        <Badge className="bg-gray-200 text-gray-700 ml-auto">
          {missions.filter(m => !m.is_completed).length} {t('missions.active')}{missions.filter(m => !m.is_completed).length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {missions.map((mission) => {
        const progressPercent = Math.min((mission.current_progress / mission.goal) * 100, 100);
        const isCompleted = mission.is_completed;
        const missionLocaleKey = missionTypeToLocaleKey[mission.mission_type];
        const translatedTitle = missionLocaleKey
          ? t(`missions.collectiveMissions.${missionLocaleKey}.title`, { defaultValue: mission.title })
          : mission.title;
        const translatedDescription = missionLocaleKey
          ? t(`missions.collectiveMissions.${missionLocaleKey}.description`, { defaultValue: mission.description })
          : mission.description;

        return (
          <Card 
            key={mission.mission_id} 
            className={`p-4 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:scale-102 cursor-default ${
              isCompleted
                ? 'bg-gradient-to-r from-gray-100 to-white border-gray-200'
                : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isCompleted ? (
                    <div className="p-1 rounded-full bg-gray-200">
                      <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-gray-200">
                      <Target className="w-4 h-4 text-gray-700 shrink-0" />
                    </div>
                  )}
                  <span className={`font-semibold truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {translatedTitle}
                  </span>
                </div>
                {translatedDescription && (
                  <p className={`text-xs ml-6 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                    {translatedDescription}
                  </p>
                )}
              </div>
              <Badge 
                className={`text-[10px] font-bold flex-shrink-0 ${
                  mission.frequency === 'weekly' 
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {mission.frequency === 'weekly' ? t('missions.weekly') : t('missions.monthly')}
              </Badge>
            </div>

            {!isCompleted && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">{t('missions.progress')}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {mission.current_progress.toLocaleString()} / {mission.goal.toLocaleString()}
                      <span className="text-gray-900 ml-1 font-semibold">{Math.round(progressPercent)}%</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-800 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 text-[11px] text-gray-700 flex-wrap">
              {mission.reward_clan_points > 0 && (
                <span className="flex items-center gap-1 bg-gray-200 px-2.5 py-1 rounded-full">
                  <Trophy className="w-3.5 h-3.5 text-gray-800" />
                  <span className="font-semibold">+{mission.reward_clan_points} pts</span>
                </span>
              )}
              {mission.reward_member_coins > 0 && (
                <span className="flex items-center gap-1 bg-gray-200 px-2.5 py-1 rounded-full">
                  <Coins className="w-3.5 h-3.5 text-gray-800" />
                  <span className="font-semibold">+{mission.reward_member_coins}</span>
                </span>
              )}
              {mission.reward_member_shards > 0 && (
                <span className="flex items-center gap-1 bg-gray-200 px-2.5 py-1 rounded-full">
                  <Gem className="w-3.5 h-3.5 text-gray-800" />
                  <span className="font-semibold">+{mission.reward_member_shards}</span>
                </span>
              )}
              {mission.reward_member_spins > 0 && (
                <span className="flex items-center gap-1 bg-gray-200 px-2.5 py-1 rounded-full">
                  <RotateCcw className="w-3.5 h-3.5 text-gray-800" />
                  <span className="font-semibold">+{mission.reward_member_spins}</span>
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
