import { useTranslation } from 'react-i18next';
import { Swords, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StageCardProps {
  stage: number;
  wave: number;
  canBattle: boolean;
  onStartBattle: () => void;
}

const StageCard = ({ stage, wave, canBattle, onStartBattle }: StageCardProps) => {
  const { t } = useTranslation('trainer');

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>{t('battle.stage')} {stage}</span>
        </div>
        <p className="text-xs text-slate-500">
          {t('battle.wave')} {wave}/10
        </p>
      </div>

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            canBattle 
              ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50" 
              : "bg-slate-700/50 border-2 border-slate-600/50"
          )}>
            {canBattle ? (
              <Swords className="w-12 h-12 text-red-400" />
            ) : (
              <Lock className="w-10 h-10 text-slate-500" />
            )}
          </div>
          
          {/* Glow effect when can battle */}
          {canBattle && (
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center mt-4 mb-4">
        <p className={cn(
          "text-sm font-medium",
          canBattle ? "text-green-400" : "text-slate-500"
        )}>
          {canBattle ? t('battle.ready') : t('battle.needTeam')}
        </p>
      </div>

      {/* Battle Button */}
      <Button
        onClick={onStartBattle}
        disabled={!canBattle}
        className={cn(
          "w-full py-5 font-bold text-base transition-all",
          canBattle
            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-lg shadow-red-500/25"
            : "bg-slate-700 text-slate-500 cursor-not-allowed"
        )}
      >
        <Swords className="h-5 w-5 mr-2" />
        {t('battle.start')}
      </Button>
    </div>
  );
};

export default StageCard;
