import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouletteBoosts, UserRouletteBoost, ActiveBoosts } from '@/hooks/useRouletteBoosts';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Key, 
  Trophy, 
  RotateCcw, 
  Clover, 
  Zap,
  CheckCircle2,
  Lock,
  TrendingUp
} from 'lucide-react';

interface RouletteBoostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const BOOST_ICONS: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  key: Key,
  trophy: Trophy,
  rotate_ccw: RotateCcw,
  clover: Clover,
};

const BOOST_TYPE_CONFIG: Record<string, { labelKey: string; color: string; bgGradient: string; icon: React.ElementType }> = {
  shiny_chance: { 
    labelKey: 'shinyChance', 
    color: 'text-yellow-400', 
    bgGradient: 'from-yellow-500/20 to-amber-600/20',
    icon: Sparkles 
  },
  secret_chance: { 
    labelKey: 'secretChance', 
    color: 'text-purple-400', 
    bgGradient: 'from-purple-500/20 to-violet-600/20',
    icon: Key 
  },
  xp_bonus: { 
    labelKey: 'xpBonus', 
    color: 'text-blue-400', 
    bgGradient: 'from-blue-500/20 to-cyan-600/20',
    icon: Trophy 
  },
  spin_refund: { 
    labelKey: 'spinRefund', 
    color: 'text-amber-400', 
    bgGradient: 'from-amber-500/20 to-orange-600/20',
    icon: RotateCcw 
  },
  luck_bonus: { 
    labelKey: 'luckBonus', 
    color: 'text-emerald-400', 
    bgGradient: 'from-emerald-500/20 to-green-600/20',
    icon: Clover 
  },
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-gradient-to-r from-slate-500 to-slate-600',
  2: 'bg-gradient-to-r from-blue-500 to-blue-600',
  3: 'bg-gradient-to-r from-purple-500 to-purple-600',
  4: 'bg-gradient-to-r from-yellow-500 to-amber-500',
};

