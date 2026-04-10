import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvailableBadge, Badge as BadgeType } from '@/hooks/useBadges';
import { useTranslation } from 'react-i18next';
import { Award, X, Check, Sparkles, Zap, Star, Ghost } from 'lucide-react';

interface BadgeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: 1 | 2 | 3;
  currentBadge: BadgeType | null;
  availableBadges: AvailableBadge[];
  onEquip: (slot: 1 | 2 | 3, itemId: number) => Promise<boolean>;
  onUnequip: (slot: 1 | 2 | 3) => Promise<boolean>;
  loading: boolean;
}

const getBadgeEffect = (badgeId: number, t: any) => {
  switch (badgeId) {
    case 200:
      return { icon: Zap, effect: '+15% XP', color: 'text-yellow-500' };
    case 201:
      return { icon: Star, effect: '+10% Luck', color: 'text-purple-500' };
    case 202:
      return { icon: Sparkles, effect: '+0.5% Shiny', color: 'text-pink-500' };
    case 203:
      return { icon: Ghost, effect: '+50% Secret', color: 'text-violet-500' };
    default:
      return { icon: Award, effect: '', color: 'text-gray-500' };
  }
};

export const BadgeSelectionModal = ({
  isOpen,
  onClose,
  slot,
  currentBadge,
  availableBadges,
  onEquip,
  onUnequip,
  loading,
}: BadgeSelectionModalProps) => {
  const { t } = useTranslation(['modals']);

  const handleEquip = async (badgeId: number) => {
    const success = await onEquip(slot, badgeId);
    if (success) onClose();
  };

  const handleUnequip = async () => {
    const success = await onUnequip(slot);
    if (success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-800">
            <Award className="w-6 h-6" />
            {t('modals:badges.selectTitle', { slot, defaultValue: `Slot ${slot} - Selecionar Insígnia` })}
          </DialogTitle>
          <DialogDescription>
            {t('modals:badges.selectDescription', { defaultValue: 'Escolha uma insígnia para equipar neste slot' })}
          </DialogDescription>
        </DialogHeader>

        {/* Current Badge */}
        {currentBadge && (
          <div className="p-3 bg-amber-100/50 rounded-lg border border-amber-200 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                  {currentBadge.icon_url ? (
                    <img src={currentBadge.icon_url} alt={currentBadge.name} className="w-8 h-8" />
                  ) : (
                    <Award className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-amber-800">{currentBadge.name}</p>
                  <p className="text-xs text-amber-600">{getBadgeEffect(currentBadge.id, t).effect}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnequip}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-1" />
                {t('modals:badges.remove', { defaultValue: 'Remover' })}
              </Button>
            </div>
          </div>
        )}

        {/* Available Badges */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {availableBadges.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                <p className="text-muted-foreground">
                  {t('modals:badges.noBadges', { defaultValue: 'Você não possui insígnias. Complete estágios no Modo Treinador!' })}
                </p>
              </div>
            ) : (
              availableBadges.map((badge) => {
                const effect = getBadgeEffect(badge.id, t);
                const EffectIcon = effect.icon;
                const isCurrentBadge = currentBadge?.id === badge.id;

                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      badge.isEquipped
                        ? 'bg-amber-200/50 border-amber-400 opacity-60'
                        : isCurrentBadge
                        ? 'bg-amber-100 border-amber-400'
                        : 'bg-white/80 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shadow">
                            {badge.icon_url ? (
                              <img src={badge.icon_url} alt={badge.name} className="w-6 h-6" />
                            ) : (
                              <Award className="w-5 h-5 text-white" />
                            )}
                          </div>
                          {badge.isEquipped && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{badge.name}</p>
                          <div className="flex items-center gap-1">
                            <EffectIcon className={`w-3 h-3 ${effect.color}`} />
                            <span className={`text-xs font-medium ${effect.color}`}>{effect.effect}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          x{badge.quantity}
                        </Badge>
                        {!badge.isEquipped && !isCurrentBadge && (
                          <Button
                            size="sm"
                            onClick={() => handleEquip(badge.id)}
                            disabled={loading}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                          >
                            {t('modals:badges.equip', { defaultValue: 'Equipar' })}
                          </Button>
                        )}
                        {badge.isEquipped && !isCurrentBadge && (
                          <span className="text-xs text-amber-600 font-medium">
                            {t('modals:badges.inUse', { defaultValue: 'Em uso' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
