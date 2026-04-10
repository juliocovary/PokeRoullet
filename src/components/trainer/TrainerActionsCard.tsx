import { useTranslation } from 'react-i18next';
import { Package, TrendingUp, Sparkles, BarChart3, Zap, Trophy, Flame } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface TrainerActionsCardProps {
  onOpenInventory: () => void;
  onOpenUpgrades: () => void;
  onOpenEvolution: () => void;
  onOpenProgress: () => void;
  onOpenRanking: () => void;
  onOpenFusion: () => void;
}

const TrainerActionsCard = ({
  onOpenInventory,
  onOpenUpgrades,
  onOpenEvolution,
  onOpenProgress,
  onOpenRanking,
  onOpenFusion,
}: TrainerActionsCardProps) => {
  const { t } = useTranslation('trainer');
  const isMobile = useIsMobile();

  const actions = [
    {
      onClick: onOpenInventory,
      icon: Package,
      label: t('actions.inventory'),
      borderColor: 'border-blue-500/30',
      bgGradient: 'from-blue-600/20 to-blue-900/10',
      hoverBorder: 'hover:border-blue-400/50',
      hoverShadow: 'hover:shadow-blue-500/30',
      iconBg: 'bg-blue-500/20 group-hover:bg-blue-500/30',
      iconColor: 'text-blue-400',
      hoverGlow: 'from-blue-400/10 via-transparent to-blue-400/5',
    },
    {
      onClick: onOpenUpgrades,
      icon: TrendingUp,
      label: t('actions.upgrades'),
      borderColor: 'border-green-500/30',
      bgGradient: 'from-green-600/20 to-green-900/10',
      hoverBorder: 'hover:border-green-400/50',
      hoverShadow: 'hover:shadow-green-500/30',
      iconBg: 'bg-green-500/20 group-hover:bg-green-500/30',
      iconColor: 'text-green-400',
      hoverGlow: 'from-green-400/10 via-transparent to-green-400/5',
    },
    {
      onClick: onOpenEvolution,
      icon: Sparkles,
      label: t('actions.evolution'),
      borderColor: 'border-purple-500/30',
      bgGradient: 'from-purple-600/20 to-purple-900/10',
      hoverBorder: 'hover:border-purple-400/50',
      hoverShadow: 'hover:shadow-purple-500/30',
      iconBg: 'bg-purple-500/20 group-hover:bg-purple-500/30',
      iconColor: 'text-purple-400',
      hoverGlow: 'from-purple-400/10 via-transparent to-purple-400/5',
    },
    {
      onClick: onOpenProgress,
      icon: BarChart3,
      label: t('actions.progress'),
      borderColor: 'border-amber-500/30',
      bgGradient: 'from-amber-600/20 to-amber-900/10',
      hoverBorder: 'hover:border-amber-400/50',
      hoverShadow: 'hover:shadow-amber-500/30',
      iconBg: 'bg-amber-500/20 group-hover:bg-amber-500/30',
      iconColor: 'text-amber-400',
      hoverGlow: 'from-amber-400/10 via-transparent to-amber-400/5',
    },
    {
      onClick: onOpenRanking,
      icon: Trophy,
      label: t('ranking.title', 'Ranking'),
      borderColor: 'border-yellow-500/30',
      bgGradient: 'from-yellow-600/20 to-yellow-900/10',
      hoverBorder: 'hover:border-yellow-400/50',
      hoverShadow: 'hover:shadow-yellow-500/30',
      iconBg: 'bg-yellow-500/20 group-hover:bg-yellow-500/30',
      iconColor: 'text-yellow-400',
      hoverGlow: 'from-yellow-400/10 via-transparent to-yellow-400/5',
    },
    {
      onClick: onOpenFusion,
      icon: Flame,
      label: t('fusion.title', 'Shiny Fusion'),
      borderColor: 'border-pink-500/30',
      bgGradient: 'from-pink-600/20 to-pink-900/10',
      hoverBorder: 'hover:border-pink-400/50',
      hoverShadow: 'hover:shadow-pink-500/30',
      iconBg: 'bg-pink-500/20 group-hover:bg-pink-500/30',
      iconColor: 'text-pink-400',
      hoverGlow: 'from-pink-400/10 via-transparent to-pink-400/5',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/60 rounded-xl sm:rounded-2xl border border-zinc-700/50 shadow-lg p-3 sm:p-4">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-xl sm:rounded-2xl" />
      
      <div className="relative z-10">
        <div className={cn(
          "flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4",
          isMobile && "justify-center"
        )}>
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-400 text-base sm:text-lg font-bold">{t('actions.title')}</h3>
            <div className="h-0.5 w-10 sm:w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-0.5" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-xl transition-all duration-300 group relative overflow-hidden border-2",
                action.borderColor,
                `bg-gradient-to-br ${action.bgGradient}`,
                action.hoverBorder,
                "hover:shadow-lg",
                action.hoverShadow,
                "hover:scale-105 active:scale-95",
                isMobile ? "py-3 px-2 min-h-[70px]" : "py-4 px-3"
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                action.hoverGlow
              )} />
              <div className={cn(
                "relative z-10 rounded-lg transition-colors",
                action.iconBg,
                isMobile ? "p-1.5" : "p-2"
              )}>
                <action.icon className={cn(
                  action.iconColor,
                  isMobile ? "h-5 w-5" : "h-6 w-6"
                )} />
              </div>
              <span className={cn(
                "relative z-10 font-bold text-slate-200 group-hover:text-white transition-colors text-center",
                isMobile ? "text-[10px] leading-tight" : "text-xs"
              )}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainerActionsCard;
