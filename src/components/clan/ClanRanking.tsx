import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClanEmblem } from './ClanEmblems';
import { useClan, ClanRanking as ClanRankingType } from '@/hooks/useClan';
import { Trophy, Users, Loader2, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ClanRanking = () => {
  const { t } = useTranslation(['clan']);
  const { getRankings, userClan } = useClan();
  
  const [rankings, setRankings] = useState<ClanRankingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [winnerClanIds, setWinnerClanIds] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getRankings();
      setRankings(data);
      
      // Load season winners
      const { data: winners } = await supabase
        .from('clan_season_winners')
        .select('clan_id, season_number')
        .order('season_number', { ascending: false });
      
      if (winners) {
        const map: Record<string, number[]> = {};
        winners.forEach((w: any) => {
          if (!map[w.clan_id]) map[w.clan_id] = [];
          map[w.clan_id].push(w.season_number);
        });
        setWinnerClanIds(map);
      }
      
      setLoading(false);
    };
    load();
  }, [getRankings]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="p-1.5 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 shadow-md"><Medal className="w-4 h-4 text-white" /></div>;
    if (rank === 2) return <div className="p-1.5 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 shadow-md"><Medal className="w-4 h-4 text-white" /></div>;
    if (rank === 3) return <div className="p-1.5 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 shadow-md"><Medal className="w-4 h-4 text-white" /></div>;
    return <span className="text-sm font-bold text-gray-700 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-lg bg-gray-100">
            <Trophy className="w-10 h-10 text-gray-700" />
          </div>
        </div>
        <p className="text-gray-500">{t('ranking.noRankings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="p-2 rounded-lg bg-gray-200">
          <Trophy className="w-5 h-5 text-gray-900" />
        </div>
        <h3 className="font-semibold text-lg text-gray-900">{t('ranking.title')}</h3>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {rankings.map((clan) => {
          const isUserClan = userClan?.clan?.id === clan.clan_id;
          const isTopThree = clan.rank <= 3;
          
          return (
            <Card 
              key={clan.clan_id} 
              className={`p-4 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md hover:scale-102 cursor-default ${
                isUserClan
                  ? 'bg-gradient-to-r from-gray-100 to-white border-gray-300'
                  : isTopThree
                  ? 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank */}
                  <div className="w-10 flex justify-center flex-shrink-0">
                    {getRankBadge(clan.rank)}
                  </div>

                  {/* Emblem */}
                  <ClanEmblem emblemId={clan.emblem} size="md" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-base truncate">{clan.name}</span>
                      {winnerClanIds[clan.clan_id] && (
                        <Badge className="text-xs font-bold bg-amber-500 text-white border-0">
                          🏆 {t('season.winner', { number: winnerClanIds[clan.clan_id][0] })}
                        </Badge>
                      )}
                      {isUserClan && (
                        <Badge className="text-xs font-bold bg-gray-900 text-white">
                          {t('ranking.yourClan')}
                        </Badge>
                      )}
                      {isTopThree && !isUserClan && (
                        <Badge className={`text-xs font-bold text-white ${
                          clan.rank === 1 ? 'bg-gray-900' :
                          clan.rank === 2 ? 'bg-gray-700' :
                          'bg-gray-600'
                        }`}>
                          Top {clan.rank}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Users className="w-3.5 h-3.5 text-gray-700" />
                        {clan.member_count} {t('ranking.members')}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded max-w-full">
                        <span className="shrink-0">👑</span>
                        <span className="truncate">{clan.leader_nickname}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="w-full sm:w-auto text-right flex-shrink-0">
                  <div className="bg-gray-900 px-3 py-2 rounded-lg inline-flex flex-col items-end w-full sm:w-auto">
                    <p className="text-sm font-bold text-white">{clan.total_points.toLocaleString()}</p>
                    <p className="text-xs text-gray-300">{t('ranking.points')}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
