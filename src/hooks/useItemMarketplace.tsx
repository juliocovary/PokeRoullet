import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ItemMarketplaceListing {
  id: string;
  seller_id: string;
  seller_nickname: string;
  item_id: number;
  item_name: string;
  item_type: string;
  item_icon_url: string | null;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface ItemListingsResponse {
  listings: ItemMarketplaceListing[];
  totalCount: number;
  totalPages: number;
}

export const useItemMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [myItemListings, setMyItemListings] = useState<ItemMarketplaceListing[]>([]);
  const [activeItemListingsCount, setActiveItemListingsCount] = useState(0);
  const MAX_ITEM_LISTINGS = 3;

  const loadItemListings = useCallback(async (
    page: number = 1,
    pageSize: number = 12,
    filters?: { itemType?: string; search?: string }
  ): Promise<ItemListingsResponse> => {
    try {
      const { data, error } = await supabase.rpc('get_active_item_marketplace_listings', {
        p_page: page,
        p_page_size: pageSize,
        p_item_type: filters?.itemType || null,
        p_search: filters?.search || null
      });

      if (error || !data || data.length === 0) {
        return { listings: [], totalCount: 0, totalPages: 0 };
      }

      const totalCount = Number(data[0]?.total_count) || 0;
      const listings: ItemMarketplaceListing[] = data.map((item: any) => ({
        id: item.id,
        seller_id: item.seller_id,
        seller_nickname: item.seller_nickname,
        item_id: item.item_id,
        item_name: item.item_name,
        item_type: item.item_type,
        item_icon_url: item.item_icon_url,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        expires_at: item.expires_at
      }));

      return { listings, totalCount, totalPages: Math.ceil(totalCount / pageSize) };
    } catch {
      return { listings: [], totalCount: 0, totalPages: 0 };
    }
  }, []);

  const loadMyItemListings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_item_listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) return;
      const listings = (data || []) as ItemMarketplaceListing[];
      setMyItemListings(listings);
      setActiveItemListingsCount(listings.length);
    } catch {}
  }, [user]);

  const createItemListing = async (itemId: number, quantity: number, price: number): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_item_marketplace_listing', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_quantity: quantity,
        p_price: price
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({ title: '✨ Item listado!', description: 'Seu item foi colocado à venda no TradeHub.' });
        await loadMyItemListings();
        return true;
      } else {
        toast({ title: 'Erro', description: result?.message || 'Erro desconhecido', variant: 'destructive' });
        return false;
      }
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buyItemListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('buy_item_marketplace_listing', {
        p_user_id: user.id,
        p_listing_id: listingId
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({ title: '🎉 Compra realizada!', description: `${result.item_name} adicionado ao inventário!` });
        return true;
      } else {
        toast({ title: 'Erro', description: result?.message || 'Erro desconhecido', variant: 'destructive' });
        return false;
      }
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelItemListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_item_marketplace_listing', {
        p_user_id: user.id,
        p_listing_id: listingId
      });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({ title: 'Oferta cancelada', description: 'Itens devolvidos ao inventário.' });
        await loadMyItemListings();
        return true;
      } else {
        toast({ title: 'Erro', description: result?.message || 'Erro desconhecido', variant: 'destructive' });
        return false;
      }
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMyItemListings();
  }, [user, loadMyItemListings]);

  return {
    loading,
    myItemListings,
    activeItemListingsCount,
    maxItemListings: MAX_ITEM_LISTINGS,
    loadItemListings,
    loadMyItemListings,
    createItemListing,
    buyItemListing,
    cancelItemListing
  };
};
