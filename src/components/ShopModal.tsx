import { useState, useEffect } from 'react';
import { X, ShoppingCart, Coins, TrendingUp, Package, Sparkles, Star, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useSpinProgression } from '@/hooks/useSpinProgression';
import { useLuckProgression } from '@/hooks/useLuckProgression';
import { useXPProgression } from '@/hooks/useXPProgression';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import giroEternoIcon from '@/assets/giro-eterno-icon.png';
import { useTranslation } from 'react-i18next';
interface ShopItem {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  icon_url: string;
}
interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShopItem[];
  userPokecoins: number;
  userPokeshards: number;
  onBuyItem: (itemId: number, quantity?: number) => Promise<boolean>;
  onPurchaseSuccess?: () => void;
}
// Helper function to update launch event progress
const updateLaunchEventProgress = async (userId: string, category: string, increment: number = 1) => {
  try {
    await supabase.rpc('update_launch_event_progress', {
      p_user_id: userId,
      p_category: category,
      p_increment: increment,
    });
    console.log('[LAUNCH_EVENT] Progress updated:', { category, increment });
  } catch (error) {
    console.error('[LAUNCH_EVENT] Error updating progress:', error);
  }
};

export const ShopModal = ({
  isOpen,
  onClose,
  items,
  userPokecoins,
  userPokeshards,
  onBuyItem,
  onPurchaseSuccess
}: ShopModalProps) => {
  const { t } = useTranslation(['modals']);
  const isMobile = useIsMobile();
  const {
    user
  } = useAuth();
  const {
    increaseBaseSpins,
    isLoading: spinLoading
  } = useSpinProgression();
  const {
    increaseLuck,
    isLoading: luckLoading
  } = useLuckProgression();
  const {
    increaseXPMultiplier,
    isLoading: xpLoading
  } = useXPProgression();
  const [buying, setBuying] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false); // Global purchase lock
  const [isLoadingUpgrades, setIsLoadingUpgrades] = useState(true); // Loading state for upgrades
  const [giroEternoPurchases, setGiroEternoPurchases] = useState(0);
  const [luckUpgradePurchases, setLuckUpgradePurchases] = useState(0);
  const [xpUpgradePurchases, setXPUpgradePurchases] = useState(0);
  const [buyingGiroEterno, setBuyingGiroEterno] = useState(false);
  const [buyingLuckUpgrade, setBuyingLuckUpgrade] = useState(false);
  const [buyingXPUpgrade, setBuyingXPUpgrade] = useState(false);
  const [boosterQuantities, setBoosterQuantities] = useState<Record<number, number>>({});
  
  // Reset loading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoadingUpgrades(true);
      setGiroEternoPurchases(0);
      setLuckUpgradePurchases(0);
      setXPUpgradePurchases(0);
      setIsPurchasing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchUpgradePurchases = async () => {
      if (!user || !isOpen) return;
      
      setIsLoadingUpgrades(true);
      try {
        // Fetch all upgrade purchases in parallel
        const [giroResult, luckResult, xpResult] = await Promise.all([
          supabase.from('user_items').select('quantity').eq('user_id', user.id).eq('item_id', 999).single(),
          supabase.from('user_items').select('quantity').eq('user_id', user.id).eq('item_id', 1000).single(),
          supabase.from('user_items').select('quantity').eq('user_id', user.id).eq('item_id', 1001).single()
        ]);

        setGiroEternoPurchases(giroResult.data?.quantity || 0);
        setLuckUpgradePurchases(luckResult.data?.quantity || 0);
        setXPUpgradePurchases(xpResult.data?.quantity || 0);
      } catch (error) {
        console.error('Error fetching upgrade purchases:', error);
      } finally {
        setIsLoadingUpgrades(false);
      }
    };
    
    fetchUpgradePurchases();
  }, [isOpen, user]);
  // Calculate upgrade prices and limits
  const GIRO_ETERNO_MAX_PURCHASES = 30; // Base 5 + 30 = 35 max spins
  const LUCK_UPGRADE_MAX_PURCHASES = 20;
  
  const giroEternoPrice = 25 + giroEternoPurchases * 20;
  const luckUpgradePrice = 10 + luckUpgradePurchases * 10;
  const xpUpgradePrice = 15 + xpUpgradePurchases * 15;
  
  const isGiroEternoMaxed = giroEternoPurchases >= GIRO_ETERNO_MAX_PURCHASES;
  const isLuckUpgradeMaxed = luckUpgradePurchases >= LUCK_UPGRADE_MAX_PURCHASES;
  const handleBuyGiroEterno = async () => {
    if (!user || isPurchasing || isLoadingUpgrades) return;
    
    setIsPurchasing(true);
    setBuyingGiroEterno(true);
    try {
      // Use server-side RPC to validate and execute purchase atomically
      const { data, error } = await supabase.rpc('buy_upgrade', {
        p_user_id: user.id,
        p_upgrade_type: 'spin'
      });

      if (error) {
        console.error('Error buying upgrade:', error);
        throw error;
      }

      const result = data?.[0];
      
      if (result?.success) {
        setGiroEternoPurchases(result.new_purchase_count);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        
        // Update launch event progress for upgrade mission
        await updateLaunchEventProgress(user.id, 'upgrade', 1);
        
        toast({
          title: t('shop.toasts.eternalSpinPurchased'),
          description: t('shop.toasts.baseSpinsIncreased')
        });
        
        // Trigger refresh instead of page reload
      } else {
        toast({
          title: t('shop.toasts.purchaseError'),
          description: result?.message || t('shop.toasts.purchaseErrorDesc'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error buying Giro Eterno:', error);
      toast({
        title: t('shop.toasts.purchaseError'),
        description: t('shop.toasts.purchaseErrorDesc'),
        variant: 'destructive'
      });
    } finally {
      setBuyingGiroEterno(false);
      setIsPurchasing(false);
    }
  };
  const handleBuyLuckUpgrade = async () => {
    if (!user || isPurchasing || isLoadingUpgrades) return;
    
    setIsPurchasing(true);
    setBuyingLuckUpgrade(true);
    try {
      // Use server-side RPC to validate and execute purchase atomically
      const { data, error } = await supabase.rpc('buy_upgrade', {
        p_user_id: user.id,
        p_upgrade_type: 'luck'
      });

      if (error) {
        console.error('Error buying upgrade:', error);
        throw error;
      }

      const result = data?.[0];
      
      if (result?.success) {
        setLuckUpgradePurchases(result.new_purchase_count);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        
        // Update launch event progress for upgrade mission
        await updateLaunchEventProgress(user.id, 'upgrade', 1);
        
        toast({
          title: t('shop.toasts.luckCharmPurchased'),
          description: t('shop.toasts.luckIncreased')
        });
        
        // Trigger refresh instead of page reload
      } else {
        toast({
          title: t('shop.toasts.purchaseError'),
          description: result?.message || t('shop.toasts.purchaseErrorDesc'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error buying luck upgrade:', error);
      toast({
        title: t('errors.generic'),
        description: t('shop.toasts.errorBuyingLuckCharm'),
        variant: 'destructive'
      });
    } finally {
      setBuyingLuckUpgrade(false);
      setIsPurchasing(false);
    }
  };
  const handleBuyXPUpgrade = async () => {
    if (!user || isPurchasing || isLoadingUpgrades) return;
    
    setIsPurchasing(true);
    setBuyingXPUpgrade(true);
    try {
      // Use server-side RPC to validate and execute purchase atomically
      const { data, error } = await supabase.rpc('buy_upgrade', {
        p_user_id: user.id,
        p_upgrade_type: 'xp'
      });

      if (error) {
        console.error('Error buying upgrade:', error);
        throw error;
      }

      const result = data?.[0];
      
      if (result?.success) {
        setXPUpgradePurchases(result.new_purchase_count);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        
        // Update launch event progress for upgrade mission
        await updateLaunchEventProgress(user.id, 'upgrade', 1);
        
        toast({
          title: t('shop.toasts.luckyEggPurchased'),
          description: t('shop.toasts.xpIncreased')
        });
        
        // Trigger refresh instead of page reload
      } else {
        toast({
          title: t('shop.toasts.purchaseError'),
          description: result?.message || t('shop.toasts.purchaseErrorDesc'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error buying XP upgrade:', error);
      toast({
        title: t('errors.generic'),
        description: t('shop.toasts.errorBuyingLuckyEgg'),
        variant: 'destructive'
      });
    } finally {
      setBuyingXPUpgrade(false);
      setIsPurchasing(false);
    }
  };
  const getBoosterQuantity = (itemId: number) => boosterQuantities[itemId] || 1;
  
  const setBoosterQuantity = (itemId: number, quantity: number) => {
    setBoosterQuantities(prev => ({ ...prev, [itemId]: Math.max(1, Math.min(99, quantity)) }));
  };

  const handleBuyItem = async (item: ShopItem, quantity: number = 1) => {
    if (isPurchasing) return;
    const totalPrice = item.price * quantity;
    if (userPokecoins < totalPrice) {
      toast({
        title: t('shop.toasts.insufficientCoins'),
        description: t('shop.toasts.insufficientCoinsDesc', { totalPrice, quantity, item: item.name }),
        variant: 'destructive'
      });
      return;
    }
    setIsPurchasing(true);
    setBuying(item.id);
    try {
      const success = await onBuyItem(item.id, quantity);
      if (success) {
        toast({
          title: t('shop.toasts.itemPurchased'),
          description: t('shop.toasts.itemPurchasedDesc', { quantity, item: item.name })
        });
        // Reset quantity after purchase
        setBoosterQuantity(item.id, 1);
        // Trigger refresh callback instead of page reload
      } else {
        toast({
          title: t('shop.toasts.purchaseError'),
          description: t('shop.toasts.purchaseErrorDesc'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('shop.toasts.purchaseError'),
        description: t('shop.toasts.purchaseErrorDesc'),
        variant: 'destructive'
      });
    } finally {
      setBuying(null);
    }
  };
  const renderUpgrades = () => {
    // Show skeleton while loading upgrades
    if (isLoadingUpgrades) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-pokemon p-4 sm:p-6 text-center bg-gradient-to-br from-white to-gray-50 border-gray-200">
              <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto mb-3" />
              <Skeleton className="h-6 w-20 mx-auto mb-3" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Giro Eterno Card */}
        <div className="card-pokemon p-4 sm:p-6 text-center card-hover transition-all duration-300 bg-gradient-to-br from-white to-blue-50 border-blue-200">
          <img src={giroEternoIcon} alt={t('modals:shop.eternitySpin')} className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
          <h3 className="font-bold text-lg sm:text-xl mb-2">{t('modals:shop.eternitySpin')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {t('modals:shop.eternitySpinDesc')}
          </p>
          
          <Badge variant="secondary" className="mb-4">
            {giroEternoPurchases}/{GIRO_ETERNO_MAX_PURCHASES}
          </Badge>
          
          {isGiroEternoMaxed ? (
            <Badge variant="outline" className="mb-3 sm:mb-4 bg-green-100 text-green-700 border-green-300">
              ✓ Máximo atingido
            </Badge>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <img src={pokeshardIcon} alt="Pokeshard" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-base sm:text-lg text-purple-700">
                {giroEternoPrice}
              </span>
            </div>
          )}
          
          <Button onClick={handleBuyGiroEterno} disabled={isPurchasing || isLoadingUpgrades || isGiroEternoMaxed || userPokeshards < giroEternoPrice || buyingGiroEterno || spinLoading} className={`w-full h-11 sm:h-10 text-sm sm:text-base ${!isGiroEternoMaxed && userPokeshards >= giroEternoPrice && !isPurchasing && !isLoadingUpgrades ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : ''}`}>
            {buyingGiroEterno ? <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('modals:shop.buying')}
              </div> : isGiroEternoMaxed ? 'Máximo atingido' : userPokeshards >= giroEternoPrice ? <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('modals:shop.buyUpgrade')}
              </div> : t('modals:shop.insufficientPokeshards')}
          </Button>
        </div>

        {/* Amuleto da Sorte Card */}
        <div className="card-pokemon p-4 sm:p-6 text-center card-hover transition-all duration-300 bg-gradient-to-br from-white to-yellow-50 border-yellow-200">
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-500" />
          <h3 className="font-bold text-lg sm:text-xl mb-2">{t('modals:shop.luckCharm')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t('modals:shop.luckCharmDesc')}</p>
          
          <Badge variant="secondary" className="mb-4">
            {luckUpgradePurchases}/{LUCK_UPGRADE_MAX_PURCHASES}
          </Badge>
          
          {isLuckUpgradeMaxed ? (
            <Badge variant="outline" className="mb-3 sm:mb-4 bg-green-100 text-green-700 border-green-300">
              ✓ Máximo atingido
            </Badge>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <img src={pokeshardIcon} alt="Pokeshard" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-base sm:text-lg text-purple-700">
                {luckUpgradePrice}
              </span>
            </div>
          )}
          
          <Button onClick={handleBuyLuckUpgrade} disabled={isPurchasing || isLoadingUpgrades || isLuckUpgradeMaxed || userPokeshards < luckUpgradePrice || buyingLuckUpgrade || luckLoading} className={`w-full h-11 sm:h-10 text-sm sm:text-base ${!isLuckUpgradeMaxed && userPokeshards >= luckUpgradePrice && !isPurchasing && !isLoadingUpgrades ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : ''}`}>
            {buyingLuckUpgrade ? <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('modals:shop.buying')}
              </div> : isLuckUpgradeMaxed ? 'Máximo atingido' : userPokeshards >= luckUpgradePrice ? <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('modals:shop.buyUpgrade')}
              </div> : t('modals:shop.insufficientPokeshards')}
          </Button>
        </div>

        {/* Ovo da Sorte Card */}
        <div className="card-pokemon p-4 sm:p-6 text-center card-hover transition-all duration-300 bg-gradient-to-br from-white to-green-50 border-green-200">
          <Star className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-green-500" />
          <h3 className="font-bold text-lg sm:text-xl mb-2">{t('modals:shop.luckyEgg')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {t('modals:shop.luckyEggDesc')}
          </p>
          
          {xpUpgradePurchases > 0 && <Badge variant="secondary" className="mb-4">
              {t('modals:shop.purchased')} {xpUpgradePurchases}x
            </Badge>}
          
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <img src={pokeshardIcon} alt="Pokeshard" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-base sm:text-lg text-purple-700">
              {xpUpgradePrice}
            </span>
          </div>
          
          <Button onClick={handleBuyXPUpgrade} disabled={isPurchasing || isLoadingUpgrades || userPokeshards < xpUpgradePrice || buyingXPUpgrade || xpLoading} className={`w-full h-11 sm:h-10 text-sm sm:text-base ${userPokeshards >= xpUpgradePrice && !isPurchasing && !isLoadingUpgrades ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' : ''}`}>
            {buyingXPUpgrade ? <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('modals:shop.buying')}
              </div> : userPokeshards >= xpUpgradePrice ? <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                {t('modals:shop.buyUpgrade')}
              </div> : t('modals:shop.insufficientPokeshards')}
          </Button>
        </div>
      </div>
    );
  };
  const evolutionItems = items.filter(item => 
    item.type === 'evolution_stone' || item.type === 'evolution_item'
  );

  const boosterItems = items.filter(item => 
    item.type === 'booster' || item.type === 'mystery_box'
  );

  const renderBoosters = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {boosterItems.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          {t('modals:shop.noItems')}
        </div>
      ) : (
        boosterItems.map(item => {
          const quantity = getBoosterQuantity(item.id);
          const totalPrice = item.price * quantity;
          const canAfford = userPokecoins >= totalPrice;
          const isBuying = buying === item.id;
          
          // Determine icon and gradient based on item
          let gradient = 'from-white to-purple-50';
          let borderColor = 'border-purple-200';
          let translationKey = item.name.replace(/\s+/g, '').charAt(0).toLowerCase() + item.name.replace(/\s+/g, '').slice(1);
          
          if (item.name === 'Luck Potion') {
            gradient = 'from-white to-green-50';
            borderColor = 'border-green-200';
            translationKey = 'luckPotion';
          } else if (item.name === 'Shiny Potion') {
            gradient = 'from-white to-pink-50';
            borderColor = 'border-pink-200';
            translationKey = 'shinyPotion';
          } else if (item.name === 'Mystery Box') {
            gradient = 'from-white to-indigo-50';
            borderColor = 'border-indigo-200';
            translationKey = 'mysteryBox';
          } else if (item.name === 'Legendary Spin') {
            gradient = 'from-white to-amber-50';
            borderColor = 'border-amber-200';
            translationKey = 'legendarySpin';
          }
          
          return (
            <div 
              key={item.id} 
              className={`card-pokemon p-4 sm:p-5 text-center card-hover transition-all duration-300 bg-gradient-to-br ${gradient} ${borderColor}`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src={item.icon_url} 
                  alt={item.name} 
                  className="w-full h-full object-contain pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h3 className="font-bold text-sm sm:text-base mb-1">
                {t(`modals:boosters.${translationKey}`, { defaultValue: item.name })}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
                {t(`modals:boosters.${translationKey}Desc`, { defaultValue: item.description })}
              </p>
              
              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setBoosterQuantity(item.id, quantity - 1)}
                  disabled={quantity <= 1 || isPurchasing}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setBoosterQuantity(item.id, quantity + 1)}
                  disabled={quantity >= 99 || isPurchasing}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-1 mb-3">
                <img src={pokecoinIcon} alt="Pokécoin" className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-sm sm:text-base text-amber-700">
                  {totalPrice.toLocaleString()}
                </span>
                {quantity > 1 && (
                  <span className="text-xs text-muted-foreground">
                    ({item.price} x {quantity})
                  </span>
                )}
              </div>
              
              <Button 
                onClick={() => handleBuyItem(item, quantity)} 
                disabled={isPurchasing || !canAfford || isBuying}
                size="sm"
                className={`w-full h-9 text-sm ${canAfford && !isPurchasing ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
              >
                {isBuying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : canAfford ? (
                  <>
                    {t('modals:shop.buy')} {quantity > 1 && `(${quantity}x)`}
                  </>
                ) : (
                  t('modals:shop.insufficientCoins')
                )}
              </Button>
            </div>
          );
        })
      )}
    </div>
  );

  const renderItems = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {evolutionItems.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          {t('modals:shop.noItems')}
        </div>
      ) : (
        evolutionItems.map(item => {
          const canAfford = userPokecoins >= item.price;
          const isBuying = buying === item.id;
          return (
            <div 
              key={item.id} 
              className="card-pokemon p-3 sm:p-4 text-center card-hover transition-all duration-300 bg-gradient-to-br from-white to-slate-50 border-slate-200"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                <img 
                  src={item.icon_url} 
                  alt={item.name} 
                  className="w-full h-full object-contain pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h3 className="font-bold text-xs sm:text-sm mb-1 line-clamp-2 min-h-[2rem]">
                {item.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 line-clamp-2 min-h-[2rem]">
                {t(`modals:shop.evolutionItems.${item.name}`, { defaultValue: item.description })}
              </p>
              
              <div className="flex items-center justify-center gap-1 mb-2">
                <img src={pokecoinIcon} alt="Pokécoin" className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-bold text-xs sm:text-sm text-amber-700">
                  {item.price}
                </span>
              </div>
              
              <Button 
                onClick={() => handleBuyItem(item)} 
                disabled={isPurchasing || !canAfford || isBuying}
                size="sm"
                className={`w-full h-8 text-xs ${canAfford && !isPurchasing ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''}`}
              >
                {isBuying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : canAfford ? (
                  t('modals:shop.buy')
                ) : (
                  t('modals:shop.insufficientCoins')
                )}
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-4xl w-full h-[95vh] sm:max-h-[90vh] p-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 [&>button]:hidden overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white/80 backdrop-blur-sm rounded-t-lg shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h2 className="text-xl sm:text-3xl font-bold text-primary">{t('modals:shop.title')}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Currency Balance - Fixed */}
        <div className="p-3 sm:p-6 border-b bg-gradient-to-r from-yellow-50 to-purple-50 shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <img src={pokecoinIcon} alt="Pokécoin" className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-base sm:text-lg font-bold text-amber-700">
                {userPokecoins.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <img src={pokeshardIcon} alt="Pokeshard" className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-base sm:text-lg font-bold text-purple-700">
                {userPokeshards.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Shop Tabs - Scrollable */}
        <Tabs defaultValue="upgrades" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b h-12 shrink-0">
            <TabsTrigger value="upgrades" className="flex items-center gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('modals:shop.upgrades')}
            </TabsTrigger>
            <TabsTrigger value="boosters" className="flex items-center gap-2 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('modals:boosters.tab', { defaultValue: 'Reforços' })}
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('modals:shop.evolutionItemsTab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upgrades" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full w-full">
              <div className="p-3 sm:p-6 pb-6 pr-3">
                {renderUpgrades()}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="boosters" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full w-full">
              <div className="p-3 sm:p-6 pb-6 pr-3">
                {renderBoosters()}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="items" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full w-full">
              <div className="p-3 sm:p-6 pb-6 pr-3">
                {renderItems()}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>;
};