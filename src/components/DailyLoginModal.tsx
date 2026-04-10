import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDailyLogin, DAILY_REWARDS } from '@/hooks/useDailyLogin';
import { toast } from '@/hooks/use-toast';
import { Star, Gift, Check, Sparkles } from 'lucide-react';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import pokeballIcon from '@/assets/pokeball_icon.png';
import masterballIcon from '@/assets/masterball.png';

interface DailyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onLegendarySpin?: () => void;
}

export const DailyLoginModal = ({ isOpen, onClose, onRefresh, onLegendarySpin }: DailyLoginModalProps) => {
  const { t } = useTranslation('game');
  const { currentStreak, canClaim, claiming, claimReward } = useDailyLogin();
  const [claimedDay, setClaimedDay] = useState<number | null>(null);

  const handleClaim = async () => {
    const result = await claimReward();
    if (result.success && result.day) {
      setClaimedDay(result.day);

      const rewardLabels: Record<string, string> = {
        pokecoins: t('dailyLogin.modal.rewards.pokecoins', { amount: result.rewardAmount }),
        spins: t('dailyLogin.modal.rewards.spins', { amount: result.rewardAmount }),
        pokeshards: t('dailyLogin.modal.rewards.pokeshards', { amount: result.rewardAmount }),
        legendary_spin: t('dailyLogin.modal.rewards.legendarySpin'),
      };

      toast({
        title: t('dailyLogin.modal.toast.title', { day: result.day }),
        description: rewardLabels[result.rewardType || ''] || t('dailyLogin.modal.toast.claimedFallback'),
      });

      if (onRefresh) onRefresh();

      if (result.isLegendarySpin && onLegendarySpin) {
        setTimeout(() => {
          onClose();
          onLegendarySpin();
        }, 1500);
      }
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'pokecoins':
        return <img src={pokecoinIcon} alt="PokéCoins" className="w-7 h-7" />;
      case 'pokeshards':
        return <img src={pokeshardIcon} alt="PokéShards" className="w-7 h-7" />;
      case 'spins':
        return <img src={pokeballIcon} alt="Spins" className="w-7 h-7" />;
      case 'legendary_spin':
        return <img src={masterballIcon} alt={t('dailyLogin.modal.legendarySpin')} className="w-8 h-8" />;
      default:
        return <Gift className="w-7 h-7" />;
    }
  };

  const getRewardText = (rewardType: string, amount: number) => {
    switch (rewardType) {
      case 'pokecoins': return t('dailyLogin.modal.rewards.pokecoins', { amount });
      case 'pokeshards': return t('dailyLogin.modal.rewards.pokeshards', { amount });
      case 'spins': return t('dailyLogin.modal.rewards.spins', { amount });
      case 'legendary_spin': return t('dailyLogin.modal.rewards.legendaryShort');
      default: return t('dailyLogin.modal.rewards.fallback', { amount });
    }
  };

  const nextDay = canClaim
    ? (currentStreak >= 7 || currentStreak === 0 ? 1 : currentStreak + 1)
    : currentStreak;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-card border border-border overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">{t('dailyLogin.modal.title')}</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dailyLogin.modal.streak')}: <span className="font-semibold text-accent">{currentStreak}/7</span>
          </p>
        </div>

        {/* Days Grid */}
        <div className="px-5 py-4">
          {/* Days 1-6 in a 3x2 grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {DAILY_REWARDS.slice(0, 6).map((reward) => {
              const isPast = reward.day < nextDay && !canClaim ? reward.day <= currentStreak : reward.day < nextDay;
              const isCurrent = reward.day === nextDay && canClaim;
              const isClaimedNow = claimedDay === reward.day;

              return (
                <div
                  key={reward.day}
                  className={`relative flex flex-col items-center rounded-lg p-2.5 transition-all border ${
                    isClaimedNow
                      ? 'bg-accent/10 border-accent'
                      : isCurrent
                      ? 'bg-accent/5 border-accent/50 ring-1 ring-accent/30'
                      : isPast
                      ? 'bg-muted/50 border-border'
                      : 'bg-card border-border opacity-50'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${
                    isCurrent ? 'text-accent' : isPast ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {t('dailyLogin.modal.day', { day: reward.day })}
                  </span>

                  <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                    {isPast && !isClaimedNow ? (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-accent" />
                      </div>
                    ) : (
                      getRewardIcon(reward.rewardType)
                    )}
                  </div>

                  <span className={`text-xs font-bold ${
                    isCurrent ? 'text-foreground' : isPast ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {getRewardText(reward.rewardType, reward.rewardAmount)}
                  </span>

                  {isCurrent && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-accent animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Day 7 - Featured */}
          {(() => {
            const reward = DAILY_REWARDS[6];
            const isPast = reward.day < nextDay && !canClaim ? reward.day <= currentStreak : reward.day < nextDay;
            const isCurrent = reward.day === nextDay && canClaim;
            const isClaimedNow = claimedDay === reward.day;

            return (
              <div
                className={`relative flex items-center gap-4 rounded-lg p-3.5 transition-all border ${
                  isClaimedNow
                    ? 'bg-accent/10 border-accent'
                    : isCurrent
                    ? 'bg-gradient-to-r from-accent/5 to-accent/10 border-accent/50 ring-1 ring-accent/30'
                    : isPast
                    ? 'bg-muted/50 border-border'
                    : 'bg-card border-border opacity-50'
                }`}
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  {isPast && !isClaimedNow ? (
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-accent" />
                    </div>
                  ) : (
                    <img src={masterballIcon} alt="Masterball" className="w-10 h-10" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isCurrent ? 'text-accent' : 'text-muted-foreground'}`}>
                      {t('dailyLogin.modal.day', { day: 7 })}
                    </span>
                    <Star className="w-3 h-3 text-accent" />
                  </div>
                  <p className="text-sm font-bold text-foreground mt-0.5">{t('dailyLogin.modal.legendarySpin')}</p>
                  <p className="text-[10px] text-muted-foreground">{t('dailyLogin.modal.legendaryPokemonGuaranteed')}</p>
                </div>
                {isCurrent && (
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                )}
              </div>
            );
          })()}
        </div>

        {/* Claim Button */}
        <div className="px-5 pb-5">
          {canClaim ? (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full btn-casino py-3 text-sm font-bold"
            >
              {claiming ? (
                t('dailyLogin.modal.claiming')
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {t('dailyLogin.modal.claimDay', { day: nextDay })}
                </>
              )}
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="w-full py-3 text-sm"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('dailyLogin.modal.todayRewardClaimed')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
