import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, UserPlus, Check, X, Mail, Package, Gift, Eye, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFriendGifts } from "@/hooks/useFriendGifts";

// OPTIMIZATION: Stats are now passed as props from parent (batch loaded)
interface FriendStats {
  pokemonCount: number;
  uniquePokemonCount: number;
  canSendGift: boolean;
}

interface TrainerCardProps {
  friend: any;
  type: 'friend' | 'pending' | 'sent' | 'search';
  stats?: FriendStats; // Stats passed from parent for friends
  onAddFriend?: (userId: string) => void;
  onAcceptRequest?: (friendshipId: string, accept: boolean) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  onViewPokedex?: (friendId: string, friendNickname: string) => void;
  onViewProfile?: (userId: string, nickname: string) => void;
}

export const TrainerCard = ({ friend, type, stats, onAddFriend, onAcceptRequest, onRemoveFriend, onViewPokedex, onViewProfile }: TrainerCardProps) => {
  const { t } = useTranslation('modals');
  const { getAvatarSrc } = useProfile();
  const { sendGift } = useFriendGifts();
  const [sendingGift, setSendingGift] = useState(false);
  const [giftSentThisSession, setGiftSentThisSession] = useState(false);
  
  // Use stats from props if available (batch loaded), otherwise use defaults
  const pokemonCount = {
    total: stats?.pokemonCount ?? 0,
    unique: stats?.uniquePokemonCount ?? 0
  };
  const canSendGift = stats?.canSendGift ?? true;

  const handleSendGift = async () => {
    if (!friend.friendship?.id) return;
    
    setSendingGift(true);
    const result = await sendGift(friend.user_id, friend.friendship.id);
    if (result.success) {
      setGiftSentThisSession(true);
    }
    setSendingGift(false);
  };
  
  // Determine if can send gift (use session state if gift was just sent)
  const effectiveCanSendGift = giftSentThisSession ? false : canSendGift;

  return (
    <Card className="p-3 md:p-4">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-border">
            <img 
              src={getAvatarSrc(friend.avatar)} 
              alt={friend.nickname} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-1 rounded-full text-xs flex items-center gap-0.5">
            <Star className="w-2 h-2" />
            {friend.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <h4 className="font-semibold text-foreground truncate">{friend.nickname}</h4>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span>{t('friends.level')} {friend.level}</span>
              <span className="hidden md:inline">•</span>
              <span>{friend.experience_points} XP</span>
            </div>
            {type === 'friend' && (
              <>
                <span className="hidden md:inline">•</span>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <Package className="w-3 h-3" />
                  <span className="truncate">{pokemonCount.unique} {t('friends.unique')} ({pokemonCount.total} {t('friends.total')})</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-center">
          {type === 'search' && (
            <>
              {onViewProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewProfile(friend.user_id, friend.nickname)}
                  title="Ver Perfil"
                >
                  <User className="w-4 h-4" />
                </Button>
              )}
              {onAddFriend && (
                <Button 
                  size="sm" 
                  onClick={() => onAddFriend(friend.user_id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {t('friends.add')}
                </Button>
              )}
            </>
          )}
          
          {type === 'pending' && onAcceptRequest && (
            <>
              <Button 
                size="sm" 
                onClick={() => onAcceptRequest(friend.friendship.id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onAcceptRequest(friend.friendship.id, false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {type === 'sent' && (
            <Badge variant="secondary">
              <Mail className="w-3 h-3 mr-1" />
              {t('friends.sent')}
            </Badge>
          )}
          
          {type === 'friend' && (
            <>
              {/* Send Gift Button */}
              <Button
                size="sm"
                onClick={handleSendGift}
                disabled={!effectiveCanSendGift || sendingGift}
                className={`${
                  effectiveCanSendGift 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600' 
                    : 'bg-muted text-muted-foreground'
                }`}
                title={effectiveCanSendGift ? t('friends.sendGift') : t('friends.giftSentToday')}
              >
                {sendingGift ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Gift className="w-4 h-4" />
                )}
              </Button>

              {/* View Collection Button */}
              {onViewPokedex && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewPokedex(friend.user_id, friend.nickname)}
                  title={t('friends.viewCollection', { name: '' })}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}

              {/* Remove Friend Button */}
              {onRemoveFriend && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRemoveFriend(friend.friendship.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
