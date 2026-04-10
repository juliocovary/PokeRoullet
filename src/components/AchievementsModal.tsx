import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Target, Coins, Zap, Star, Sparkles, Gift, X, Swords, Shield, Palette, MapPin } from 'lucide-react';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { useTranslation } from 'react-i18next';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AchievementCard: React.FC<{ achievement: Achievement; getProgress: (achievement: Achievement) => any; onClaimRewards: (achievementId: string) => void; t: (key: string, options?: Record<string, unknown>) => string }> = ({ 
  achievement, 
  getProgress,
  onClaimRewards,
  t
}) => {
  const progress = getProgress(achievement);
  
  // Para conquistas únicas: verifica se está completa
  // Para conquistas progressivas: verifica se atingiu a meta atual E tem completed_at (pronto para coletar)
  const isCompleted = achievement.category === 'unique' 
    ? achievement.is_completed 
    : (achievement.progress >= achievement.next_goal_value && achievement.completed_at !== null);
  
  const canClaimRewards = isCompleted && !achievement.rewards_claimed;

  const getAchievementIcon = () => {
    switch (achievement.goal_type) {
      case 'level':
        return <Crown className="w-6 h-6" />;
      case 'spins':
        return <Target className="w-6 h-6" />;
      case 'legendary_capture':
        return <Star className="w-6 h-6" />;
      case 'sales':
        return <Coins className="w-6 h-6" />;
      case 'trainer_defeats':
        return <Swords className="w-6 h-6" />;
      case 'trainer_stage':
        return <Shield className="w-6 h-6" />;
      case 'shiny_capture':
        return <Palette className="w-6 h-6" />;
      case 'region_unlock':
        return <MapPin className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  // Generate translation key based on goal_type and category
  const getAchievementTranslationKey = () => {
    const goalType = achievement.goal_type;
    const category = achievement.category;
    
    // For level achievements, include the goal value
    if (goalType === 'level') {
      return `level_${achievement.next_goal_value}_${category}`;
    }
    // For spins unique achievements
    if (goalType === 'spins' && category === 'unique') {
      return `spins_150_${category}`;
    }
    // For trainer_stage unique achievements, include goal value
    if (goalType === 'trainer_stage' && category === 'unique') {
      return `trainer_stage_${achievement.goal_value}_${category}`;
    }
    return `${goalType}_${category}`;
  };

  const getTranslatedTitle = () => {
    const key = getAchievementTranslationKey();
    return t(`missions:achievementTitles.${key}`, { defaultValue: achievement.title });
  };

  const getTranslatedDescription = () => {
    const key = getAchievementTranslationKey();
    return t(`missions:achievementDescriptions.${key}`, { 
      goal: achievement.next_goal_value,
      defaultValue: achievement.description 
    });
  };

  const getRewardText = () => {
    const rewards = [];
    if (achievement.base_reward_coins > 0) rewards.push(`${achievement.base_reward_coins} coins`);
    if (achievement.base_reward_xp > 0) rewards.push(`${achievement.base_reward_xp} XP`);
    if (achievement.base_reward_shards > 0) {
      // For progressive achievements, calculate current reward
      if (achievement.category === 'progressive' && achievement.completed_count > 0) {
        const currentReward = achievement.base_reward_shards + (achievement.completed_count * achievement.reward_increment);
        rewards.push(`${currentReward} shards`);
      } else {
        rewards.push(`${achievement.base_reward_shards} shards`);
      }
    }
    if (achievement.base_reward_spins > 0) rewards.push(`${achievement.base_reward_spins} ${t('missions:achievements.eternalSpins')}`);
    if ((achievement as any).base_reward_badge) rewards.push(t('missions:achievements.randomBadge'));
    return rewards.join(', ');
  };

  return (
    <Card className={`relative transition-all duration-300 ${
      isCompleted 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20' 
        : 'hover:border-primary/50'
    }`}>
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full animate-pulse">
            <Trophy className="w-4 h-4 text-yellow-900" />
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            isCompleted ? 'bg-yellow-400 text-yellow-900' : 'bg-primary/10 text-primary'
          }`}>
            {getAchievementIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {getTranslatedTitle()}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {getTranslatedDescription()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{t('missions:progress')}</span>
            <span className="font-medium">
              {progress.current} / {progress.target}
            </span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {progress.percentage.toFixed(1)}% {t('missions:achievements.complete')}
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={achievement.category === 'unique' ? 'default' : 'secondary'}>
            {achievement.category === 'unique' ? t('missions:achievements.unique') : t('missions:achievements.progressive')}
            {achievement.category === 'progressive' && achievement.completed_count > 0 && (
              <span className="ml-1">({achievement.completed_count}x)</span>
            )}
          </Badge>
          
          {isCompleted && (
            <Badge variant="outline" className="border-yellow-400 text-yellow-600">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('missions:achievements.completed')}
            </Badge>
          )}
        </div>

        {/* Rewards */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground">{t('missions:rewards')}</span>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>{getRewardText()}</span>
          </div>
          
          {/* Claim Rewards Button */}
          {canClaimRewards && (
            <Button 
              onClick={() => onClaimRewards(achievement.id)}
              size="sm"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t('missions:achievements.claimRewards')}
            </Button>
          )}
          
          {/* Rewards Claimed Status */}
          {isCompleted && achievement.rewards_claimed && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Sparkles className="w-4 h-4" />
              <span>{t('missions:achievements.rewardsClaimed')}</span>
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
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [hasLoaded, setHasLoaded] = useState(false);
  const { 
    achievements, 
    loading, 
    loadAchievements,
    getUniqueAchievements, 
    getProgressiveAchievements,
    getCompletedAchievements,
    getAchievementProgress,
    claimAchievementRewards 
  } = useAchievements();

  // OPTIMIZATION: Lazy loading - only load achievements when modal opens
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadAchievements().then(() => setHasLoaded(true));
    }
    // Reset hasLoaded when modal closes so it reloads next time (for fresh data)
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, hasLoaded, loadAchievements]);

  const uniqueAchievements = getUniqueAchievements();
  const progressiveAchievements = getProgressiveAchievements();
  const completedAchievements = getCompletedAchievements();

  const filterAchievements = (achievementsList: Achievement[]) => {
    switch (filter) {
      case 'completed':
        return achievementsList.filter(a => {
          if (a.category === 'unique') {
            return a.is_completed;
          } else {
            // Para progressivas: está completa se atingiu a meta atual E tem completed_at
            return a.progress >= a.next_goal_value && a.completed_at !== null;
          }
        });
      case 'incomplete':
        return achievementsList.filter(a => {
          if (a.category === 'unique') {
            return !a.is_completed;
          } else {
            // Para progressivas: está incompleta se não atingiu a meta atual OU não tem completed_at
            return a.progress < a.next_goal_value || a.completed_at === null;
          }
        });
      default:
        return achievementsList;
    }
  };

  const filteredUniqueAchievements = filterAchievements(uniqueAchievements);
  const filteredProgressiveAchievements = filterAchievements(progressiveAchievements);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {t('missions:achievements.title')}
            <Badge variant="outline" className="ml-2">
              {completedAchievements.length} / {achievements.length}
            </Badge>
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

        <Tabs defaultValue="unique" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="unique" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                {t('missions:achievements.unique')} ({uniqueAchievements.length})
              </TabsTrigger>
              <TabsTrigger value="progressive" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('missions:achievements.progressive')} ({progressiveAchievements.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Badge 
                variant={filter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                {t('missions:achievements.all')}
              </Badge>
              <Badge 
                variant={filter === 'completed' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('completed')}
              >
                {t('missions:achievements.completed')}
              </Badge>
              <Badge 
                variant={filter === 'incomplete' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('incomplete')}
              >
                {t('missions:achievements.pending')}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <TabsContent value="unique" className="mt-0 h-full">
              <div className="space-y-4 pb-8 px-1">
                {loading ? (
                  <LoadingSkeleton />
                ) : filteredUniqueAchievements.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredUniqueAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        getProgress={getAchievementProgress}
                        onClaimRewards={claimAchievementRewards}
                        t={t}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('missions:achievements.noUniqueFound')}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progressive" className="mt-0 h-full">
              <div className="space-y-4 pb-8 px-1">
                {loading ? (
                  <LoadingSkeleton />
                ) : filteredProgressiveAchievements.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredProgressiveAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        getProgress={getAchievementProgress}
                        onClaimRewards={claimAchievementRewards}
                        t={t}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('missions:achievements.noProgressiveFound')}</p>
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