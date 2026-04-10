import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';

export interface PackMarketplaceListing {
  id: string;
  seller_id: string;
  seller_nickname: string;
  pack_type_id: string;
  pack_name: string;
  pack_icon_url: string | null;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface PackListingsResponse {
  listings: PackMarketplaceListing[];
  totalCount: number;
  totalPages: number;
}

export const usePackMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('modals');
  const [loading, setLoading] = useState(false);
  const [myPackListings, setMyPackListings] = useState<PackMarketplaceListing[]>([]);
  const [activePackListingsCount, setActivePackListingsCount] = useState(0);
  const MAX_PACK_LISTINGS = 3;

  const loadPackListings = useCallback(async (
    page: number = 1,
    pageSize: number = 12,
    filters?: { search?: string }
  ): Promise<PackListingsResponse> => {
    try {
      const { data, error } = await supabase.rpc('get_active_pack_marketplace_listings' as never, {
        p_page: page,
        p_page_size: pageSize,
        p_search: filters?.search || null
      } as never);

      const rows = (data as unknown as Array<Record<string, unknown>> | null) ?? null;

      if (error || !rows || rows.length === 0) {
        return { listings: [], totalCount: 0, totalPages: 0 };
      }

      const totalCount = Number(rows[0]?.total_count) || 0;
      const listings: PackMarketplaceListing[] = rows.map((item) => ({
        id: String(item.id),
        seller_id: String(item.seller_id),
        seller_nickname: String(item.seller_nickname),
        pack_type_id: String(item.pack_type_id),
        pack_name: String(item.pack_name),
        pack_icon_url: (item.pack_icon_url as string | null) ?? null,
        quantity: Number(item.quantity),
        price: Number(item.price),
        status: String(item.status),
        created_at: String(item.created_at),
        expires_at: (item.expires_at as string | undefined) ?? undefined,
      }));

      return { listings, totalCount, totalPages: Math.ceil(totalCount / pageSize) };
    } catch {
      return { listings: [], totalCount: 0, totalPages: 0 };
    }
  }, []);

  const loadMyPackListings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_my_pack_marketplace_listings' as never, {
        p_user_id: user.id,
      } as never);

      const rows = (data as unknown as Array<Record<string, unknown>> | null) ?? null;

      if (error || !rows) {
        return;
      }

      const listings: PackMarketplaceListing[] = rows.map((item) => ({
        id: String(item.id),
        seller_id: String(item.seller_id),
        seller_nickname: String(item.seller_nickname),
        pack_type_id: String(item.pack_type_id),
        pack_name: String(item.pack_name),
        pack_icon_url: (item.pack_icon_url as string | null) ?? null,
        quantity: Number(item.quantity),
        price: Number(item.price),
        status: String(item.status),
        created_at: String(item.created_at),
        expires_at: (item.expires_at as string | undefined) ?? undefined,
      }));

      setMyPackListings(listings);
      setActivePackListingsCount(listings.length);
    } catch {
      // no-op
    }
  }, [user]);

  const createPackListing = async (packTypeId: string, quantity: number, price: number): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_pack_marketplace_listing' as never, {
        p_user_id: user.id,
        p_pack_type_id: packTypeId,
        p_quantity: quantity,
        p_price: price,
      } as never);

      if (error) {
        toast({ title: t('marketplace.error'), description: error.message, variant: 'destructive' });
        return false;
      }

      const result = (data as unknown as Array<{ success: boolean; message: string }>)?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.listingCreated'),
          description: t('marketplace.packListingCreatedDesc', { defaultValue: 'Your pack is now available in TradeHub.' }),
        });
        await loadMyPackListings();
        return true;
      }

      toast({ title: t('marketplace.error'), description: result?.message || t('marketplace.unknownError'), variant: 'destructive' });
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buyPackListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('buy_pack_marketplace_listing' as never, {
        p_user_id: user.id,
        p_listing_id: listingId,
      } as never);

      if (error) {
        toast({ title: t('marketplace.error'), description: error.message, variant: 'destructive' });
        return false;
      }

      const result = (data as unknown as Array<{ success: boolean; message: string; pack_name: string }>)?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.purchaseSuccess'),
          description: `${result.pack_name} ${t('marketplace.addedToInventory')}`,
        });
        return true;
      }

      toast({ title: t('marketplace.error'), description: result?.message || t('marketplace.unknownError'), variant: 'destructive' });
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelPackListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_pack_marketplace_listing' as never, {
        p_user_id: user.id,
        p_listing_id: listingId,
      } as never);

      if (error) {
        toast({ title: t('marketplace.error'), description: error.message, variant: 'destructive' });
        return false;
      }

      const result = (data as unknown as Array<{ success: boolean; message: string }>)?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.listingCancelled'),
          description: t('marketplace.packReturned', { defaultValue: 'Pack returned to your inventory.' }),
        });
        await loadMyPackListings();
        return true;
      }

      toast({ title: t('marketplace.error'), description: result?.message || t('marketplace.unknownError'), variant: 'destructive' });
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyPackListings();
    }
  }, [user, loadMyPackListings]);

  return {
    loading,
    myPackListings,
    activePackListingsCount,
    maxPackListings: MAX_PACK_LISTINGS,
    loadPackListings,
    loadMyPackListings,
    createPackListing,
    buyPackListing,
    cancelPackListing,
  };
};
