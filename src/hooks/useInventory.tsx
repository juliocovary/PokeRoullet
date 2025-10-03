import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  icon_url: string;
}

export interface UserItem {
  id: number;
  name: string;
  description: string;
  type: string;
  icon_url: string;
  quantity: number;
}

export const useInventory = () => {
  const { user } = useAuth();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShopItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error loading shop items:', error);
        return;
      }

      setShopItems(data || []);
    } catch (error) {
      console.error('Error loading shop items:', error);
    }
  };

  const loadUserItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_items')
        .select(`
          quantity,
          items (
            id,
            name,
            description,
            type,
            icon_url
          )
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) {
        console.error('Error loading user items:', error);
        return;
      }

      const formattedItems: UserItem[] = (data || []).map(item => ({
        id: item.items.id,
        name: item.items.name,
        description: item.items.description,
        type: item.items.type,
        icon_url: item.items.icon_url,
        quantity: item.quantity
      }));

      setUserItems(formattedItems);
    } catch (error) {
      console.error('Error loading user items:', error);
    }
  };

  const buyItem = async (itemId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('buy_item', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_quantity: 1
      });

      if (error) {
        console.error('Error buying item:', error);
        return false;
      }

      const result = data[0];
      if (result && result.success) {
        // Reload user items to reflect the purchase
        await loadUserItems();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error buying item:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadShopItems(),
        loadUserItems()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    shopItems,
    userItems,
    loading,
    buyItem,
    refreshUserItems: loadUserItems
  };
};