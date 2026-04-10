import { useState } from 'react';
import { Lock, Clover, Star, ChevronDown, ShoppingCart, PartyPopper, MapPin, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import kantoImg from '@/assets/regions/kanto.png';
import johtoImg from '@/assets/regions/johto.png';
import hoennImg from '@/assets/regions/hoenn.png';
import sinnohImg from '@/assets/regions/sinnoh.png';
import unovaImg from '@/assets/regions/unova.png';
import kalosImg from '@/assets/regions/kalos.png';
import alolaImg from '@/assets/regions/alola.png';
import allRegionsImg from '@/assets/regions/all-regions.webp';
import pokeshardIcon from '@/assets/pokeshard.png';
import { ACTIVE_REGION_PACKS, type RegionId, type RegionRequirement } from '@/data/regionPacks';

interface Region {
  id: RegionId;
  name: string;
  icon: string;
  requirement?: RegionRequirement;
}

const REGION_ICONS: Record<RegionId, string> = {
  kanto: kantoImg,
  johto: johtoImg,
  hoenn: hoennImg,
  sinnoh: sinnohImg,
  unova: unovaImg,
  kalos: kalosImg,
  alola: alolaImg,
  galar: allRegionsImg,
  hisui: allRegionsImg,
  paldea: allRegionsImg,
};

const REGIONS: Region[] = ACTIVE_REGION_PACKS.map((region) => ({
  id: region.id,
  name: region.name,
  icon: REGION_ICONS[region.id],
  requirement: region.requirement,
}));

interface RegionSelectorProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  kantoCompletion: number;
  isEventActive?: boolean;
  eventDaysRemaining?: number;
  onOpenEventModal?: () => void;
}

