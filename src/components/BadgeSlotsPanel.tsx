import { useState } from 'react';
import { Award, Plus, Zap, Star, Sparkles, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BadgeSelectionModal } from '@/components/BadgeSelectionModal';
import { EquippedBadges, AvailableBadge, Badge, BadgeBuffs } from '@/hooks/useBadges';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

interface BadgeSlotsPanelProps {
  equippedBadges: EquippedBadges;
  availableBadges: AvailableBadge[];
  buffs: BadgeBuffs;
  onEquip: (slot: 1 | 2 | 3, itemId: number) => Promise<boolean>;
  onUnequip: (slot: 1 | 2 | 3) => Promise<boolean>;
  loading: boolean;
}

const getBadgeIcon = (badgeId: number | undefined) => {
  switch (badgeId) {
    case 200:
      return { icon: Zap, color: 'text-yellow-500', bg: 'from-yellow-400 to-amber-500' };
    case 201:
      return { icon: Star, color: 'text-purple-500', bg: 'from-purple-400 to-violet-500' };
    case 202:
      return { icon: Sparkles, color: 'text-pink-500', bg: 'from-pink-400 to-rose-500' };
    case 203:
      return { icon: Ghost, color: 'text-violet-500', bg: 'from-violet-400 to-purple-600' };
    default:
      return { icon: Award, color: 'text-amber-500', bg: 'from-amber-400 to-yellow-500' };
  }
};

export const BadgeSlotsPanel = ({
  equippedBadges,
  availableBadges,
  buffs,
  onEquip,
  onUnequip,
  loading,
}: BadgeSlotsPanelProps) => {
  const { t } = useTranslation(['modals']);
  const isMobile = useIsMobile();
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | null>(null);

  const slots: { slot: 1 | 2 | 3; badge: Badge | null }[] = [
    { slot: 1, badge: equippedBadges.slot_1 },
    { slot: 2, badge: equippedBadges.slot_2 },
    { slot: 3, badge: equippedBadges.slot_3 },
  ];

  const hasAnyBuff = buffs.xp_bonus > 0 || buffs.luck_bonus > 0 || buffs.shiny_bonus > 0 || buffs.secret_active;

  return (
    <>
      <div className="card-pokemon p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm sm:text-base text-amber-800">
              {t('modals:badges.title', { defaultValue: 'Insígnias' })}
            </h3>
          </div>
          {hasAnyBuff && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Sparkles className="w-3 h-3" />
              <span>{t('modals:badges.active', { defaultValue: 'Ativas' })}</span>
            </div>
          )}
        </div>

        {/* Badge Slots */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-3">
          <TooltipProvider>
            {slots.map(({ slot, badge }) => {
              const badgeStyle = badge ? getBadgeIcon(badge.id) : null;
              const IconComponent = badgeStyle?.icon || Plus;

              return (
                <Tooltip key={slot}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedSlot(slot)}
                      disabled={loading}
                      className={`
                        relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0 
                        transition-all duration-300 hover:scale-110
                        ${badge
                          ? `bg-gradient-to-br ${badgeStyle?.bg} shadow-lg border-2 border-white/50`
                          : 'bg-amber-100 border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-200/50'
                        }
                      `}
                    >
                      {badge ? (
                        badge.icon_url ? (
                          <img 
                            src={badge.icon_url} 
                            alt={badge.name} 
                            className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md"
                          />
                        ) : (
                          <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                        )
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      )}
                      
                      {/* Slot number indicator */}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                        {slot}
                      </span>

                      {/* Glow effect for equipped badges */}
                      {badge && (
                        <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    {badge ? (
                      <div className="text-center">
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    ) : (
                      <p>{t('modals:badges.emptySlot', { defaultValue: 'Clique para equipar uma insígnia' })}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Active Buffs Display */}
        {hasAnyBuff && (
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {buffs.xp_bonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full text-xs font-medium text-yellow-700">
                <Zap className="w-3 h-3" />
                <span>+{Math.round(buffs.xp_bonus * 100)}% XP</span>
              </div>
            )}
            {buffs.luck_bonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-700">
                <Star className="w-3 h-3" />
                <span>+{Math.round(buffs.luck_bonus * 100)}% Luck</span>
              </div>
            )}
            {buffs.shiny_bonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-pink-100 rounded-full text-xs font-medium text-pink-700">
                <Sparkles className="w-3 h-3" />
                <span>+{(buffs.shiny_bonus * 100).toFixed(1)}% Shiny</span>
              </div>
            )}
            {buffs.secret_active && (
              <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-full text-xs font-medium text-violet-700">
                <Ghost className="w-3 h-3" />
                <span>+50% Secret</span>
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        {!hasAnyBuff && availableBadges.length === 0 && (
          <p className="text-center text-xs text-amber-600/70">
            {t('modals:badges.hint', { defaultValue: 'Complete estágios no Modo Treinador para ganhar insígnias!' })}
          </p>
        )}
      </div>

      {/* Selection Modal */}
      {selectedSlot && (
        <BadgeSelectionModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          slot={selectedSlot}
          currentBadge={
            selectedSlot === 1 ? equippedBadges.slot_1 :
            selectedSlot === 2 ? equippedBadges.slot_2 :
            equippedBadges.slot_3
          }
          availableBadges={availableBadges}
          onEquip={onEquip}
          onUnequip={onUnequip}
          loading={loading}
        />
      )}
    </>
  );
};
