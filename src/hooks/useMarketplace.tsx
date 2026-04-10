import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

// Price validation schema
const priceSchema = z.number().int().min(1).max(9999);

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

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller_nickname: string;
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  is_shiny: boolean;
  price: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface ListingsResponse {
  listings: MarketplaceListing[];
  totalCount: number;
  totalPages: number;
}

export const useMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('modals');
  const [loading, setLoading] = useState(false);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const MAX_LISTINGS = 3;

  const loadListings = useCallback(async (
    page: number = 1,
    pageSize: number = 12,
    filters?: { rarity?: string; search?: string }
  ): Promise<ListingsResponse> => {
    try {
      // Use the new RPC function that filters expired listings automatically
      const { data, error } = await supabase.rpc('get_active_marketplace_listings', {
        p_page: page,
        p_page_size: pageSize,
        p_rarity: filters?.rarity || null,
        p_search: filters?.search || null
      });

      if (error) {
        console.error('Error loading listings:', error);
        return { listings: [], totalCount: 0, totalPages: 0 };
      }

      if (!data || data.length === 0) {
        return { listings: [], totalCount: 0, totalPages: 0 };
      }

      // Get total count from the first row (all rows have the same total_count)
      const totalCount = Number(data[0]?.total_count) || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map the results to MarketplaceListing format
      const listings: MarketplaceListing[] = data.map((item: any) => ({
        id: item.id,
        seller_id: item.seller_id,
        seller_nickname: item.seller_nickname,
        pokemon_id: item.pokemon_id,
        pokemon_name: item.pokemon_name,
        rarity: item.rarity,
        is_shiny: item.is_shiny,
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        expires_at: item.expires_at
      }));

      return {
        listings,
        totalCount,
        totalPages
      };
    } catch (error) {
      console.error('Error loading listings:', error);
      return { listings: [], totalCount: 0, totalPages: 0 };
    }
  }, []);

  const loadMyListings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading my listings:', error);
        return;
      }

      const listings = data as MarketplaceListing[];
      setMyListings(listings);
      setActiveListingsCount(listings.length);
    } catch (error) {
      console.error('Error loading my listings:', error);
    }
  }, [user]);

  const createListing = async (
    pokemonId: number,
    price: number,
    isShiny: boolean = false
  ): Promise<boolean> => {
    if (!user) return false;

    // Client-side price validation
    const priceValidation = priceSchema.safeParse(price);
    if (!priceValidation.success) {
      toast({
        title: t('marketplace.error'),
        description: t('marketplace.invalidPrice', { defaultValue: 'Price must be between 1 and 9999 Pokécoins' }),
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_marketplace_listing', {
        p_user_id: user.id,
        p_pokemon_id: pokemonId,
        p_price: price,
        p_is_shiny: isShiny
      });

      if (error) {
        console.error('Error creating listing:', error);
        toast({
          title: t('marketplace.error'),
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.listingCreated'),
          description: t('marketplace.listingCreatedDesc')
        });
        await loadMyListings();
        // Update launch event progress
        await updateLaunchEventProgress(user.id, 'marketplace', 1);
        return true;
      } else {
        toast({
          title: t('marketplace.error'),
          description: result?.message || t('marketplace.unknownError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buyListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('buy_marketplace_listing', {
        p_user_id: user.id,
        p_listing_id: listingId
      });

      if (error) {
        console.error('Error buying listing:', error);
        toast({
          title: t('marketplace.error'),
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.purchaseSuccess'),
          description: `${result.pokemon_name} ${t('marketplace.addedToInventory')}`
        });
        return true;
      } else {
        toast({
          title: t('marketplace.error'),
          description: result?.message || t('marketplace.unknownError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error buying listing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_marketplace_listing', {
        p_user_id: user.id,
        p_listing_id: listingId
      });

      if (error) {
        console.error('Error cancelling listing:', error);
        toast({
          title: t('marketplace.error'),
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: t('marketplace.listingCancelled'),
          description: t('marketplace.cardReturned')
        });
        await loadMyListings();
        return true;
      } else {
        toast({
          title: t('marketplace.error'),
          description: result?.message || t('marketplace.unknownError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user, loadMyListings]);

  return {
    loading,
    myListings,
    activeListingsCount,
    maxListings: MAX_LISTINGS,
    loadListings,
    loadMyListings,
    createListing,
    buyListing,
    cancelListing
  };
};