export const RegionSelector = ({ 
  currentRegion, 
  onRegionChange, 
  kantoCompletion,
  isEventActive,
  eventDaysRemaining,
  onOpenEventModal
}: RegionSelectorProps) => {
  const { t } = useTranslation('game');
  const { profile, loadProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedRegionToPurchase, setSelectedRegionToPurchase] = useState<Region | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const isRegionUnlocked = (region: Region): boolean => {
    if (!region.requirement) return true;
    if (!profile) return false;
    
    return profile.unlocked_regions?.includes(region.id) || false;
  };

  const canShowPurchaseOption = (region: Region): boolean => {
    if (!region.requirement || region.requirement.type !== 'purchase') return false;
    if (!profile) return false;
    
    if (region.requirement.prerequisite) {
      return profile.unlocked_regions?.includes(region.requirement.prerequisite) || false;
    }
    return true;
  };

  const handlePurchaseClick = (region: Region) => {
    setSelectedRegionToPurchase(region);
    setPurchaseDialogOpen(true);
    setOpen(false);
  };

  const handleRegionSelect = (region: Region) => {
    const isUnlocked = isRegionUnlocked(region);
    const showPurchaseButton = region.requirement?.type === 'purchase' && !isUnlocked && canShowPurchaseOption(region);
    
    if (showPurchaseButton) {
      handlePurchaseClick(region);
    } else if (isUnlocked) {
      onRegionChange(region.id);
      setOpen(false);
    }
  };

  const handlePurchaseConfirm = async () => {
    if (
      !user ||
      !selectedRegionToPurchase ||
      !selectedRegionToPurchase.requirement ||
      selectedRegionToPurchase.requirement.type !== 'purchase'
    ) {
      return;
    }
    
    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.rpc('purchase_region', {
        p_user_id: user.id,
        p_region: selectedRegionToPurchase.id,
        p_price: selectedRegionToPurchase.requirement.price
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({
          title: t('regions.purchaseSuccess', { region: selectedRegionToPurchase.name }),
          description: result.message,
        });
        await loadProfile();
      } else {
        toast({
          title: t('regions.insufficientShards'),
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error purchasing region:', error);
      toast({
        title: 'Error',
        description: 'Failed to purchase region',
        variant: 'destructive'
      });
    } finally {
      setIsPurchasing(false);
      setPurchaseDialogOpen(false);
      setSelectedRegionToPurchase(null);
    }
  };

  const currentRegionData = REGIONS.find(r => r.id === currentRegion);

  // Region Grid Component
  const RegionGrid = () => (
    <div className="grid grid-cols-2 gap-3 p-2">
      {REGIONS.map(region => {
        const isUnlocked = isRegionUnlocked(region);
        const isActive = currentRegion === region.id;
        const isPurchasable = region.requirement?.type === 'purchase';
        const canPurchase = canShowPurchaseOption(region);
        const showPurchaseButton = isPurchasable && !isUnlocked && canPurchase;
        const hiddenDueToPrerequisite = isPurchasable && !isUnlocked && !canPurchase;
        
        if (hiddenDueToPrerequisite) return null;
        
        return (
          <button
            key={region.id}
            onClick={() => handleRegionSelect(region)}
            disabled={!isUnlocked && !showPurchaseButton}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-300 group",
              "flex flex-col items-center justify-center gap-2 min-h-[120px]",
              isActive && isUnlocked && "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/50",
              !isActive && isUnlocked && "bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-600 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02]",
              showPurchaseButton && "bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/50 hover:border-purple-400 hover:scale-[1.02] cursor-pointer",
              !isUnlocked && !showPurchaseButton && "bg-gradient-to-br from-gray-900/70 to-black/70 border-gray-700/50 cursor-not-allowed opacity-60"
            )}
          >
            {/* Active indicator */}
            {isActive && isUnlocked && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            
            {/* Region Image */}
            <div className="relative">
              <img 
                src={region.icon} 
                alt={region.name}
                className={cn(
                  "w-16 h-16 object-contain transition-all duration-300",
                  !isUnlocked && !showPurchaseButton && "grayscale opacity-40",
                  showPurchaseButton && "opacity-70",
                  isUnlocked && "drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                  isActive && isUnlocked && "scale-110"
                )}
              />
              
              {/* Lock overlay */}
              {!isUnlocked && !showPurchaseButton && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800/90 border border-gray-600 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}
              
              {/* Purchase overlay */}
              {showPurchaseButton && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-purple-600/90 border-2 border-purple-400 flex items-center justify-center shadow-lg animate-pulse">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Region Name */}
            <span className={cn(
              "text-sm font-bold tracking-wide",
              isActive && isUnlocked && "text-cyan-300",
              !isActive && isUnlocked && "text-gray-200",
              showPurchaseButton && "text-purple-300",
              !isUnlocked && !showPurchaseButton && "text-gray-500"
            )}>
              {region.name}
            </span>
            
            {/* Purchase price */}
            {showPurchaseButton && region.requirement?.type === 'purchase' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-400/30">
                <img src={pokeshardIcon} alt="shards" className="w-4 h-4" />
                <span className="text-xs text-purple-300 font-semibold">
                  {region.requirement.price}
                </span>
              </div>
            )}
            
            {/* Requirement hint for locked regions */}
            {!isUnlocked && !showPurchaseButton && region.requirement?.type === 'pokedex_completion' && (
              <span className="text-[10px] text-gray-500 text-center">
                {region.requirement.percentage}% {region.requirement.region}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Trigger Button
  const TriggerButton = (
    <Button 
      className="w-full h-auto p-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 md:border-4 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
    >
      <div className="p-2 md:p-4 w-full">
        <div className="text-center mb-1 md:mb-2">
          <div className="flex items-center justify-center gap-1.5">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
            <h3 className="text-[9px] md:text-xs font-bold text-cyan-300 tracking-wider uppercase">
              {t('regions.selectRegion')}
            </h3>
          </div>
        </div>
        
        <div className="relative">
          <img 
            src={currentRegionData?.icon} 
            alt={currentRegionData?.name}
            className="w-16 h-16 md:w-24 md:h-24 mx-auto object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-lg animate-pulse" />
        </div>
        
        <div className="flex items-center justify-center gap-1 md:gap-2 mt-1 md:mt-2">
          <span className="text-[10px] md:text-sm font-bold text-white">{currentRegionData?.name}</span>
          <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-cyan-300" />
        </div>
      </div>
    </Button>
  );

  return (
    <>
      <div className="lg:fixed left-1 md:left-6 lg:top-1/2 lg:-translate-y-1/2 z-40 space-y-2 md:space-y-3">
        {/* Event Button - Desktop only, above multipliers */}
        {isEventActive && onOpenEventModal && (
          <div className="hidden lg:block">
            <Button
              onClick={onOpenEventModal}
              className="event-button event-button-active w-full px-4 py-3 flex items-center justify-center gap-2 text-white font-bold"
            >
              <PartyPopper className="w-5 h-5" />
              <span>{t('event:buttonLabel')} {new Date().getFullYear()}</span>
              {eventDaysRemaining !== undefined && eventDaysRemaining > 0 && (
                <Badge className="bg-white/30 text-white text-xs font-bold border-0 ml-1">
                  {eventDaysRemaining}d
                </Badge>
              )}
            </Button>
          </div>
        )}

        {/* Region Selector - Dialog on Desktop, Drawer on Mobile */}
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              {TriggerButton}
            </DrawerTrigger>
            <DrawerContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-t-2 border-cyan-500/50">
              <DrawerHeader className="border-b border-gray-700/50 pb-4">
                <DrawerTitle className="flex items-center justify-center gap-2 text-cyan-300">
                  <MapPin className="w-5 h-5" />
                  {t('regions.selectRegion')}
                </DrawerTitle>
              </DrawerHeader>
              <div className="max-h-[60vh] overflow-y-auto pb-6">
                <RegionGrid />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              {TriggerButton}
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center gap-2 text-cyan-300">
                  <MapPin className="w-5 h-5" />
                  {t('regions.selectRegion')}
                </DialogTitle>
              </DialogHeader>
              <RegionGrid />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('regions.purchaseRegion')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              {selectedRegionToPurchase && t('regions.purchaseConfirm', { 
                region: selectedRegionToPurchase.name, 
                price: selectedRegionToPurchase.requirement?.type === 'purchase' ? selectedRegionToPurchase.requirement.price : 0 
              })}
              <div className="mt-3 flex items-center gap-2 text-sm text-purple-300">
                <img src={pokeshardIcon} alt="shards" className="w-5 h-5" />
                <span>Seus Shards: {profile?.pokeshards || 0}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePurchaseConfirm}
              disabled={isPurchasing || (profile && selectedRegionToPurchase?.requirement?.type === 'purchase' && selectedRegionToPurchase.requirement.price && profile.pokeshards < selectedRegionToPurchase.requirement.price)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              {isPurchasing ? 'Comprando...' : 'Comprar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
