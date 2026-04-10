import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Gift, Sparkles, Coins, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFriendGifts } from '@/hooks/useFriendGifts';
import { useProfile } from '@/hooks/useProfile';
import pokeshardIcon from '@/assets/pokeshard.png';
import pokecoinIcon from '@/assets/pokecoin.png';
import masterballIcon from '@/assets/masterball.png';

interface PendingGiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingGiftsModal = ({ isOpen, onClose }: PendingGiftsModalProps) => {
  const { t } = useTranslation('modals');
  const { pendingGifts, loadPendingGifts, claimGift, loading } = useFriendGifts();
  const { getAvatarSrc } = useProfile();
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPendingGifts();
    }
  }, [isOpen, loadPendingGifts]);

  const handleClaim = async (giftId: string) => {
    setClaiming(giftId);
    await claimGift(giftId);
    setClaiming(null);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'spins':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'coins':
        return <img src={pokecoinIcon} alt="coins" className="w-5 h-5" />;
      case 'shards':
        return <img src={pokeshardIcon} alt="shards" className="w-5 h-5" />;
      case 'legendary_spin':
        return <img src={masterballIcon} alt="legendary" className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getRewardText = (type: string, amount: number) => {
    switch (type) {
      case 'spins':
        return `${amount} Giros`;
      case 'coins':
        return `${amount} PokéCoins`;
      case 'shards':
        return `${amount} PokéShards`;
      case 'legendary_spin':
        return `${amount} Giro Lendário`;
      default:
        return `${amount} ${type}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            {t('friends.pendingGifts')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-80">
          {loading && pendingGifts.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingGifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('friends.noGifts')}</p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {pendingGifts.map((gift) => (
                <div 
                  key={gift.gift_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
                    <img 
                      src={getAvatarSrc(gift.sender_avatar)} 
                      alt={gift.sender_nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">{gift.sender_nickname}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getRewardIcon(gift.reward_type)}
                      <span>{getRewardText(gift.reward_type, gift.reward_amount)}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleClaim(gift.gift_id)}
                    disabled={claiming === gift.gift_id}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {claiming === gift.gift_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      t('friends.claim')
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
