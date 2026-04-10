import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface PendingGift {
  gift_id: string;
  sender_id: string;
  sender_nickname: string;
  sender_avatar: string;
  reward_type: string;
  reward_amount: number;
  sent_at: string;
}

interface FriendPokedexEntry {
  pokemon_id: number;
  pokemon_name: string;
  is_shiny: boolean;
  placed_at: string;
}

export const useFriendGifts = () => {
  const { user } = useAuth();
  const [pendingGifts, setPendingGifts] = useState<PendingGift[]>([]);
  const [loading, setLoading] = useState(false);
  const [giftSentToday, setGiftSentToday] = useState<Record<string, boolean>>({});

  const loadPendingGifts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_pending_gifts', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading pending gifts:', error);
        return;
      }

      setPendingGifts(data || []);
    } catch (error) {
      console.error('Error loading pending gifts:', error);
    }
  }, [user]);

  const checkCanSendGift = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_send_gift_today', {
        p_user_id: user.id,
        p_friend_id: friendId
      });

      if (error) {
        console.error('Error checking gift status:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking gift status:', error);
      return false;
    }
  }, [user]);

  const sendGift = useCallback(async (friendId: string, friendshipId: string): Promise<{ success: boolean; rewardType?: string; rewardAmount?: number }> => {
    if (!user) return { success: false };

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_daily_gift', {
        p_user_id: user.id,
        p_friend_id: friendId,
        p_friendship_id: friendshipId
      });

      if (error) {
        console.error('Error sending gift:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao enviar presente.',
          variant: 'destructive',
        });
        return { success: false };
      }

      const result = data?.[0];
      if (result?.success) {
        setGiftSentToday(prev => ({ ...prev, [friendId]: true }));
        toast({
          title: 'Presente Enviado!',
          description: `Você enviou um presente para seu amigo!`,
        });
        return { 
          success: true, 
          rewardType: result.reward_type, 
          rewardAmount: result.reward_amount 
        };
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao enviar presente',
          variant: 'destructive',
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const claimGift = useCallback(async (giftId: string): Promise<{ success: boolean; rewardType?: string; rewardAmount?: number; senderNickname?: string }> => {
    if (!user) return { success: false };

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_friend_gift', {
        p_user_id: user.id,
        p_gift_id: giftId
      });

      if (error) {
        console.error('Error claiming gift:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao coletar presente.',
          variant: 'destructive',
        });
        return { success: false };
      }

      const result = data?.[0];
      if (result?.success) {
        // Reload pending gifts
        await loadPendingGifts();
        
        const rewardText = getRewardText(result.reward_type, result.reward_amount);
        toast({
          title: 'Presente Coletado!',
          description: `Você recebeu ${rewardText} de ${result.sender_nickname}!`,
        });
        return { 
          success: true, 
          rewardType: result.reward_type, 
          rewardAmount: result.reward_amount,
          senderNickname: result.sender_nickname
        };
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao coletar presente',
          variant: 'destructive',
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Error claiming gift:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [user, loadPendingGifts]);

  const getFriendPokedex = useCallback(async (friendId: string): Promise<FriendPokedexEntry[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_friend_pokedex', {
        p_user_id: user.id,
        p_friend_id: friendId
      });

      if (error) {
        console.error('Error loading friend pokedex:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading friend pokedex:', error);
      return [];
    }
  }, [user]);

  return {
    pendingGifts,
    loading,
    giftSentToday,
    loadPendingGifts,
    checkCanSendGift,
    sendGift,
    claimGift,
    getFriendPokedex
  };
};

function getRewardText(type: string, amount: number): string {
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
}
