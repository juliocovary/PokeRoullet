import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { ProfileModal } from './ProfileModal';
import { FriendsModal } from './FriendsModal';
import { MissionsModal } from './MissionsModal';
import { RankingModal } from './RankingModal';
import { LaunchEventModal } from './LaunchEventModal';
import { NewsModal } from './NewsModal';
import { ClanModal } from './ClanModal';
import { supabase } from '@/integrations/supabase/client';
import { fetchActiveLaunchEventStatus } from '@/hooks/launchEventStatusCache';
import { User, Users, Star, Sparkles, Trophy, LogIn, Newspaper, Gamepad2, Shield } from 'lucide-react';
import pokeballIcon from '@/assets/pokeball_icon.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  pokécoins: number;
  nickname?: string;
  onOpenAchievements?: () => void;
  onOpenPokedex?: () => void;
}

export const Header = ({
  pokécoins,
  nickname = "Treinador",
  onOpenAchievements,
  onOpenPokedex
}: HeaderProps) => {
  const {
    t
  } = useTranslation(['common', 'modals', 'missions', 'event', 'trainer']);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    getAvatarSrc,
    getXPProgress
  } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showClanModal, setShowClanModal] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);
  const [eventDaysRemaining, setEventDaysRemaining] = useState<number | null>(null);
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const isMobile = useIsMobile();
  const xpProgress = getXPProgress();

  // OPTIMIZATION: Lightweight unread count query (single RPC call)
  const fetchUnreadNewsCount = useCallback(async () => {
    if (!user) {
      setUnreadNewsCount(0);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('get_unread_news_count', {
        p_user_id: user.id
      });
      
      if (!error && data !== null) {
        setUnreadNewsCount(data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    fetchUnreadNewsCount();
  }, [fetchUnreadNewsCount]);

  // OPTIMIZATION: Light check for event active status (only once on mount)
  // This avoids loading full event data, just checks if event exists
  useEffect(() => {
    const checkEventStatus = async () => {
      const data = await fetchActiveLaunchEventStatus();
      if (data?.is_active) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        if (endDate > now) {
          setIsEventActive(true);
          const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setEventDaysRemaining(diffDays);
          return;
        }
      }

      setIsEventActive(false);
      setEventDaysRemaining(null);
    };
    checkEventStatus();
  }, []);

  const handleCloseNewsModal = useCallback(() => {
    setShowNewsModal(false);
    void fetchUnreadNewsCount();
  }, [fetchUnreadNewsCount]);

  return <>
      <header className="w-full p-2 md:p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex justify-end md:justify-between items-center max-w-7xl mx-auto gap-2">
          {/* Logo and Missions */}
          <div className="flex items-center space-x-2 md:space-x-3 md:flex-1">
            <div className="flex flex-col items-center space-y-1 md:space-y-2">
              <div className="flex items-center space-x-2 md:space-x-3">
              <div className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} animate-spin flex-shrink-0`} style={{
                animationDuration: '8s'
              }}>
                  <img src={pokeballIcon} alt="Pokeball" className="w-full h-full" />
                </div>
                <div className="hidden md:block">
                  <img src={pokeroulletLogo} alt="PokeRoullet" className="h-16" />
                </div>
              </div>
              
              {/* Mode Toggle and Buttons - Hidden on mobile and when not logged in */}
              {!isMobile && user && <div className="flex gap-2 items-center">
                  {/* Trainer Mode Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/trainer')}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-pink-500/20"
                  >
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-medium">{t('trainer:mode.trainerMode')}</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowMissionsModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100">
                    <span className="text-amber-700 font-medium">{t('modals:profile.missions')}</span>
                  </Button>
                  
                  {onOpenAchievements && <Button variant="outline" size="sm" onClick={onOpenAchievements} className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100">
                      <span className="text-yellow-700 font-medium">{t('modals:profile.achievements')}</span>
                    </Button>}
                  
                  <Button variant="outline" size="sm" onClick={() => setShowRankingModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100">
                    <Trophy className="w-4 h-4 text-blue-700" />
                    <span className="text-blue-700 font-medium">{t('modals:ranking.title').replace('🏆 ', '')}</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowNewsModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 relative">
                    <Newspaper className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-700 font-medium">{t('modals:news.title').replace('📰 ', '')}</span>
                    {unreadNewsCount > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center animate-pulse">
                        {unreadNewsCount}
                      </Badge>}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowClanModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 hover:from-indigo-100 hover:to-violet-100">
                    <Shield className="w-4 h-4 text-indigo-700" />
                    <span className="text-indigo-700 font-medium">Clã</span>
                  </Button>
                </div>}
            </div>
          </div>

          {/* Center - XP Progress (Desktop) */}
          {profile && <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>{t('common:level')} {profile.level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {xpProgress.current}/{xpProgress.needed} {t('common:xp')}
                  </span>
                </div>
              </div>
              <Progress value={xpProgress.percentage} className="h-2" />
            </div>}

          {/* User Info */}
          <div className="flex items-center space-x-1 md:space-x-3">
            {/* Show Login button if user is not logged in */}
            {!user ? <Button onClick={() => navigate('/auth')} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Login</span>
              </Button> : <>
                {/* Action Buttons - Desktop only */}
                {!isMobile && <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFriendsModal(true)} className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('modals:profile.friends')}
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => setShowProfileModal(true)} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('modals:profile.title').replace('👤 ', '').replace(' do Treinador', '').replace(' Trainer Profile', '')}
                    </Button>
                  </div>}

                {/* User Info Card */}
                <Card className={`${isMobile ? 'px-2 py-1' : 'px-3 py-2'} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setShowProfileModal(true)}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    {/* Avatar */}
                    {profile && <div className="relative">
                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden border-2 border-primary/30`}>
                          <img src={getAvatarSrc(profile.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 bg-primary text-primary-foreground ${isMobile ? 'px-0.5' : 'px-1'} rounded-full text-xs flex items-center gap-0.5`}>
                          <Star className={isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} />
                          {profile.level}
                        </div>
                      </div>}

                    {!isMobile && <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('common:hello', {
                      defaultValue: 'Hello'
                    })},</p>
                        <p className="font-bold text-sm">{profile?.nickname || nickname}</p>
                      </div>}
                  </div>
                </Card>

                {/* Pokécoins - Compact in mobile */}
                <Card className={`${isMobile ? 'px-2 py-1' : 'px-3 py-2'} bg-gradient-to-r from-yellow-400 to-yellow-600 ${isMobile ? 'min-w-[70px]' : 'min-w-[110px]'}`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                    <img src={pokecoinIcon} alt="Pokecoin" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                    <div className="min-w-0">
                      {!isMobile && <p className="text-xs text-yellow-900 font-medium whitespace-nowrap">{t('common:currency.pokecoins')}</p>}
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-yellow-900 whitespace-nowrap truncate`}>{profile?.pokecoins?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </Card>

                {/* PokeShards - Compact in mobile */}
                <Card className={`${isMobile ? 'px-2 py-1' : 'px-3 py-2'} bg-gradient-to-r from-purple-400 to-purple-600 ${isMobile ? 'min-w-[70px]' : 'min-w-[110px]'}`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                    <img src={pokeshardIcon} alt="PokeShard" className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                    <div className="min-w-0">
                      {!isMobile && <p className="text-xs text-purple-900 font-medium whitespace-nowrap">{t('common:currency.pokeshards')}</p>}
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-purple-900 whitespace-nowrap truncate`}>{profile?.pokeshards?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </Card>

                {/* Mobile Actions */}
                {isMobile && <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/trainer')} 
                      className="p-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                    >
                      <Gamepad2 className="w-4 h-4 text-purple-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowRankingModal(true)} className="p-1">
                      <Trophy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowClanModal(true)} className="p-1">
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowFriendsModal(true)} className="p-1">
                      <Users className="w-4 h-4" />
                    </Button>
                  </>}
              </>}
          </div>
        </div>
      </header>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <FriendsModal isOpen={showFriendsModal} onClose={() => setShowFriendsModal(false)} />
      <MissionsModal isOpen={showMissionsModal} onClose={() => setShowMissionsModal(false)} />
      <RankingModal isOpen={showRankingModal} onClose={() => setShowRankingModal(false)} />
      <LaunchEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
      <NewsModal isOpen={showNewsModal} onClose={handleCloseNewsModal} />
      <ClanModal isOpen={showClanModal} onClose={() => setShowClanModal(false)} />
    </>;
};