import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClanEmblem } from './ClanEmblems';
import { ClanSearchResult } from '@/hooks/useClan';
import { Search, Users, Trophy, Loader2 } from 'lucide-react';

interface ClanSearchListProps {
  onJoinSuccess: () => void;
  searchClans: (search?: string) => Promise<ClanSearchResult[]>;
  joinClan: (clanId: string) => Promise<boolean>;
  userClanId?: string;
}

export const ClanSearchList = ({ onJoinSuccess, searchClans, joinClan, userClanId }: ClanSearchListProps) => {
  const { t } = useTranslation(['clan']);
  
  const [search, setSearch] = useState('');
  const [clans, setClans] = useState<ClanSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const doSearch = useCallback(async (query: string) => {
    setLoading(true);
    const results = await searchClans(query || undefined);
    setClans(results);
    setLoading(false);
  }, [searchClans]);

  useEffect(() => {
    const debounce = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(debounce);
  }, [search, doSearch]);

  const handleJoin = async (clanId: string) => {
    setJoining(clanId);
    const success = await joinClan(clanId);
    setJoining(null);
    if (success) {
      onJoinSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20 shadow-sm rounded-lg hover:border-gray-400 transition-colors"
        />
      </div>

      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : clans.filter(c => c.id !== userClanId).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t('search.noResults')}</p>
          </div>
        ) : (
          clans.filter(c => c.id !== userClanId).map((clan) => (
            <Card 
              key={clan.id} 
              className="p-4 bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:scale-102 transition-all duration-300 group cursor-default"
            >
              <div className="flex items-start gap-4">
                <ClanEmblem emblemId={clan.emblem} size="md" className="group-hover:scale-105 transition-transform duration-300" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-900 truncate text-base">{clan.name}</h4>
                    {clan.rank && (
                      <Badge className="text-xs bg-gray-900 text-white font-bold">
                        #{clan.rank}
                      </Badge>
                    )}
                  </div>
                  
                  {clan.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {clan.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      {clan.member_count}/{clan.max_members} {t('search.members')}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      <Trophy className="w-3.5 h-3.5" />
                      {clan.total_points.toLocaleString()} pts
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      Lvl {clan.min_level}+
                    </span>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleJoin(clan.id)}
                  disabled={joining === clan.id}
                  className={`flex-shrink-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-lg font-medium ${
                    clan.entry_type === 'approval'
                      ? 'bg-gray-700 hover:bg-gray-800'
                      : 'bg-gray-900 hover:bg-gray-800'
                  } text-white border-0`}
                >
                  {joining === clan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : clan.entry_type === 'approval' ? (
                    t('search.request')
                  ) : (
                    t('search.join')
                  )}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
