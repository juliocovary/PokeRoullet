import { useEffect, useState } from 'react';
import { X, Package, Gem, Search, Play, Gift, Star, Clock, BoxSelect } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PokemonCard } from '@/components/PokemonCard';
import { PokemonInventoryItem } from '@/hooks/usePokemon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { useBooster } from '@/hooks/useBooster';
import { MysteryBoxModal } from '@/components/MysteryBoxModal';
import { LegendarySpinModal } from '@/components/LegendarySpinModal';
import { PackOpeningAnimation } from '@/components/PackOpeningAnimation';
import { useCardPacks, type PackCard } from '@/hooks/useCardPacks';
import { toast } from 'sonner';

export interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  icon_url: string;
  quantity: number;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonInventory: PokemonInventoryItem[];
  itemInventory: Item[];
  onRefresh?: () => void;
}

const rarityOrder = {
  secret: 0,
  legendary: 1,
  pseudo: 2,
  starter: 3,
  rare: 4,
  uncommon: 5,
  common: 6
};

const rarityColors = {
  legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
  pseudo: 'bg-gradient-to-r from-orange-400 to-orange-500',
  starter: 'bg-gradient-to-r from-yellow-300 to-yellow-400',
  rare: 'bg-gradient-to-r from-purple-400 to-purple-500',
  uncommon: 'bg-gradient-to-r from-blue-400 to-blue-500',
  common: 'bg-gradient-to-r from-green-400 to-green-500',
  secret: 'bg-gradient-to-r from-violet-500 to-violet-600'
};

