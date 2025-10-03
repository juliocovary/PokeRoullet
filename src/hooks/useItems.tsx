import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

export const useItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar todos os itens disponíveis
  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading items:', error);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  // Carregar itens do usuário
  const loadUserItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_items')
        .select(`
          *,
          item:items(*)
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) {
        console.error('Error loading user items:', error);
        return;
      }

      setUserItems(data || []);
    } catch (error) {
      console.error('Error loading user items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Comprar item
  const buyItem = async (itemId: number, quantity: number = 1): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('buy_item', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_quantity: quantity
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
        
        // Recarregar itens do usuário
        await loadUserItems();
        return true;
      } else {
        toast({
          title: 'Compra não realizada',
          description: result?.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        return false;
      }
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
    loadItems();
    loadUserItems();
  }, [user]);

  return {
    items,
    userItems,
    loading,
    buyItem,
    loadUserItems
  };
};