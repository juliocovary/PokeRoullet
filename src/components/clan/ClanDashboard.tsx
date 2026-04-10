import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClanEmblem } from './ClanEmblems';
import { ClanChat } from './ClanChat';
import { ClanMembersList } from './ClanMembersList';
import { ClanMissions } from './ClanMissions';
import { ClanSettings } from './ClanSettings';
import { UserClanData, ClanMember, useClan } from '@/hooks/useClan';
import { 
  Trophy, Users, Star, MessageCircle, 
  Settings, LogOut, Crown, Calendar, Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClanDashboardProps {
  clanData: UserClanData;
  members: ClanMember[];
  membersLoading: boolean;
  onLeaveClan: () => Promise<boolean>;
  onUpdateSettings: (clanId: string, description: string, emblem: string, entryType: string, minLevel: number) => Promise<boolean>;
  onManageMember: (targetUserId: string, clanId: string, action: string) => Promise<boolean>;
}

export const ClanDashboard = ({ clanData, members, membersLoading, onLeaveClan, onUpdateSettings, onManageMember }: ClanDashboardProps) => {
  const { t } = useTranslation(['clan']);
  const { getSeasonWinners } = useClan();
  
  const [view, setView] = useState<'overview' | 'chat' | 'members' | 'missions' | 'settings'>('overview');
  const [leaving, setLeaving] = useState(false);
  const [winnerSeasons, setWinnerSeasons] = useState<number[]>([]);

  const clan = clanData.clan!;
  const season = clanData.season_info;

  useEffect(() => {
    const loadWinners = async () => {
      const winners = await getSeasonWinners(clan.id);
      setWinnerSeasons(winners.map((w: any) => w.season_number));
    };
    loadWinners();
  }, [clan.id, getSeasonWinners]);

  const handleLeave = async () => {
    setLeaving(true);
    await onLeaveClan();
    setLeaving(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'leader': return t('members.leader');
      case 'vice_leader': return t('members.viceLeader');
      default: return t('members.member');
    }
  };

  return (
    <div className="space-y-5">
      {/* Clan Header - Clean Design */}
      <Card className="p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="p-6 flex items-center gap-6">
          <div className="relative">
            <ClanEmblem emblemId={clan.emblem} size="lg" className="relative" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {clan.name}
              </h3>
              {winnerSeasons.length > 0 && (
                <Badge className="text-xs font-bold bg-amber-500 text-white border-0">
                  🏆 {t('season.winner', { number: winnerSeasons[0] })}
                </Badge>
              )}
              <Badge className={`text-xs font-semibold ${
                clanData.my_role === 'leader' 
                  ? 'bg-gray-900 text-white'
                  : clanData.my_role === 'vice_leader'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {getRoleLabel(clanData.my_role || 'member')}
              </Badge>
            </div>
            {clan.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{clan.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Season Stats - Clean Grid */}
      {season && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Rank Card */}
          <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 mb-2 shadow-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('dashboard.rank')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">#{season.rank || '-'}</p>
          </Card>
          
          {/* Points Card */}
          <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800 mb-2 shadow-sm">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('dashboard.points')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{season.total_points.toLocaleString()}</p>
          </Card>
          
          {/* Members Card */}
          <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700 mb-2 shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('dashboard.members')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{clanData.member_count}/{clan.max_members}</p>
          </Card>
          
          {/* Season Card */}
          <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-600 mb-2 shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('dashboard.season')} {season.season_number}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{season.days_remaining} {t('dashboard.daysRemaining')}</p>
          </Card>
        </div>
      )}

      {/* My Contribution - Clean Bar */}
      <Card className="p-5 bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-900">{t('dashboard.myContribution')}</span>
              <p className="text-xs text-gray-500 mt-0.5">Your impact in this season</p>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {clanData.my_contribution?.toLocaleString() || 0} pts
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-800 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((clanData.my_contribution || 0) / 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs - Clean Style */}
      <div className="border-b border-gray-200 -mx-4 px-4">
        <div className="flex gap-1 overflow-x-auto pb-0">
          <button
            onClick={() => setView('overview')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${
              view === 'overview'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Crown className="w-4 h-4" />
            Overview
            {view === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>

          <button
            onClick={() => setView('chat')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${
              view === 'chat'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {t('dashboard.chat')}
            {view === 'chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>

          <button
            onClick={() => setView('members')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${
              view === 'members'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('dashboard.membersList')}
            {view === 'members' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>

          <button
            onClick={() => setView('missions')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${
              view === 'missions'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star className="w-4 h-4" />
            {t('dashboard.missions')}
            {view === 'missions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'overview' && (
        <div className="space-y-5 mt-6">
          {/* Quick Actions */}
          <div className="flex gap-3 flex-wrap">
            {(clanData.my_role === 'leader' || clanData.my_role === 'vice_leader') && (
              <Button 
                onClick={() => setView('settings')}
                className="gap-2 bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                {t('dashboard.settings')}
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  {t('dashboard.leave')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border-gray-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    {t('dashboard.leave')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    {t('dashboard.leaveConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLeave} 
                    disabled={leaving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('dashboard.leave')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Overview Info Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  <Trophy className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Clan Type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">{clan.entry_type}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  <Users className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Min Level</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Level {clan.min_level}+</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <ClanSettings
          clan={clan}
          members={members}
          myRole={clanData.my_role || 'member'}
          onUpdateSettings={onUpdateSettings}
          onManageMember={onManageMember}
        />
      )}

      {view === 'chat' && (
        <ClanChat clanId={clan.id} />
      )}

      {view === 'members' && (
        <ClanMembersList members={members} loading={membersLoading} />
      )}

      {view === 'missions' && (
        <ClanMissions clanId={clan.id} />
      )}
    </div>
  );
};