const BoostCard = ({ userBoost }: { userBoost: UserRouletteBoost }) => {
  const { t } = useTranslation('modals');
  const { boost, progress, is_completed, is_active } = userBoost;
  const progressPercent = Math.min(100, (progress / boost.task_goal) * 100);
  const IconComponent = BOOST_ICONS[boost.icon] || Sparkles;
  const typeConfig = BOOST_TYPE_CONFIG[boost.boost_type];
  const boostTitle = t(`boosters.rouletteBoosts.boosts.${boost.boost_type}.tier${boost.tier}.name`, {
    defaultValue: boost.name,
  });
  const boostDescription = t(`boosters.rouletteBoosts.boosts.${boost.boost_type}.tier${boost.tier}.description`, {
    defaultValue: boost.description,
  });
  const boostTaskDescription = t(`boosters.rouletteBoosts.boosts.${boost.boost_type}.tier${boost.tier}.taskDescription`, {
    defaultValue: boost.task_description,
  });
  const boostTypeLabel = typeConfig
    ? t(`boosters.rouletteBoosts.typeLabels.${typeConfig.labelKey}`, { defaultValue: typeConfig.labelKey })
    : '';

  return (
    <Card className={`relative overflow-hidden border transition-all duration-300 ${
      is_completed 
        ? 'border-accent/50 bg-gradient-to-br from-accent/10 to-background' 
        : 'border-border/50 hover:border-border'
    }`}>
      {/* Tier Badge */}
      <div className="absolute top-2 right-2">
        <Badge className={`${TIER_COLORS[boost.tier]} text-white text-xs px-2`}>
          Tier {boost.tier}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeConfig?.bgGradient || 'from-muted to-muted'}`}>
            <IconComponent className={`w-5 h-5 ${typeConfig?.color || 'text-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0 pr-14">
            <h4 className="font-bold text-sm truncate">{boostTitle}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{boostDescription}</p>
          </div>
        </div>

        {/* Boost Value */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${typeConfig?.bgGradient || 'from-muted to-muted'}`}>
          <TrendingUp className={`w-4 h-4 ${typeConfig?.color || 'text-foreground'}`} />
          <span className={`text-sm font-bold ${typeConfig?.color || 'text-foreground'}`}>
            +{boost.boost_value}% {boostTypeLabel}
          </span>
          {is_active && (
            <Badge variant="outline" className="ml-auto text-xs border-accent text-accent">
              <Zap className="w-3 h-3 mr-1" />
              {t('boosters.active')}
            </Badge>
          )}
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {is_completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {boostTaskDescription}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={progressPercent} 
              className="h-2"
              indicatorClassName={is_completed ? 'bg-accent' : 'bg-primary'}
            />
            <div className="flex justify-between text-xs">
              <span className={is_completed ? 'text-accent font-medium' : 'text-muted-foreground'}>
                {progress.toLocaleString()} / {boost.task_goal.toLocaleString()}
              </span>
              <span className={is_completed ? 'text-accent font-bold' : 'text-muted-foreground'}>
                {progressPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ActiveBoostsSummary = ({ activeBoosts }: { activeBoosts: ActiveBoosts }) => {
  const { t } = useTranslation('modals');
  const hasActiveBoosts = Object.values(activeBoosts).some(v => v > 0);

  if (!hasActiveBoosts) {
    return (
      <Card className="p-4 border-dashed border-2 border-muted">
        <div className="text-center text-muted-foreground">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('boosters.rouletteBoosts.noActiveBoosts')}</p>
          <p className="text-xs">{t('boosters.rouletteBoosts.completeTasks')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-accent/10 via-background to-yellow-500/10 border-accent/30">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-accent" />
        {t('boosters.rouletteBoosts.activeBoosts')}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {Object.entries(activeBoosts).map(([type, value]) => {
          if (value === 0) return null;
          const config = BOOST_TYPE_CONFIG[type];
          const Icon = config?.icon || Sparkles;
          return (
            <div 
              key={type} 
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-r ${config?.bgGradient || ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${config?.color || ''}`} />
              <span className={`text-xs font-bold ${config?.color || ''}`}>+{value}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const RouletteBoostsModal = ({ isOpen, onClose, onRefresh }: RouletteBoostsModalProps) => {
  const { t } = useTranslation('modals');
  const { userBoosts, activeBoosts, loading, getCompletedCount, getTotalBoosts, refetch } = useRouletteBoosts(onRefresh);
  const [activeTab, setActiveTab] = useState('all');

  // OPTIMIZATION: Lazy-load boosts data when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const boostTypes = ['all', 'shiny_chance', 'secret_chance', 'xp_bonus', 'spin_refund', 'luck_bonus'];
  
  const filteredBoosts = activeTab === 'all' 
    ? userBoosts 
    : userBoosts.filter(ub => ub.boost.boost_type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-yellow-500/20">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            {t('boosters.rouletteBoosts.title')}
            <Badge variant="outline" className="ml-auto">
              {getCompletedCount()}/{getTotalBoosts()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Active Boosts Summary */}
          <ActiveBoostsSummary activeBoosts={activeBoosts} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-6 h-auto p-1">
              <TabsTrigger value="all" className="text-xs px-1 py-1.5">
                {t('boosters.rouletteBoosts.all')}
              </TabsTrigger>
              {boostTypes.slice(1).map(type => {
                const config = BOOST_TYPE_CONFIG[type];
                const Icon = config?.icon || Sparkles;
                return (
                  <TabsTrigger key={type} value={type} className="text-xs px-1 py-1.5">
                    <Icon className={`w-3.5 h-3.5 ${config?.color || ''}`} />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-40 animate-pulse bg-muted" />
                  ))}
                </div>
              ) : filteredBoosts.length > 0 ? (
                <div className="grid gap-3">
                  {filteredBoosts.map(userBoost => (
                    <BoostCard key={userBoost.boost_id} userBoost={userBoost} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>{t('boosters.rouletteBoosts.noneInCategory')}</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
