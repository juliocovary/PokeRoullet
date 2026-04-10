import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Trash2, CheckSquare, Square, Star, FlaskConical, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import { calculatePokemonDamage, type StatGrade } from '@/data/trainerPokemonPool';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';
import PokemonDetailModal from './PokemonDetailModal';
import { useItems, type UserItem } from '@/hooks/useItems';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ESSENCE_BOX_ITEM_ID, getEssenceName } from '@/data/essenceConfig';
import statusUpgradeIcon from '@/assets/status-upgrade.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface TrainerInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerPokemon: TrainerPokemonData[];
  teamPokemonIds: string[];
  onDeletePokemon: (ids: string[]) => Promise<boolean>;
}

const MAX_UNITS = 50;

const STAR_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-rose-400',
};

const TrainerInventoryModal = ({
  isOpen,
  onClose,
  trainerPokemon,
  teamPokemonIds,
  onDeletePokemon,
}: TrainerInventoryModalProps) => {
  const { t } = useTranslation('trainer');
  const { userItems, loadUserItems } = useItems();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'units' | 'items'>('units');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPokemon, setSelectedPokemon] = useState<TrainerPokemonData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingBoxId, setOpeningBoxId] = useState<string | null>(null);

  // Sort pokemon by star rating and power
  const sortedPokemon = [...trainerPokemon].sort((a, b) => {
    if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
    return b.power - a.power;
  });

  const toggleSelection = useCallback((id: string) => {
    // Can't select pokemon in team
    if (teamPokemonIds.includes(id)) {
      toast.error(t('inventory.cantDeleteTeamMember'));
      return;
    }
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [teamPokemonIds, t]);

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    const success = await onDeletePokemon(Array.from(selectedIds));
    setIsDeleting(false);
    
    if (success) {
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(t('inventory.deleteSuccess', { count: selectedIds.size }));
    }
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handlePokemonClick = (pokemon: TrainerPokemonData) => {
    if (selectionMode) {
      toggleSelection(pokemon.id);
    } else {
      setSelectedPokemon(pokemon);
    }
  };

  // Filter items for trainer mode (essences, status upgrades, essence boxes, badges)
  const trainerItems = userItems.filter(ui => 
    ui.item.type === 'essence' || 
    ui.item.type === 'trainer_upgrade' || 
    ui.item.type === 'essence_box' ||
    ui.item.type === 'badge'
  );

  // Open Essence Box using atomic RPC
  const handleOpenEssenceBox = async (userItem: UserItem) => {
    if (!user) return;
    if (userItem.item.id !== ESSENCE_BOX_ITEM_ID) return;
    // Prevent opening if already opening any box
    if (openingBoxId !== null) return;
    // Extra check: prevent if quantity is 0 or less
    if (userItem.quantity <= 0) return;
    
    setOpeningBoxId(userItem.id);
    
    try {
      // Call atomic RPC that handles everything server-side
      const { data, error } = await supabase.rpc('open_essence_box', {
        p_user_item_id: userItem.id,
      });
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        message?: string;
        essence_type?: string; 
        amount?: number;
        remaining_quantity?: number;
      };
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to open box');
      }
      
      // Refresh items BEFORE showing toast
      await loadUserItems();
      
      toast.success(
        `${t('inventory.essenceBoxOpened')}: +${result.amount} ${getEssenceName(result.essence_type as any)}!`,
        { duration: 4000 }
      );
    } catch (error) {
      console.error('Error opening essence box:', error);
      toast.error(t('inventory.errorOpeningBox'));
      // Refresh to get correct state even on error
      await loadUserItems();
    } finally {
      setOpeningBoxId(null);
    }
  };

  // Get proper icon for item (use local asset for status upgrade)
  const getItemIcon = (item: UserItem['item']): string => {
    if (item.id === 100) { // Status Upgrade
      return statusUpgradeIcon;
    }
    return item.icon_url || '/placeholder.svg';
  };

  const modalHeader = (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </div>
      <div>
        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent font-black text-base sm:text-xl">
          {t('actions.inventory')}
        </span>
        <div className="h-0.5 w-12 sm:w-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-0.5" />
      </div>
    </div>
  );

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={onClose}
        title={modalHeader}
        className={isMobile ? "max-h-[90vh]" : "max-w-3xl max-h-[85vh]"}
      >
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'units' | 'items')} className="relative z-10">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-1 sm:p-1.5 rounded-xl border border-slate-600/50 shadow-lg">
            <TabsTrigger 
              value="units" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/50 font-bold transition-all duration-300 data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-200 text-sm"
            >
              {t('inventory.units')}
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 font-bold transition-all duration-300 data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-200 text-sm"
            >
              {t('inventory.items')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-3">
            {/* Unit count and actions */}
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} mb-3 p-2 sm:p-3 rounded-xl bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 border border-slate-600/50 shadow-lg`}>
              <div className="flex items-center gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
                  <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <span className="text-slate-300 font-bold text-xs sm:text-sm">
                    {t('inventory.limit', { current: trainerPokemon.length, max: MAX_UNITS })}
                  </span>
                  <div className="w-full h-1 bg-slate-700 rounded-full mt-0.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(trainerPokemon.length / MAX_UNITS) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {selectionMode ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelSelection}
                      className="text-slate-300 hover:text-white hover:bg-slate-700 transition-all h-8 px-2 sm:px-3"
                    >
                      <X className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">{t('inventory.cancel')}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDelete}
                      disabled={selectedIds.size === 0 || isDeleting}
                      className="gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 font-bold transition-all h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isMobile ? selectedIds.size : t('inventory.deleteSelected', { count: selectedIds.size })}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                    className="gap-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-500/50 shadow-lg font-bold transition-all h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('inventory.selectMultiple')}</span>
                    <span className="sm:hidden">Select</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Pokemon grid */}
            <ScrollArea className={isMobile ? "h-[45vh]" : "h-[400px]"}>
              {sortedPokemon.length === 0 ? (
                <div className="text-center py-12 sm:py-16 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl" />
                  <div className="relative z-10">
                    <div className="inline-block p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 shadow-xl mb-3 sm:mb-4">
                      <Package className="h-12 w-12 sm:h-16 sm:w-16 text-slate-500 animate-pulse" />
                    </div>
                    <p className="text-slate-300 font-bold text-base sm:text-lg">{t('inventory.noUnits')}</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">{t('inventory.getFromBanner')}</p>
                  </div>
                </div>
              ) : (
                <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-4 gap-3'} pr-2 sm:pr-4 p-1`}>
                  {sortedPokemon.map((pokemon) => {
                    const isInTeam = teamPokemonIds.includes(pokemon.id);
                    const isSelected = selectedIds.has(pokemon.id);
                    const typeColor = TYPE_COLORS[pokemon.pokemon_type as PokemonType];
                    const starColor = STAR_COLORS[pokemon.star_rating];

                    return (
                      <div
                        key={pokemon.id}
                        onClick={() => handlePokemonClick(pokemon)}
                        className={`
                          relative rounded-xl cursor-pointer transition-all duration-300 group p-2 sm:p-3
                          ${isSelected 
                            ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-slate-900 ring-red-500 shadow-lg shadow-red-500/50' 
                            : isInTeam
                            ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-slate-900 ring-amber-500 shadow-lg shadow-amber-500/40'
                            : 'border border-slate-600/50 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-700/50'}
                          hover:scale-105 transform
                        `}
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
                            : `linear-gradient(135deg, ${typeColor}25 0%, ${typeColor}10 100%)`
                        }}
                      >
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div 
                            className="absolute inset-0" 
                            style={{
                              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                              backgroundSize: '15px 15px'
                            }} 
                          />
                        </div>

                        {/* Shimmer effect for high rarity */}
                        {pokemon.star_rating >= 5 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        )}

                        {/* Team badge */}
                        {isInTeam && (
                          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-20">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 shadow-lg border-0">
                              {t('pokemon.inTeam')}
                            </Badge>
                          </div>
                        )}

                        {/* Selection checkbox */}
                        {selectionMode && !isInTeam && (
                          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20">
                            {isSelected ? (
                              <div className="bg-red-500 rounded-lg p-0.5 sm:p-1 shadow-lg">
                                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                            ) : (
                              <div className="bg-slate-700/80 rounded-lg p-0.5 sm:p-1 backdrop-blur-sm hover:bg-slate-600">
                                <Square className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stars - Top right corner */}
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                          {!selectionMode && (
                            <div className="flex gap-0.5 bg-slate-900/70 backdrop-blur-sm px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                              {Array.from({ length: Math.min(pokemon.star_rating, 3) }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-2 w-2 sm:h-3 sm:w-3 fill-current ${starColor} drop-shadow-lg`}
                                />
                              ))}
                              {pokemon.star_rating > 3 && (
                                <span className={`text-[8px] sm:text-[10px] font-bold ml-0.5 ${starColor} drop-shadow`}>
                                  +{pokemon.star_rating - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pokemon sprite with enhanced visuals */}
                        <div 
                          className="aspect-square rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 relative overflow-hidden mt-4 sm:mt-6"
                          style={{ backgroundColor: `${typeColor}15` }}
                        >
                          {/* Glow effect for rare pokemon */}
                          {pokemon.star_rating >= 4 && (
                            <div 
                              className="absolute inset-0 blur-xl opacity-30"
                              style={{ 
                                background: `radial-gradient(circle, ${typeColor}80 0%, transparent 70%)`
                              }}
                            />
                          )}
                          
                          {/* Shiny indicator */}
                          {pokemon.is_shiny && (
                            <div className="absolute top-0 right-0 z-20 bg-yellow-500/90 text-black text-[7px] sm:text-[8px] font-bold px-1 rounded-bl">
                              ✨ SHINY
                            </div>
                          )}
                          
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.is_shiny ? 'shiny/' : ''}${pokemon.pokemon_id}.png`}
                            alt={pokemon.pokemon_name}
                            className={`
                              relative z-10 object-contain transition-transform duration-300 pixelated
                              ${pokemon.star_rating >= 5 
                                ? isMobile ? 'w-14 h-14' : 'w-24 h-24 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                                : isMobile ? 'w-12 h-12' : 'w-20 h-20 drop-shadow-lg'}
                              group-hover:scale-110
                              ${pokemon.is_shiny ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
                            `}
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        {/* Name */}
                        <p className={`
                          text-[10px] sm:text-xs text-center font-bold truncate capitalize drop-shadow transition-colors duration-300
                          ${pokemon.star_rating >= 5 ? 'text-amber-300' : pokemon.star_rating >= 4 ? 'text-purple-300' : 'text-slate-200'}
                        `}>
                          {pokemon.pokemon_name}
                        </p>

                        {/* Level and Power */}
                        <div className="flex items-center justify-center gap-1 text-[8px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1">
                          <span className="font-semibold">Lv.{pokemon.level}</span>
                          <span className="text-slate-500">•</span>
                          <span className="font-semibold">
                            {(() => {
                              let dmg = calculatePokemonDamage(pokemon.power, pokemon.stat_damage as StatGrade, pokemon.level, pokemon.pokemon_type);
                              if (pokemon.is_shiny) dmg = Math.floor(dmg * 1.5);
                              return dmg;
                            })()} DMG
                          </span>
                        </div>

                        {/* Type badge */}
                        <div className="flex justify-center mt-1 sm:mt-2">
                          <span
                            className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-bold text-white shadow-lg border border-white/20"
                            style={{ 
                              backgroundColor: typeColor,
                              boxShadow: `0 2px 8px ${typeColor}70`
                            }}
                          >
                            {pokemon.pokemon_type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="items" className="mt-3">
            <ScrollArea className={isMobile ? "h-[50vh]" : "h-[440px]"}>
              {trainerItems.length === 0 ? (
                <div className="text-center py-12 sm:py-16 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl" />
                  <div className="relative z-10">
                    <div className="inline-block p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-600/30 shadow-xl mb-3 sm:mb-4">
                      <FlaskConical className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-slate-300 font-bold text-base sm:text-lg">{t('inventory.noItems')}</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">Complete battles to earn essences!</p>
                  </div>
                </div>
              ) : (
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} pr-2 sm:pr-4`}>
                  {trainerItems.map((userItem) => {
                    const isEssence = userItem.item.type === 'essence';
                    const isEssenceBox = userItem.item.id === ESSENCE_BOX_ITEM_ID;
                    const isBadge = userItem.item.type === 'badge';
                    
                    // Define colors based on item type
                    const getColors = () => {
                      if (isEssence) return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', glow: '#8b5cf6', badge: 'bg-purple-500/80', text: 'text-purple-400' };
                      if (isEssenceBox) return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', glow: '#3b82f6', badge: 'bg-blue-500/80', text: 'text-blue-400' };
                      if (isBadge) return { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', glow: '#ec4899', badge: 'bg-pink-500/80', text: 'text-pink-400' };
                      return { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', glow: '#eab308', badge: 'bg-amber-500/80', text: 'text-amber-400' };
                    };
                    const colors = getColors();

                    return (
                      <div
                        key={userItem.id}
                        onClick={() => isEssenceBox && handleOpenEssenceBox(userItem)}
                        className={`
                          relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] group overflow-hidden
                          ${isEssenceBox ? 'cursor-pointer hover:ring-2 hover:ring-blue-400/50' : 'cursor-default'}
                        `}
                        style={{
                          background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg.replace('0.15', '0.05')} 100%)`,
                          borderColor: colors.border
                        }}
                      >
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                            backgroundSize: '15px 15px'
                          }} />
                        </div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Item icon with glow */}
                        <div className="relative">
                          <div className="absolute inset-0 blur-xl opacity-40" style={{
                            background: `radial-gradient(circle, ${colors.glow}80 0%, transparent 70%)`
                          }} />
                          <img
                            src={getItemIcon(userItem.item)}
                            alt={userItem.item.name}
                            className={`w-10 h-10 sm:w-12 sm:h-12 object-contain relative z-10 transition-transform group-hover:scale-110 ${openingBoxId === userItem.id ? 'animate-spin' : ''}`}
                          />
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0 relative z-10">
                          <p className="text-slate-100 text-xs sm:text-sm font-bold truncate">
                            {userItem.item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                            <span className="text-slate-400 text-[10px] sm:text-xs">{t('inventory.quantity')}:</span>
                            <span className={`text-xs sm:text-sm font-bold ${colors.text}`}>
                              {userItem.quantity}
                            </span>
                          </div>
                          {/* Open button for essence box */}
                          {isEssenceBox && (
                            <div className="flex items-center gap-1 mt-1">
                              <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-400" />
                              <span className="text-blue-400 text-[9px] sm:text-[10px] font-semibold">
                                {t('inventory.tapToOpen')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quantity badge */}
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                          <div className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-lg text-white ${colors.badge}`}>
                            {userItem.quantity}x
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <style>{`
          .pixelated {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
        `}</style>
      </ResponsiveModal>

      {/* Pokemon Detail Modal */}
      <PokemonDetailModal
        isOpen={!!selectedPokemon}
        onClose={() => setSelectedPokemon(null)}
        pokemon={selectedPokemon}
      />
    </>
  );
};

export default TrainerInventoryModal;
