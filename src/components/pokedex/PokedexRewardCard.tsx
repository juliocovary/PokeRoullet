import { useTranslation } from 'react-i18next';
import { Gift, Lock, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';

// Region icons
import kantoIcon from '@/assets/regions/kanto.png';
import johtoIcon from '@/assets/regions/johto.png';
import hoennIcon from '@/assets/regions/hoenn.png';
import sinnohIcon from '@/assets/regions/sinnoh.png';

export interface PokedexRewardCardProps {
  milestone: number;
  coins: number;
  xp: number;
  shards: number;
  currentProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  specialReward?: 'unlock_johto' | 'unlock_hoenn' | 'unlock_sinnoh';
  onClaim: () => void;
  isRegionUnlocked?: boolean;
}

const regionIcons: Record<string, string> = {
  unlock_johto: johtoIcon,
  unlock_hoenn: hoennIcon,
  unlock_sinnoh: sinnohIcon,
};

const regionColors: Record<string, { bg: string; border: string; text: string }> = {
  unlock_johto: { bg: 'from-purple-600/30 to-purple-800/40', border: 'border-purple-500', text: 'text-purple-300' },
  unlock_hoenn: { bg: 'from-orange-600/30 to-orange-800/40', border: 'border-orange-500', text: 'text-orange-300' },
  unlock_sinnoh: { bg: 'from-cyan-600/30 to-cyan-800/40', border: 'border-cyan-500', text: 'text-cyan-300' },
};

export const PokedexRewardCard = ({
  milestone,
  coins,
  xp,
  shards,
  currentProgress,
  isCompleted,
  isClaimed,
  specialReward,
  onClaim,
  isRegionUnlocked,
}: PokedexRewardCardProps) => {
  const { t } = useTranslation('modals');
  
  // For region unlock rewards, check if already unlocked
  const isRegionAlreadyUnlocked = specialReward && isRegionUnlocked;
  const progressPercentage = Math.min((currentProgress / milestone) * 100, 100);
  const isEffectivelyClaimed = isClaimed || Boolean(isRegionAlreadyUnlocked);
  const isAvailable = isCompleted && !isEffectivelyClaimed;
  const isLocked = !isCompleted;
  
  // Card state classes
  const cardStateClasses = cn(
    'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
    {
      // Locked state
      'bg-gradient-to-br from-gray-800/60 to-gray-900/80 border-gray-600/50': isLocked,
      // Available to claim state
      'bg-gradient-to-br from-yellow-900/50 via-amber-900/40 to-orange-900/50 border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-reward-glow': isAvailable,
      // Claimed state
      'bg-gradient-to-br from-emerald-900/40 to-green-900/50 border-emerald-500/60': isEffectivelyClaimed,
      // Special region unlock styling
      [specialReward ? regionColors[specialReward]?.bg : '']: specialReward && !isEffectivelyClaimed,
      [specialReward ? regionColors[specialReward]?.border : '']: specialReward && !isEffectivelyClaimed,
    }
  );

  return (
    <div className={cardStateClasses}>
      {/* Shimmer effect for available rewards */}
      {isAvailable && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 animate-shimmer-slide bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
      
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-10" />
      )}

      <div className="relative p-3 sm:p-4">
        {/* Header: Milestone + Progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Milestone badge */}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs sm:text-sm',
              {
                'bg-gray-700/80 text-gray-400': isLocked,
                'bg-yellow-500/90 text-yellow-950 shadow-lg': isAvailable,
                'bg-emerald-500/80 text-white': isEffectivelyClaimed,
              }
            )}>
              {isEffectivelyClaimed ? (
                <Check className="h-3.5 w-3.5" />
              ) : isLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              )}
              <span>{milestone}</span>
            </div>
            
            {/* Special reward icon */}
            {specialReward && (
              <img 
                src={regionIcons[specialReward]} 
                alt="Region" 
                className={cn(
                  'w-6 h-6 sm:w-8 sm:h-8 object-contain',
                  { 'grayscale opacity-50': isLocked }
                )}
              />
            )}
          </div>
          
          {/* Progress counter */}
          <span className={cn(
            'text-xs sm:text-sm font-medium',
            {
              'text-gray-500': isLocked,
              'text-yellow-300': isAvailable,
              'text-emerald-400': isEffectivelyClaimed,
            }
          )}>
            {currentProgress}/{milestone}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <Progress
            value={progressPercentage}
            className={cn(
              'h-2 sm:h-2.5 bg-gray-800/60',
              { 'opacity-50': isLocked }
            )}
            indicatorClassName={cn({
              'bg-gradient-to-r from-gray-500 to-gray-600': isLocked,
              'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]': isAvailable,
              'bg-gradient-to-r from-emerald-400 to-green-500': isEffectivelyClaimed,
            })}
          />
        </div>

        {/* Rewards */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {specialReward ? (
            // Special region unlock badge
            <Badge 
              variant="outline" 
              className={cn(
                'px-3 py-1.5 text-xs sm:text-sm font-bold border-2',
                specialReward && regionColors[specialReward]?.border,
                specialReward && regionColors[specialReward]?.text,
                { 'grayscale opacity-60': isLocked }
              )}
            >
              🔓 {t(`pokedex.${specialReward === 'unlock_johto' ? 'unlockJohto' : 
                     specialReward === 'unlock_hoenn' ? 'unlockHoenn' : 'unlockSinnoh'}`)}
            </Badge>
          ) : (
            // Regular rewards with icons
            <>
              <div className={cn(
                'flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-2 py-1',
                { 'grayscale opacity-50': isLocked }
              )}>
                <img src={pokecoinIcon} alt="Coins" className="w-4 h-4 sm:w-5 sm:h-5 animate-coin-bounce" />
                <span className="text-yellow-300 font-bold text-xs sm:text-sm">{coins}</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-1 bg-blue-500/20 border border-blue-500/40 rounded-lg px-2 py-1',
                { 'grayscale opacity-50': isLocked }
              )}>
                <span className="text-blue-300 font-bold text-xs sm:text-sm">⭐ {xp} XP</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 rounded-lg px-2 py-1',
                { 'grayscale opacity-50': isLocked }
              )}>
                <img src={pokeshardIcon} alt="Shards" className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-purple-300 font-bold text-xs sm:text-sm">{shards}</span>
              </div>
            </>
          )}
        </div>

        {/* Action button / Status */}
        <div className="flex justify-end">
          {isAvailable ? (
            <Button
              onClick={onClaim}
              className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 
                         border-2 border-yellow-600/80 text-yellow-950 font-bold 
                         px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm 
                         shadow-[0_4px_12px_rgba(234,179,8,0.4)] hover:shadow-[0_0_20px_rgba(234,179,8,0.6)]
                         transition-all duration-200 hover:scale-105 animate-pulse-subtle
                         min-h-[44px] min-w-[100px]"
            >
              <Gift className="h-4 w-4 mr-1.5" />
              {t('pokedex.collect')}
            </Button>
          ) : isEffectivelyClaimed ? (
            <Badge className="bg-emerald-600/90 text-white font-bold px-4 py-2 text-xs sm:text-sm shadow-lg">
              <Check className="h-3.5 w-3.5 mr-1.5" />
              {t('pokedex.collected')}
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="bg-gray-700/50 border-gray-600 text-gray-400 font-medium px-3 py-1.5 text-xs sm:text-sm"
            >
              <Lock className="h-3 w-3 mr-1.5" />
              {t('pokedex.locked')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