export const InventoryModal = ({ 
  isOpen, 
  onClose, 
  pokemonInventory, 
  itemInventory,
  onRefresh
}: InventoryModalProps) => {
  const { t } = useTranslation(['modals']);
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [mysteryBoxOpen, setMysteryBoxOpen] = useState(false);
  const [mysteryBoxCount, setMysteryBoxCount] = useState(1);
  const [legendarySpinOpen, setLegendarySpinOpen] = useState(false);
  const [packOpening, setPackOpening] = useState<{ cards: PackCard[]; packName: string; packTypeId: string } | null>(null);

  const packArtworkByTypeId: Record<string, string> = {
    brasa_comum: '/packs/brasacomum.png',
    aurora_incomum: '/packs/uncommonaurora.png',
    prisma_raro: '/packs/rareprism.png',
    eclipse_epico: '/packs/epiceclipse.png',
    reliquia_lendaria: '/packs/legendaryrelic.png',
    secreto_ruina: '/packs/secretancient.png',
  };

  const packArtwork: Record<string, string> = {
    brasa_comum: '/packs/brasacomum.png',
    aurora_incomum: '/packs/uncommonaurora.png',
    prisma_raro: '/packs/rareprism.png',
    eclipse_epico: '/packs/epiceclipse.png',
    reliquia_lendaria: '/packs/legendaryrelic.png',
    secreto_ruina: '/packs/secretancient.png',
  };

  const { getUserPacksWithTypes, openCardPack, refresh: refreshPacks } = useCardPacks();

  useEffect(() => {
    if (!isOpen) return;

    void refreshPacks().catch((error) => {
      console.error('Failed to refresh packs when inventory opens:', error);
    });
  }, [isOpen, refreshPacks]);
  
  const {
    isLuckBoostActive,
    isShinyBoostActive,
    luckBoostTimeRemaining,
    shinyBoostTimeRemaining,
    activateLuckBoost,
    activateShinyBoost,
    openMysteryBox,
    useLegendarySpin,
    loading: boosterLoading
  } = useBooster();

  // Filter and sort Pokemon
  const filteredPokemon = pokemonInventory
    .filter(pokemon => {
      const matchesSearch = pokemon.pokemon_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = selectedRarity === 'all' || pokemon.rarity === selectedRarity;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      const rarityA = rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 999;
      const rarityB = rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 999;
      return rarityA - rarityB;
    });

  const uniqueRarities = Array.from(new Set(pokemonInventory.map(p => p.rarity)));

  // Filter out upgrades and essence-related items from collector mode inventory (show badges)
  const displayableItems = itemInventory.filter(item => 
    item.type !== 'upgrade' && 
    item.type !== 'essence' && 
    item.type !== 'trainer_upgrade'
  );

  const handleUseBooster = async (itemId: number) => {
    if (itemId === 50) {
      await activateLuckBoost();
    } else if (itemId === 51) {
      await activateShinyBoost();
    }
    if (onRefresh) onRefresh();
  };

  const handleMysteryBoxComplete = () => {
    if (onRefresh) onRefresh();
  };

  const handleLegendarySpinComplete = () => {
    if (onRefresh) onRefresh();
  };

  const getItemAction = (item: Item) => {
    // Legendary Spin - id 53 or 32 (both are legendary spin items)
    if (item.type === 'legendary_spin' || item.id === 32 || item.id === 53) {
      return (
        <Button
          size="sm"
          onClick={() => {
            console.log('Opening legendary spin modal for item:', item.id, item.name);
            setLegendarySpinOpen(true);
          }}
          disabled={boosterLoading}
          className="mt-2 h-7 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          <Star className="w-3 h-3 mr-1" />
          {t('modals:boosters.use', { defaultValue: 'Usar' })}
        </Button>
      );
    }
    
    // Booster items - Use button (excluding legendary spin items)
    if (item.type === 'booster' && item.id !== 32) {
      const isActive = (item.id === 50 && isLuckBoostActive) || (item.id === 51 && isShinyBoostActive);
      const timeRemaining = item.id === 50 ? luckBoostTimeRemaining : shinyBoostTimeRemaining;
      
      if (isActive) {
        return (
          <div className="mt-2">
            <Badge className="bg-green-500 text-white text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining}
            </Badge>
          </div>
        );
      }
      
      return (
        <Button
          size="sm"
          onClick={() => handleUseBooster(item.id)}
          disabled={boosterLoading}
          className="mt-2 h-7 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Play className="w-3 h-3 mr-1" />
          {t('modals:boosters.use', { defaultValue: 'Usar' })}
        </Button>
      );
    }
    
    // Mystery Box - Open button (show "Open 3" if quantity >= 3)
    if (item.type === 'mystery_box') {
      const canOpen3 = item.quantity >= 3;
      return (
        <Button
          size="sm"
          onClick={() => {
            setMysteryBoxCount(canOpen3 ? 3 : 1);
            setMysteryBoxOpen(true);
          }}
          disabled={boosterLoading}
          className="mt-2 h-7 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Gift className="w-3 h-3 mr-1" />
          {canOpen3 
            ? `${t('modals:boosters.open', { defaultValue: 'Abrir' })} 3`
            : t('modals:boosters.open', { defaultValue: 'Abrir' })}
        </Button>
      );
    }
    
    return null;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full sm:max-w-5xl w-full h-[95vh] sm:h-[90vh] p-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 [&>button]:hidden overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white/80 backdrop-blur-sm shrink-0 relative z-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h2 className="text-xl sm:text-3xl font-bold text-primary">{t('modals:inventory.title')}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Tabs - Scrollable */}
          <Tabs defaultValue="cards" className="flex-1 flex flex-col overflow-hidden relative">
            <TabsList className="grid w-full sm:w-fit grid-cols-3 mx-3 sm:mx-6 mt-3 sm:mt-6 mb-3 sm:mb-4 h-12 shrink-0 relative z-10 bg-muted">
              <TabsTrigger value="cards" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('modals:inventory.cards')} ({pokemonInventory.length})
              </TabsTrigger>
              <TabsTrigger value="packs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <BoxSelect className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('modals:packs.tabTitle')} ({getUserPacksWithTypes().reduce((sum, p) => sum + p.quantity, 0)})
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Gem className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('modals:inventory.items')} ({displayableItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Cards Tab */}
            <TabsContent value="cards" className="flex-1 flex flex-col overflow-hidden m-0 px-3 sm:px-6">
              {/* Search and Filter - Fixed */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('modals:inventory.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-9"
                  />
                </div>
                <ScrollArea className="w-full sm:w-auto shrink-0" type="auto">
                  <div className="flex gap-2 pb-2 sm:pb-0">
                    <Button
                      variant={selectedRarity === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRarity('all')}
                      className="whitespace-nowrap h-10 shrink-0"
                    >
                      {t('modals:inventory.all')}
                    </Button>
                    {uniqueRarities.map(rarity => (
                      <Button
                        key={rarity}
                        variant={selectedRarity === rarity ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRarity(rarity)}
                        className={`whitespace-nowrap h-10 shrink-0 ${selectedRarity === rarity ? rarityColors[rarity as keyof typeof rarityColors] : ''}`}
                      >
                        {rarity}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Pokemon Grid - Scrollable */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  {filteredPokemon.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl sm:text-6xl mb-4">📭</div>
                      <p className="text-base sm:text-lg text-muted-foreground">{t('modals:inventory.noPokemonFound')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pb-3">
                      {filteredPokemon.map((pokemon) => (
                        <div key={`${pokemon.pokemon_id}-${pokemon.is_shiny}`} className="card-hover">
                          <PokemonCard 
                            pokemon={{
                              id: pokemon.pokemon_id,
                              name: pokemon.pokemon_name,
                              sprite: pokemon.is_shiny 
                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
                                : pokemon.sprite,
                              rarity: pokemon.rarity as any
                            }}
                            quantity={pokemon.quantity}
                            isShiny={pokemon.is_shiny}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Packs Tab */}
            <TabsContent value="packs" className="m-0 h-full absolute inset-0 top-16 sm:top-20 data-[state=inactive]:hidden">
              <div className="h-full px-3 sm:px-6 pt-4 pb-6 overflow-y-auto">
                {getUserPacksWithTypes().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl sm:text-6xl mb-4">📦</div>
                    <p className="text-base sm:text-lg text-muted-foreground">{t('modals:packs.noPacks')}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">{t('modals:packs.noPacksHint')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {getUserPacksWithTypes().map((pack) => {
                      const packArtwork: Record<string, string> = {
                        brasa_comum: '/packs/brasacomum.png',
                        aurora_incomum: '/packs/uncommonaurora.png',
                        prisma_raro: '/packs/rareprism.png',
                        eclipse_epico: '/packs/epiceclipse.png',
                        reliquia_lendaria: '/packs/legendaryrelic.png',
                      };
                      const packColors: Record<string, string> = {
                        brasa_comum: 'from-orange-400 to-red-500',
                        aurora_incomum: 'from-blue-400 to-cyan-500',
                        prisma_raro: 'from-purple-400 to-violet-500',
                        eclipse_epico: 'from-amber-400 to-orange-500',
                        reliquia_lendaria: 'from-yellow-300 to-amber-500',
                        secreto_ruina: 'from-violet-500 to-fuchsia-600',
                      };
                      const artwork = pack.pack_type.icon_url || packArtworkByTypeId[pack.pack_type_id] || packArtwork[pack.pack_type_id];
                      const color = packColors[pack.pack_type_id] || 'from-slate-400 to-slate-500';
                      const displayPackName = t(`modals:packs.${pack.pack_type_id}`, { defaultValue: pack.pack_type.name });

                      return (
                        <div key={pack.id} className="card-pokemon p-3 sm:p-4 text-center card-hover bg-gradient-to-br from-slate-50 to-slate-100">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 mx-auto mb-2 flex items-center justify-center">
                            {artwork ? (
                              <img src={artwork} alt={displayPackName} className="w-full h-full object-contain drop-shadow-lg" />
                            ) : (
                              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                                <span className="text-2xl sm:text-3xl">✨</span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm mb-1 line-clamp-2">{displayPackName}</h3>
                          <Badge variant="secondary" className="mb-1 text-xs">x{pack.quantity}</Badge>
                          <p className="text-[10px] text-muted-foreground mb-1">{pack.pack_type.card_count} {t('modals:packs.cards')}</p>
                          <Button
                            size="sm"
                            className={`mt-2 h-7 text-xs bg-gradient-to-r ${color} hover:opacity-90 text-white font-bold`}
                            onClick={async () => {
                              const result = await openCardPack(pack.pack_type_id);
                              if (result.success && result.cards) {
                                setPackOpening({ cards: result.cards, packName: displayPackName, packTypeId: pack.pack_type_id });
                              } else {
                                toast.error(
                                  result.message || t('modals:packs.openError', { defaultValue: 'Unable to open this pack.' })
                                );
                              }
                            }}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            {t('modals:packs.open')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Items Tab - Rebuilt from scratch */}
            <TabsContent value="items" className="m-0 h-full absolute inset-0 top-16 sm:top-20 data-[state=inactive]:hidden">
              <div className="h-full px-3 sm:px-6 pt-4 pb-6 overflow-y-auto">
                {displayableItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl sm:text-6xl mb-4">💎</div>
                    <p className="text-base sm:text-lg text-muted-foreground">{t('modals:inventory.noItems')}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">{t('modals:inventory.visitShop')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {displayableItems.map((item) => {
                      // Get translated description for known items
                      const getItemDescription = () => {
                        if (item.id === 32 || item.id === 53 || item.type === 'legendary_spin') {
                          return t('modals:boosters.legendarySpinDesc');
                        }
                        if (item.id === 52 || item.type === 'mystery_box') {
                          return t('modals:boosters.mysteryBoxDesc');
                        }
                        if (item.id === 50) {
                          return t('modals:boosters.luckPotionDesc');
                        }
                        if (item.id === 51) {
                          return t('modals:boosters.shinyPotionDesc');
                        }
                        return item.description;
                      };

                      // Get translated name for known items
                      const getItemName = () => {
                        if (item.id === 32 || item.id === 53 || item.type === 'legendary_spin') {
                          return t('modals:boosters.legendarySpin');
                        }
                        if (item.id === 52 || item.type === 'mystery_box') {
                          return t('modals:boosters.mysteryBox');
                        }
                        if (item.id === 50) {
                          return t('modals:boosters.luckPotion');
                        }
                        if (item.id === 51) {
                          return t('modals:boosters.shinyPotion');
                        }
                        return item.name;
                      };

                      return (
                        <div 
                          key={item.id} 
                          className="card-pokemon p-3 sm:p-4 text-center card-hover bg-gradient-to-br from-purple-50 to-blue-50"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 flex items-center justify-center">
                            {item.icon_url && item.icon_url.startsWith('http') ? (
                              <img src={item.icon_url} alt={getItemName()} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-3xl sm:text-4xl">{item.icon_url || '📦'}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm mb-1 line-clamp-1">{getItemName()}</h3>
                          <Badge variant="secondary" className="mb-2 text-xs">
                            x{item.quantity}
                          </Badge>
                          <p className="text-xs text-muted-foreground line-clamp-2">{getItemDescription()}</p>
                          {getItemAction(item)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MysteryBoxModal
        isOpen={mysteryBoxOpen}
        onClose={() => setMysteryBoxOpen(false)}
        onOpen={openMysteryBox}
        onComplete={handleMysteryBoxComplete}
        openCount={mysteryBoxCount}
      />

      <LegendarySpinModal
        isOpen={legendarySpinOpen}
        onClose={() => setLegendarySpinOpen(false)}
        onSpin={useLegendarySpin}
        onComplete={handleLegendarySpinComplete}
      />

      {packOpening && (
        <PackOpeningAnimation
          isOpen={true}
          onClose={() => {
            setPackOpening(null);
            // Run refreshes after close so any async/runtime error does not block modal dismissal.
            void Promise.resolve()
              .then(async () => {
                await refreshPacks();
                onRefresh?.();
              })
              .catch((error) => {
                console.error('Failed to refresh after pack opening close:', error);
              });
          }}
          cards={packOpening.cards}
          packName={packOpening.packName}
          packTypeId={packOpening.packTypeId}
        />
      )}
    </>
  );
};
