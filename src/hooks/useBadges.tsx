import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url: string;
}

export interface EquippedBadges {
  slot_1: Badge | null;
  slot_2: Badge | null;
  slot_3: Badge | null;
}

export interface BadgeBuffs {
  xp_bonus: number;
  luck_bonus: number;
  shiny_bonus: number;
  secret_active: boolean;
}

export interface AvailableBadge extends Badge {
  quantity: number;
  isEquipped: boolean;
}

export const useBadges = (onRefresh?: () => void) => {
  const { user } = useAuth();
  const { t } = useTranslation(['modals']);
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadges>({
    slot_1: null,
    slot_2: null,
    slot_3: null,
  });
  const [availableBadges, setAvailableBadges] = useState<AvailableBadge[]>([]);
  const [buffs, setBuffs] = useState<BadgeBuffs>({
    xp_bonus: 0,
    luck_bonus: 0,
    shiny_bonus: 0,
    secret_active: false,
  });
  const [loading, setLoading] = useState(false);

  // Get equipped badge IDs for checking
  const getEquippedIds = useCallback(() => {
    const ids: number[] = [];
    if (equippedBadges.slot_1) ids.push(equippedBadges.slot_1.id);
    if (equippedBadges.slot_2) ids.push(equippedBadges.slot_2.id);
    if (equippedBadges.slot_3) ids.push(equippedBadges.slot_3.id);
    return ids;
  }, [equippedBadges]);

  // Load equipped badges
  const loadEquippedBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_equipped_badges');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const typedData = data as unknown as { slot_1: Badge | null; slot_2: Badge | null; slot_3: Badge | null };
        setEquippedBadges({
          slot_1: typedData.slot_1 || null,
          slot_2: typedData.slot_2 || null,
          slot_3: typedData.slot_3 || null,
        });
      }
    } catch (error) {
      console.error('Error loading equipped badges:', error);
    }
  }, [user]);

  // Load available badges from inventory
  const loadAvailableBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_items')
        .select(`
          item_id,
          quantity,
          items!inner (
            id,
            name,
            description,
            icon_url,
            type
          )
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) throw error;

      if (data) {
        const equippedIds = getEquippedIds();
        const badges: AvailableBadge[] = data
          .filter((item: any) => item.items?.type === 'badge')
          .map((item: any) => ({
            id: item.items.id,
            name: item.items.name,
            description: item.items.description,
            icon_url: item.items.icon_url,
            quantity: item.quantity,
            isEquipped: equippedIds.includes(item.items.id),
          }));
        
        setAvailableBadges(badges);
      }
    } catch (error) {
      console.error('Error loading available badges:', error);
    }
  }, [user, getEquippedIds]);

  // Load badge buffs
  const loadBuffs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_badge_buffs');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const typedData = data as Record<string, number | boolean>;
        setBuffs({
          xp_bonus: Number(typedData.xp_bonus) || 0,
          luck_bonus: Number(typedData.luck_bonus) || 0,
          shiny_bonus: Number(typedData.shiny_bonus) || 0,
          secret_active: Boolean(typedData.secret_active),
        });
      }
    } catch (error) {
      console.error('Error loading badge buffs:', error);
    }
  }, [user]);

  // Equip a badge to a slot
  const equipBadge = useCallback(async (slot: 1 | 2 | 3, itemId: number) => {
    if (!user) return false;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('equip_badge', {
        p_slot: slot,
        p_item_id: itemId,
      });

      if (error) throw error;

      const typedData = data as Record<string, unknown> | null;
      if (typedData?.success) {
        toast.success(t('modals:badges.equipped', { defaultValue: 'Insígnia equipada!' }));
        await Promise.all([loadEquippedBadges(), loadAvailableBadges(), loadBuffs()]);
        if (onRefresh) onRefresh();
        return true;
      } else {
        const errorKey = (typedData?.error as string) || 'unknown';
        const errorMessages: Record<string, string> = {
          already_equipped: t('modals:badges.alreadyEquipped', { defaultValue: 'Esta insígnia já está equipada em outro slot!' }),
          badge_not_owned: t('modals:badges.notOwned', { defaultValue: 'Você não possui esta insígnia!' }),
          not_a_badge: t('modals:badges.notABadge', { defaultValue: 'Este item não é uma insígnia!' }),
        };
        toast.error(errorMessages[errorKey] || t('modals:badges.equipError', { defaultValue: 'Erro ao equipar insígnia' }));
        return false;
      }
    } catch (error) {
      console.error('Error equipping badge:', error);
      toast.error(t('modals:badges.equipError', { defaultValue: 'Erro ao equipar insígnia' }));
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, t, loadEquippedBadges, loadAvailableBadges, loadBuffs, onRefresh]);

  // Unequip a badge from a slot
  const unequipBadge = useCallback(async (slot: 1 | 2 | 3) => {
    if (!user) return false;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('equip_badge', {
        p_slot: slot,
        p_item_id: null,
      });

      if (error) throw error;

      const typedData = data as Record<string, unknown> | null;
      if (typedData?.success) {
        toast.success(t('modals:badges.unequipped', { defaultValue: 'Insígnia removida!' }));
        await Promise.all([loadEquippedBadges(), loadAvailableBadges(), loadBuffs()]);
        if (onRefresh) onRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unequipping badge:', error);
      toast.error(t('modals:badges.unequipError', { defaultValue: 'Erro ao remover insígnia' }));
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, t, loadEquippedBadges, loadAvailableBadges, loadBuffs, onRefresh]);

  // Reload all data
  const reload = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadEquippedBadges(), loadAvailableBadges(), loadBuffs()]);
    setLoading(false);
  }, [loadEquippedBadges, loadAvailableBadges, loadBuffs]);

  // Auto-load badge data when user is available
  useEffect(() => {
    if (user) {
      reload();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    equippedBadges,
    availableBadges,
    buffs,
    loading,
    equipBadge,
    unequipBadge,
    reload,
  };
};
