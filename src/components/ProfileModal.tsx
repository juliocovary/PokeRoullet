import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfile, AVAILABLE_AVATARS } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useAchievements } from '@/hooks/useAchievements';
import { useIsMobile } from '@/hooks/use-mobile';
import { Trophy, Star, Sparkles, LogOut, Medal, Target, Award, X, Clover, Clock, BarChart3 } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { PromoCodeSection } from './PromoCodeSection';
import { useTranslation } from 'react-i18next';
import { useBooster } from '@/hooks/useBooster';
import { UserStatisticsCard } from './UserStatisticsCard';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { t } = useTranslation();
  const { profile, loading, updateProfile, getAvatarSrc, getXPProgress } = useProfile();
  const { signOut } = useAuth();
  const { missions, loadMissions, claimMissionRewards, getDailyMissions, getWeeklyMissions } = useMissions();
  const { achievements, loadAchievements, claimAchievementRewards, getUniqueAchievements, getProgressiveAchievements, getAchievementProgress } = useAchievements();
  const { isShinyBoostActive, isLuckBoostActive, shinyBoostTimeRemaining, luckBoostTimeRemaining } = useBooster();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [, setTick] = useState(0);

  // Update every minute to refresh time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load missions and achievements when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMissions();
      loadAchievements();
    }
  }, [isOpen]);

  const handleEditStart = () => {
    if (profile) {
      setEditNickname(profile.nickname);
      setSelectedAvatar(profile.avatar);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Client-side validation
    const trimmedNickname = editNickname.trim();
    
    if (trimmedNickname.length < 3 || trimmedNickname.length > 20) {
      return; // Server will show the error toast
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedNickname)) {
      return; // Server will show the error toast
    }

    const success = await updateProfile({
      nickname: trimmedNickname,
      avatar: selectedAvatar
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditNickname('');
    setSelectedAvatar('');
  };

  if (loading || !profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full sm:max-w-2xl h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden p-0 [&>button]:hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const xpProgress = getXPProgress();
  const dailyMissions = getDailyMissions();
  const weeklyMissions = getWeeklyMissions();
  const uniqueAchievements = getUniqueAchievements();
  const progressiveAchievements = getProgressiveAchievements();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden p-0 [&>button]:hidden">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 shrink-0 relative">
          <DialogTitle className="text-center text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('modals:profile.title')}
          </DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 sm:right-6 sm:top-6 h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="perfil" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 sm:mx-6 mb-3 sm:mb-4 h-11 sm:h-10 shrink-0 grid grid-cols-4">
            <TabsTrigger value="perfil" className="text-xs sm:text-sm">{t('modals:profile.stats')}</TabsTrigger>
            <TabsTrigger value="estatisticas" className="text-xs sm:text-sm flex items-center gap-1">
              <BarChart3 className="w-3 h-3 hidden sm:inline" />
              <span>{t('modals:profile.statsTab', { defaultValue: 'Estatísticas' })}</span>
            </TabsTrigger>
            <TabsTrigger value="missoes" className="text-xs sm:text-sm">{t('modals:profile.missions')}</TabsTrigger>
            <TabsTrigger value="conquistas" className="text-xs sm:text-sm">{t('modals:profile.achievements')}</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="flex-1 overflow-hidden m-0 px-3 sm:px-6">
            <ScrollArea className="h-full w-full">
              <div className="space-y-4 sm:space-y-6 pb-6 pr-3">
                {/* Profile Header */}
                <Card className="p-3 sm:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
                        <img 
                          src={getAvatarSrc(profile.avatar)} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {t('modals:profile.level')} {profile.level}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">{profile.nickname}</h3>
                      <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <span className="text-base sm:text-lg">🪙</span>
                          <span className="font-semibold text-sm sm:text-base">{profile.pokecoins.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold text-sm sm:text-base">{profile.experience_points} XP</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                      {!isEditing && (
                        <Button onClick={handleEditStart} variant="outline" size={isMobile ? "default" : "sm"} className="flex-1 sm:flex-none">
                          ✏️ {t('modals:profile.edit')}
                        </Button>
                      )}
                      <Button 
                        onClick={signOut} 
                        variant="destructive" 
                        size={isMobile ? "default" : "sm"}
                        className="flex items-center gap-1 flex-1 sm:flex-none"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('modals:profile.logout')}
                      </Button>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="mt-4 sm:mt-6">
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                      <span>{t('modals:profile.level')} {profile.level + 1}</span>
                      <span>{xpProgress.current}/{xpProgress.needed} XP</span>
                    </div>
                    <Progress value={xpProgress.percentage} className="h-2 sm:h-3" />
                  </div>

                  {/* Luck and XP Multiplier Info */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary/10">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {/* Luck Multiplier */}
                      <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-emerald-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clover className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-300">{t('modals:boosters.luck', { defaultValue: 'Sorte' })}</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                          {(profile.luck_multiplier * (isLuckBoostActive ? 2 : 1)).toFixed(1)}x
                        </div>
                        {isLuckBoostActive && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{luckBoostTimeRemaining}</span>
                          </div>
                        )}
                      </div>

                      {/* XP Multiplier */}
                      <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-blue-600" />
                          <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300">{t('modals:boosters.xpMultiplier', { defaultValue: 'Multiplicador de XP' })}</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                          {profile.xp_multiplier.toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Edit Form */}
                {isEditing && (
                  <Card className="p-3 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold mb-4">{t('modals:profile.editProfile')}</h4>
                    
                    {/* Nickname */}
                    <div className="space-y-2 mb-4 sm:mb-6">
                      <Label htmlFor="nickname">{t('modals:profile.nickname')}</Label>
                      <Input
                        id="nickname"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder={t('modals:profile.nickname')}
                      />
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-3 mb-4 sm:mb-6">
                      <Label>{t('modals:profile.chooseAvatar')}</Label>
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {AVAILABLE_AVATARS.map((avatar) => (
                          <div
                            key={avatar.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedAvatar === avatar.id
                                ? 'ring-4 ring-primary scale-105'
                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedAvatar(avatar.id)}
                          >
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-border">
                              <img 
                                src={avatar.src} 
                                alt={avatar.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center mt-1 font-medium">{avatar.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex gap-3">
                      <Button onClick={handleSave} className="flex-1 h-11">
                        💾 {t('modals:profile.save')}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" className="flex-1 h-11">
                        ❌ {t('modals:profile.cancel')}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Card className="p-2 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🏆</div>
                    <div className="text-lg sm:text-2xl font-bold text-primary">{profile.level}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{t('modals:profile.level')}</div>
                  </Card>
                  
                  <Card className="p-2 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⚡</div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">{profile.experience_points}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{t('modals:profile.totalXP')}</div>
                  </Card>
                  
                  <Card className="p-2 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🪙</div>
                    <div className="text-lg sm:text-2xl font-bold text-yellow-600">{profile.pokecoins}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Pokécoins</div>
                  </Card>
                </div>

                {/* Promo Codes */}
                <PromoCodeSection />

                {/* Language Selector */}
                <Card className="p-3 sm:p-4">
                  <h4 className="text-sm font-semibold mb-3">🌐 Idioma / Language</h4>
                  <LanguageSelector />
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="estatisticas" className="flex-1 overflow-hidden m-0 px-3 sm:px-6">
            <ScrollArea className="h-full w-full">
              <div className="pb-6 pr-3">
                <UserStatisticsCard />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="missoes" className="flex-1 overflow-hidden m-0 px-3 sm:px-6">
            <ScrollArea className="h-full w-full">
              <div className="space-y-3 sm:space-y-4 pb-6 pr-3">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('missions:dailyTab')}
                  </h3>
                  {dailyMissions.map((mission) => (
                    <Card key={mission.id} className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{mission.title}</h4>
                          <p className="text-xs text-muted-foreground">{mission.description}</p>
                          <div className="mt-2">
                            <Progress value={(mission.progress / mission.goal) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{mission.progress}/{mission.goal}</p>
                          </div>
                        </div>
                        {mission.completed && !mission.rewards_claimed && (
                          <Button 
                            onClick={() => claimMissionRewards(mission.id)}
                            size={isMobile ? "default" : "sm"}
                            className="shrink-0 h-9 sm:h-8"
                          >
                            {t('missions:claim')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('missions:weeklyTab')}
                  </h3>
                  {weeklyMissions.map((mission) => (
                    <Card key={mission.id} className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{mission.title}</h4>
                          <p className="text-xs text-muted-foreground">{mission.description}</p>
                          <div className="mt-2">
                            <Progress value={(mission.progress / mission.goal) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{mission.progress}/{mission.goal}</p>
                          </div>
                        </div>
                        {mission.completed && !mission.rewards_claimed && (
                          <Button 
                            onClick={() => claimMissionRewards(mission.id)}
                            size={isMobile ? "default" : "sm"}
                            className="shrink-0 h-9 sm:h-8"
                          >
                            {t('missions:claim')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conquistas" className="flex-1 overflow-hidden m-0 px-3 sm:px-6">
            <ScrollArea className="h-full w-full">
              <div className="space-y-3 sm:space-y-4 pb-6 pr-3">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('missions:achievements.uniqueAchievements')}
                  </h3>
                  {uniqueAchievements.map((achievement) => {
                    const progress = getAchievementProgress(achievement);
                    return (
                      <Card key={achievement.id} className="p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{achievement.title}</h4>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            <div className="mt-2">
                              <Progress value={progress.percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{progress.current}/{progress.target}</p>
                            </div>
                          </div>
                          {achievement.is_completed && !achievement.rewards_claimed && (
                            <Button 
                              onClick={() => claimAchievementRewards(achievement.id)}
                              size={isMobile ? "default" : "sm"}
                              className="shrink-0 h-9 sm:h-8"
                            >
                              {t('missions:claim')}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('missions:achievements.progressiveAchievements')}
                  </h3>
                  {progressiveAchievements.map((achievement) => {
                    const progress = getAchievementProgress(achievement);
                    return (
                      <Card key={achievement.id} className="p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{achievement.title}</h4>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            <div className="mt-2">
                              <Progress value={progress.percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{progress.current}/{progress.target}</p>
                            </div>
                          </div>
                          {progress.current >= progress.target && !achievement.rewards_claimed && (
                            <Button 
                              onClick={() => claimAchievementRewards(achievement.id)}
                              size={isMobile ? "default" : "sm"}
                              className="shrink-0 h-9 sm:h-8"
                            >
                              {t('missions:claim')}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};