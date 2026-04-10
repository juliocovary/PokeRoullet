import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Helper function to update launch event progress
const updateLaunchEventProgress = async (userId: string, category: string, increment: number = 1) => {
  const { data, error } = await supabase.rpc('update_launch_event_progress', {
    p_user_id: userId,
    p_category: category,
    p_increment: increment,
  });

  if (error) {
    console.error('[LAUNCH_EVENT] Error updating progress:', error);
  } else {
    console.log('[LAUNCH_EVENT] Progress updated:', { category, increment, data });
  }
};

export interface Item {
  id: number;
  name: string;
  description?: string;
  type: string;
  price: number;
  icon_url?: string;
}

export interface UserItem {
  id: string;
  user_id: string;
  item_id: number;
  quantity: number;
  item: Item;
}

const SHARED_CACHE_TTL_MS = 2 * 60 * 1000;

type SharedItemsCache = {
  items: Item[];
  userItems: UserItem[];
  userId: string | null;
  loadedAt: number;
  itemsPromise: Promise<Item[] | null> | null;
  userItemsPromise: Promise<UserItem[] | null> | null;
};

const sharedCache: SharedItemsCache = {
  items: [],
  userItems: [],
  userId: null,
  loadedAt: 0,
  itemsPromise: null,
  userItemsPromise: null,
};

const sharedListeners = new Set<() => void>();

const notifySharedListeners = () => {
  sharedListeners.forEach((listener) => listener());
};

const isCacheFresh = (timestamp: number) => Date.now() - timestamp < SHARED_CACHE_TTL_MS;

export const useItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>(sharedCache.items);
  const [userItems, setUserItems] = useState<UserItem[]>(sharedCache.userItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncFromCache = () => {
      setItems(sharedCache.items);
      setUserItems(sharedCache.userItems);
    };

    sharedListeners.add(syncFromCache);
    syncFromCache();

    return () => {
      sharedListeners.delete(syncFromCache);
    };
  }, []);

  const loadItems = useCallback(async (force = false) => {
    if (!force && sharedCache.items.length > 0 && isCacheFresh(sharedCache.loadedAt)) {
      setItems(sharedCache.items);
      return;
    }

    if (sharedCache.itemsPromise) {
      const cachedItems = await sharedCache.itemsPromise;
      if (cachedItems) {
        setItems(cachedItems);
      }
      return;
    }

    try {
      sharedCache.itemsPromise = supabase
        .from('items')
        .select('id, name, description, type, price, icon_url')
        .order('name')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading items:', error);
            return null;
          }

          const nextItems = (data || []) as Item[];
          sharedCache.items = nextItems;
          sharedCache.loadedAt = Date.now();
          notifySharedListeners();
          return nextItems;
        });

      const loadedItems = await sharedCache.itemsPromise;
      if (loadedItems) {
        setItems(loadedItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      sharedCache.itemsPromise = null;
    }
  }, []);

  const loadUserItems = useCallback(async (force = false) => {
    if (!user) {
      setUserItems([]);
      setLoading(false);
      return;
    }

    if (
      !force &&
      sharedCache.userId === user.id &&
      sharedCache.userItems.length > 0 &&
      isCacheFresh(sharedCache.loadedAt)
    ) {
      setUserItems(sharedCache.userItems);
      setLoading(false);
      return;
    }

    if (sharedCache.userItemsPromise) {
      const cachedUserItems = await sharedCache.userItemsPromise;
      if (cachedUserItems) {
        setUserItems(cachedUserItems);
      }
      setLoading(false);
      return;
    }

    try {
      sharedCache.userId = user.id;
      sharedCache.userItemsPromise = supabase
        .from('user_items')
        .select(`
          id,
          user_id,
          item_id,
          quantity,
          item:items (
            id,
            name,
            description,
            type,
            icon_url
          )
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading user items:', error);
            return null;
          }

          const formattedItems: UserItem[] = (data || []).map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            item_id: item.item_id,
            quantity: item.quantity,
            item: item.item,
          }));

          sharedCache.userItems = formattedItems;
          sharedCache.loadedAt = Date.now();
          notifySharedListeners();
          return formattedItems;
        });

      const loadedUserItems = await sharedCache.userItemsPromise;
      if (loadedUserItems) {
        setUserItems(loadedUserItems);
      }
    } catch (error) {
      console.error('Error loading user items:', error);
    } finally {
      sharedCache.userItemsPromise = null;
      setLoading(false);
    }
  }, [user]);

  // Comprar item
  const buyItem = async (itemId: number, quantity: number = 1): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('buy_item', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_quantity: quantity,
      });

      if (error) {
        toast({
          title: 'Erro na compra',
          description: 'Ocorreu um erro ao processar a compra.',
          variant: 'destructive',
        });
        return false;
      }

      const result = data[0];
      if (result?.success) {
        toast({
          title: '✨ Compra realizada!',
          description: result.message,
        });

        const upgradeItemIds = [999, 1000, 1001];
        if (upgradeItemIds.includes(itemId)) {
          await updateLaunchEventProgress(user.id, 'upgrade', quantity);
        }

        await loadUserItems(true);
        return true;
      }

      toast({
        title: 'Compra não realizada',
        description: result?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      console.error('Error buying item:', error);
      toast({
        title: 'Erro na compra',
        description: 'Ocorreu um erro ao processar a compra.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadItems(), loadUserItems()]);
      setLoading(false);
    };

    loadAll();
  }, [user, loadItems, loadUserItems]);

  return {
    items,
    userItems,
    loading,
    buyItem,
    loadUserItems,
  };
};