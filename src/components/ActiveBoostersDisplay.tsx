import { useEffect, useState } from 'react';
import { Sparkles, Clover, Clock, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBooster } from '@/hooks/useBooster';
import { useBadges } from '@/hooks/useBadges';
import { useRouletteBoosts } from '@/hooks/useRouletteBoosts';

interface ActiveBoostersDisplayProps {
  baseLuckMultiplier: number;
}

export const ActiveBoostersDisplay = ({ baseLuckMultiplier }: ActiveBoostersDisplayProps) => {
  const { t } = useTranslation(['modals']);
  const { 
    isShinyBoostActive, 
    isLuckBoostActive, 
    shinyBoostTimeRemaining, 
    luckBoostTimeRemaining 
  } = useBooster();
  const { buffs } = useBadges();
  const { activeBoosts } = useRouletteBoosts();
  
  const [, setTick] = useState(0);

  // Update every minute to refresh time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate TOTAL luck value: base * potion + badge luck + roulette luck
  let totalLuckValue = isLuckBoostActive ? baseLuckMultiplier * 2 : baseLuckMultiplier;
  // Badge luck_bonus is stored as 0.10 (10%)
  if (buffs.luck_bonus > 0) {
    totalLuckValue += baseLuckMultiplier * buffs.luck_bonus;
  }
  // Roulette boost luck_bonus is stored as percentage (e.g. 5 = 5%)
  if (activeBoosts.luck_bonus > 0) {
    totalLuckValue += baseLuckMultiplier * (activeBoosts.luck_bonus / 100);
  }

  // Calculate TOTAL shiny chance using new multiplicative formula
  // Base: 0.5% (0.005)
  let totalShinyChance = 0.5; // base %
  
  // Roulette boosts: multiplicative % on base (e.g. 20 = base * 1.20)
  if (activeBoosts.shiny_chance > 0) {
    totalShinyChance = totalShinyChance * (1 + activeBoosts.shiny_chance / 100);
  }
  
  // Badge shiny_bonus is stored as 0.005 (0.5%) - absolute addition
  if (buffs.shiny_bonus > 0) {
    totalShinyChance += buffs.shiny_bonus * 100; // convert to %
  }
  
  // Shiny potion: 2x multiplier on current total
  if (isShinyBoostActive) {
    totalShinyChance = totalShinyChance * 2;
  }

  // Check if any badge/boost is contributing
  const hasExtraSources = buffs.luck_bonus > 0 || buffs.shiny_bonus > 0 || 
    activeBoosts.luck_bonus > 0 || activeBoosts.shiny_chance > 0 ||
    buffs.secret_active || activeBoosts.secret_chance > 0 ||
    buffs.xp_bonus > 0 || activeBoosts.xp_bonus > 0;

  // Calculate total XP bonus
  const totalXpBonus = (buffs.xp_bonus * 100) + activeBoosts.xp_bonus; // both as %

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {/* Shiny Chance Indicator */}
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm ${
        isShinyBoostActive || buffs.shiny_bonus > 0 || activeBoosts.shiny_chance > 0
          ? 'bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200' 
          : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
      }`}>
        <Sparkles className={`w-4 h-4 ${isShinyBoostActive || buffs.shiny_bonus > 0 || activeBoosts.shiny_chance > 0 ? 'text-pink-500' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium ${isShinyBoostActive || buffs.shiny_bonus > 0 || activeBoosts.shiny_chance > 0 ? 'text-pink-700' : 'text-gray-600'}`}>
          {t('modals:boosters.shinyChance', { defaultValue: 'Shiny' })}: {totalShinyChance % 1 === 0 ? totalShinyChance : totalShinyChance.toFixed(1)}%
        </span>
        {isShinyBoostActive && (
          <div className="flex items-center gap-1 text-pink-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{shinyBoostTimeRemaining}</span>
          </div>
        )}
      </div>

      {/* Luck Indicator */}
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm ${
        isLuckBoostActive || buffs.luck_bonus > 0 || activeBoosts.luck_bonus > 0
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200' 
          : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
      }`}>
        <Clover className={`w-4 h-4 ${isLuckBoostActive || buffs.luck_bonus > 0 || activeBoosts.luck_bonus > 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium ${isLuckBoostActive || buffs.luck_bonus > 0 || activeBoosts.luck_bonus > 0 ? 'text-emerald-700' : 'text-gray-600'}`}>
          {t('modals:boosters.luck', { defaultValue: 'Sorte' })}: {totalLuckValue.toFixed(1)}x
        </span>
        {isLuckBoostActive && (
          <div className="flex items-center gap-1 text-emerald-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{luckBoostTimeRemaining}</span>
          </div>
        )}
      </div>

      {/* XP Bonus Indicator - only show when active */}
      {totalXpBonus > 0 && (
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-medium text-yellow-700">
            XP: +{totalXpBonus.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
