import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLaunchEvent } from '@/hooks/useLaunchEvent';
import { useTranslation } from 'react-i18next';
import { Lock, Check, Gift, Star, Sparkles, Trophy, X, PartyPopper, Rocket, Timer } from 'lucide-react';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';

interface LaunchEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Countdown card component with flip animation style
const CountdownCard = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-12 h-14 md:w-16 md:h-18 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)] overflow-hidden">
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      {/* Middle line */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/50" />
      {/* Value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl md:text-3xl font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
          {String(value).padStart(2, '0')}
        </span>
      </div>
    </div>
    <span className="text-[10px] md:text-xs text-amber-300/70 mt-1.5 uppercase tracking-wider font-medium">
      {label}
    </span>
  </div>
);

export const LaunchEventModal = ({ isOpen, onClose }: LaunchEventModalProps) => {
  const { t } = useTranslation('event');
  const { missions, loading, timeRemaining, isEventActive, claimRewards, checkFriendsMission, refreshEvent } = useLaunchEvent();

  useEffect(() => {
    if (isOpen) {
      refreshEvent();
    }
  }, [isOpen, refreshEvent]);

  useEffect(() => {
    if (isOpen && missions.some(m => m.mission_order === 7 && m.isUnlocked)) {
      checkFriendsMission();
    }
  }, [isOpen, missions, checkFriendsMission]);

  const handleClaimRewards = async (missionOrder: number) => {
    await claimRewards(missionOrder);
  };

  const formatRewards = (mission: typeof missions[0]) => {
    const rewards: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (mission.reward_coins > 0) {
      rewards.push({
        icon: <img src={pokecoinIcon} alt="coins" className="w-4 h-4" />,
        text: `${mission.reward_coins}`,
        color: 'text-yellow-400',
      });
    }
    if (mission.reward_shards > 0) {
      rewards.push({
        icon: <img src={pokeshardIcon} alt="shards" className="w-4 h-4" />,
        text: `${mission.reward_shards}`,
        color: 'text-purple-400',
      });
    }
    if (mission.reward_spins > 0) {
      rewards.push({
        icon: <Sparkles className="w-4 h-4" />,
        text: `${mission.reward_spins} ${t('rewardLabels.spins')}`,
        color: 'text-blue-400',
      });
    }
    if (mission.reward_mystery_boxes > 0) {
      rewards.push({
        icon: <Gift className="w-4 h-4" />,
        text: `${mission.reward_mystery_boxes}x ${t('rewardLabels.mysteryBox')}`,
        color: 'text-pink-400',
      });
    }
    if (mission.reward_luck_potion > 0) {
      rewards.push({
        icon: <Star className="w-4 h-4" />,
        text: `${mission.reward_luck_potion}x ${t('rewardLabels.luckPotion')}`,
        color: 'text-green-400',
      });
    }
    if (mission.reward_shiny_potion > 0) {
      rewards.push({
        icon: <Sparkles className="w-4 h-4" />,
        text: `${mission.reward_shiny_potion}x ${t('rewardLabels.shinyPotion')}`,
        color: 'text-cyan-400',
      });
    }
    if (mission.reward_legendary_spin > 0) {
      rewards.push({
        icon: <Trophy className="w-4 h-4" />,
        text: `${mission.reward_legendary_spin}x ${t('rewardLabels.legendarySpin')}`,
        color: 'text-amber-400',
      });
    }

    return rewards;
  };

  const getMissionStatus = (mission: typeof missions[0]) => {
    if (mission.rewards_claimed) return 'claimed';
    if (mission.completed) return 'completed';
    if (mission.isUnlocked) return 'unlocked';
    return 'locked';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-visible bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-2 border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.2)]">
        {/* Decorative particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-8 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-8 right-24 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-6 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-32 right-8 w-2 h-2 bg-pink-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.7s' }} />
        </div>

        {/* Close Button */}
        <DialogClose asChild>
          <button className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-gray-800/80 border border-gray-700 opacity-70 transition-all hover:opacity-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <X className="h-4 w-4 text-gray-300" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
        
        {/* Festive Header */}
        <DialogHeader className="pb-3 relative px-0 mx-0">
          <div className="absolute -inset-x-6 -top-6 h-20 bg-gradient-to-b from-amber-500/30 via-red-500/15 to-transparent" />
          <DialogTitle className="relative flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent drop-shadow-lg">
                {t('title')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-amber-300/60 text-sm">
              <Rocket className="w-4 h-4" />
              <span>{new Date().getFullYear()}</span>
              <Rocket className="w-4 h-4 rotate-45" />
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Countdown Timer */}
        {timeRemaining && (
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-amber-500/20 shadow-inner mb-3">
            <div className="flex items-center justify-center gap-1 mb-3">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-300/70 uppercase tracking-widest font-medium">{t('endsIn')}</span>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <CountdownCard value={timeRemaining.days} label={t('days')} />
              <span className="text-2xl font-bold text-amber-500/50 mt-[-20px]">:</span>
              <CountdownCard value={timeRemaining.hours} label={t('hours')} />
              <span className="text-2xl font-bold text-amber-500/50 mt-[-20px]">:</span>
              <CountdownCard value={timeRemaining.minutes} label={t('minutes')} />
              <span className="text-2xl font-bold text-amber-500/50 mt-[-20px]">:</span>
              <CountdownCard value={timeRemaining.seconds} label={t('seconds')} />
            </div>
          </div>
        )}

        {/* Guaranteed Legendary Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative flex items-center justify-center gap-2">
            <span className="text-amber-300 font-bold text-sm">
              {t('guaranteedLegendary')}
            </span>
          </div>
        </div>

        {/* Mission List */}
        <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1 py-2 scrollbar-thin mt-3 px-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            missions.map((mission) => {
              const status = getMissionStatus(mission);
              const rewards = formatRewards(mission);
              const progressPercent = Math.min((mission.progress / mission.goal) * 100, 100);
              const isFinalMission = mission.mission_order === 7;

              return (
                <div
                  key={mission.id}
                  className={`relative pt-10 p-4 rounded-xl border-2 transition-all duration-300 ${
                    status === 'locked'
                      ? 'bg-gray-900/50 border-gray-700/50 opacity-60'
                      : status === 'claimed'
                      ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/40'
                      : status === 'completed'
                      ? 'bg-gradient-to-br from-amber-900/30 to-yellow-800/20 border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600/50'
                  } ${isFinalMission && status !== 'locked' ? 'ring-1 ring-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.3)]' : ''}`}
                >
                  {/* Mission Number Badge */}
                  <div
                    className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg z-20 ${
                      status === 'claimed'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white'
                        : status === 'completed'
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-500 border-amber-400 text-white animate-pulse'
                        : status === 'unlocked'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-gray-400'
                    }`}
                  >
                    {status === 'claimed' ? (
                      <Check className="w-4 h-4" />
                    ) : status === 'locked' ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      mission.mission_order
                    )}
                  </div>

                  {/* Mission Content */}
                  <div className="ml-5">
                    {/* Title */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3
                        className={`font-bold text-sm ${
                          status === 'locked' ? 'text-gray-500' : 'text-gray-100'
                        }`}
                      >
                        {status === 'locked' && !isFinalMission
                          ? t('mysteryMission')
                          : isFinalMission && status === 'locked'
                          ? `⭐ ${t('finalMission')}`
                          : t(`missions.${mission.mission_order}.title`)}
                      </h3>
                      {isFinalMission && status !== 'locked' && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                      )}
                    </div>

                    {/* Description */}
                    {status !== 'locked' && (
                      <p className="text-xs text-gray-400 mb-2.5">
                        {t(`missions.${mission.mission_order}.description`)}
                      </p>
                    )}

                    {/* Locked message */}
                    {status === 'locked' && (
                      <p className="text-xs text-gray-500 italic mb-2">{t('unlockPrevious')}</p>
                    )}

                    {/* Progress bar */}
                    {status === 'unlocked' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>{t('inProgress')}</span>
                          <span className="text-amber-400 font-medium">
                            {mission.progress}/{mission.goal}
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                          {/* Shimmer on progress */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-xs text-gray-500">{t('rewards')}:</span>
                      {rewards.map((reward, idx) => (
                        <span
                          key={idx}
                          className={`flex items-center gap-1 text-xs ${reward.color} bg-gray-800/80 px-2 py-1 rounded-full border border-gray-700/50`}
                        >
                          {reward.icon}
                          {reward.text}
                        </span>
                      ))}
                    </div>

                    {/* Claim Button */}
                    {status === 'completed' && (
                      <Button
                        onClick={() => handleClaimRewards(mission.mission_order)}
                        className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors duration-200"
                        size="sm"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        {t('claim')}
                      </Button>
                    )}

                    {status === 'claimed' && (
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-green-400 text-sm font-medium bg-green-500/10 rounded-lg py-1.5">
                        <Check className="w-4 h-4" />
                        {t('claimed')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* All completed message */}
          {!loading && missions.length > 0 && missions.every((m) => m.rewards_claimed) && (
            <div className="text-center py-6 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-xl border border-amber-500/30">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <p className="font-bold text-xl text-amber-300">{t('congratulations')}</p>
              <p className="text-amber-400/60 text-sm mt-1">🎆 Parabéns por completar o evento! 🎆</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
