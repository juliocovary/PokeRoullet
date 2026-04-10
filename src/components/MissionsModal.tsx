import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Coins, Star, Gem, Gift, Timer, X } from 'lucide-react';
import { useMissions, Mission } from '@/hooks/useMissions';
import { Skeleton } from '@/components/ui/skeleton';
import { useMissionTimer } from '@/hooks/useMissionTimer';
import { useTranslation } from 'react-i18next';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MissionCardProps {
  mission: Mission;
  onClaimRewards?: (missionId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const MissionCard = ({ mission, onClaimRewards, t }: MissionCardProps) => {
  const progressPercent = Math.min((mission.progress || 0) / mission.goal * 100, 100);
  const isCompleted = mission.completed;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spin': return '🎰';
      case 'sell': return '💰';
      case 'catch_rare': return '✨';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'daily' ? 'bg-blue-500' : 'bg-purple-500';
  };

  // Generate translation key based on category and type
  const getMissionTranslationKey = (category: string, type: string) => {
    return `${category}_${type}`;
  };

  const translationKey = getMissionTranslationKey(mission.category, mission.type);
  const translatedTitle = t(`missions:missionTitles.${translationKey}`, { defaultValue: mission.title });
  const translatedDescription = t(`missions:missionDescriptions.${translationKey}`, { 
    goal: mission.goal,
    defaultValue: mission.description 
  });

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'border-green-200 bg-green-50/50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getCategoryIcon(mission.category)}</div>
            <div>
              <CardTitle className="text-base font-medium">{translatedTitle}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {translatedDescription}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-white ${getTypeColor(mission.type)}`}
            >
              {t(`missions:type.${mission.type}`)}
            </Badge>
            {isCompleted && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('missions:progress')}</span>
              <span className="font-medium">
                {mission.progress || 0} / {mission.goal}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2"
            />
          </div>

          {/* Rewards */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm font-medium text-muted-foreground mb-2">{t('missions:rewards')}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{mission.reward_coins}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-blue-500" />
                <span>{mission.reward_xp} XP</span>
              </div>
              {mission.reward_shards > 0 && (
                <div className="flex items-center gap-1">
                  <Gem className="w-4 h-4 text-purple-500" />
                  <span>{mission.reward_shards}</span>
                </div>
              )}
            </div>
          </div>

          {/* Completion Status */}
          {isCompleted && !mission.rewards_claimed && (
            <Button 
              onClick={() => onClaimRewards?.(mission.id)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t('missions:claimRewards')}
            </Button>
          )}
          {isCompleted && mission.rewards_claimed && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t('missions:rewardsClaimed')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const MissionsModal = ({ isOpen, onClose }: MissionsModalProps) => {
  const { t } = useTranslation();
  const { missions, loading, loadMissions, getDailyMissions, getWeeklyMissions, getDailyProgress, getWeeklyProgress, claimMissionRewards, claimDailyCompletionBonus, claimWeeklyCompletionBonus, isDailyBonusClaimed, isWeeklyBonusClaimed } = useMissions();
  const { formatDailyTime, formatWeeklyTime } = useMissionTimer();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dailyBonusJustClaimed, setDailyBonusJustClaimed] = useState(false);
  const [weeklyBonusJustClaimed, setWeeklyBonusJustClaimed] = useState(false);

  // OPTIMIZATION: Lazy loading - only load missions when modal opens
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadMissions().then(() => setHasLoaded(true));
    }
    // Reset hasLoaded and claimed states when modal closes so it reloads next time (for fresh data)
    if (!isOpen) {
      setHasLoaded(false);
      setDailyBonusJustClaimed(false);
      setWeeklyBonusJustClaimed(false);
    }
  }, [isOpen, hasLoaded, loadMissions]);

  const dailyMissions = getDailyMissions();
  const weeklyMissions = getWeeklyMissions();
  const dailyProgress = getDailyProgress();
  const weeklyProgress = getWeeklyProgress();

  const handleClaimRewards = async (missionId: string) => {
    await claimMissionRewards(missionId);
  };

  const handleClaimDailyBonus = async () => {
    await claimDailyCompletionBonus();
    setDailyBonusJustClaimed(true);
  };

  const handleClaimWeeklyBonus = async () => {
    await claimWeeklyCompletionBonus();
    setWeeklyBonusJustClaimed(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-0 flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {t('missions:title')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="daily" className="flex flex-col flex-1 p-6 pt-4 min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-6 flex-shrink-0">
            <TabsTrigger 
              value="daily" 
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {t('missions:dailyTab')} ({dailyProgress.completed}/{dailyProgress.total})
            </TabsTrigger>
            <TabsTrigger 
              value="weekly"
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {t('missions:weeklyTab')} ({weeklyProgress.completed}/{weeklyProgress.total})
            </TabsTrigger>
          </TabsList>

          {/* Timer Section */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg flex-shrink-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium text-foreground">{t('missions:dailyReset')}</p>
                  <p className="text-muted-foreground">{formatDailyTime()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium text-foreground">{t('missions:weeklyReset')}</p>
                  <p className="text-muted-foreground">{formatWeeklyTime()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <TabsContent value="daily" className="mt-0 h-full">
              <div className="space-y-4 pb-8 px-1">
                {loading ? (
                  <LoadingSkeleton />
                ) : dailyMissions.length > 0 ? (
                  <>
                    {/* Daily Completion Bonus */}
                    {dailyProgress.completed === dailyProgress.total && dailyProgress.total > 0 && (
                      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">🏆</div>
                              <div>
                                <h3 className="font-semibold text-amber-800">
                                  {t('missions:dailyBonus')}
                                </h3>
                                <p className="text-sm text-amber-700">
                                  15 Pokecoins + 15 PokeShards + 100 XP
                                </p>
                              </div>
                            </div>
                            {!isDailyBonusClaimed() && !dailyBonusJustClaimed && (
                              <Button 
                                onClick={handleClaimDailyBonus}
                                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                              >
                                <Gift className="w-4 h-4 mr-2" />
                                {t('missions:claimBonus')}
                              </Button>
                            )}
                            {(isDailyBonusClaimed() || dailyBonusJustClaimed) && (
                              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-lg px-3 py-2 border border-amber-300">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('missions:bonusCollected')}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {dailyMissions.map((mission) => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        onClaimRewards={handleClaimRewards}
                        t={t}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-muted-foreground">{t('missions:noDailyMissions')}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="mt-0 h-full">
              <div className="space-y-4 pb-8 px-1">
                {loading ? (
                  <LoadingSkeleton />
                ) : weeklyMissions.length > 0 ? (
                  <>
                    {/* Weekly Completion Bonus */}
                    {weeklyProgress.completed === weeklyProgress.total && weeklyProgress.total > 0 && (
                      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">🏆</div>
                              <div>
                                <h3 className="font-semibold text-purple-800">
                                  {t('missions:weeklyBonus')}
                                </h3>
                                <p className="text-sm text-purple-700">
                                  75 Pokecoins + 50 PokeShards + 250 XP
                                </p>
                              </div>
                            </div>
                            {!isWeeklyBonusClaimed() && !weeklyBonusJustClaimed && (
                              <Button 
                                onClick={handleClaimWeeklyBonus}
                                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                              >
                                <Gift className="w-4 h-4 mr-2" />
                                {t('missions:claimBonus')}
                              </Button>
                            )}
                            {(isWeeklyBonusClaimed() || weeklyBonusJustClaimed) && (
                              <div className="flex items-center gap-2 text-purple-700 bg-purple-100 rounded-lg px-3 py-2 border border-purple-300">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('missions:bonusCollected')}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {weeklyMissions.map((mission) => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        onClaimRewards={handleClaimRewards}
                        t={t}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-muted-foreground">{t('missions:noWeeklyMissions')}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};