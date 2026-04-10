import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Store, Tag, ShoppingCart, Package, X, ChevronLeft, ChevronRight, Sparkles, Loader2, Clock, Backpack, BoxSelect, Gift } from 'lucide-react';
import { useMarketplace, MarketplaceListing } from '@/hooks/useMarketplace';
import { useItemMarketplace, ItemMarketplaceListing } from '@/hooks/useItemMarketplace';
import { usePackMarketplace, PackMarketplaceListing } from '@/hooks/usePackMarketplace';
import { usePokemon } from '@/hooks/usePokemon';
import { useProfile } from '@/hooks/useProfile';
import { useInventory } from '@/hooks/useInventory';
import { useCardPacks } from '@/hooks/useCardPacks';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import pokecoinIcon from '@/assets/pokecoin.png';
import statusUpgradeIcon from '@/assets/status-upgrade.png';
import { STATUS_UPGRADE_ITEM_ID } from '@/data/essenceConfig';

// Fallback URL for Status Upgrade if import fails
const STATUS_UPGRADE_FALLBACK_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pp-up.png';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InventoryPokemon {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  quantity: number;
  is_shiny: boolean;
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  pseudo: 'bg-purple-500',
  legendary: 'bg-yellow-500',
  secret: 'bg-pink-500'
};

const packArtworkByTypeId: Record<string, string> = {
  brasa_comum: '/packs/brasacomum.png',
  aurora_incomum: '/packs/uncommonaurora.png',
  prisma_raro: '/packs/rareprism.png',
  eclipse_epico: '/packs/epiceclipse.png',
  reliquia_lendaria: '/packs/legendaryrelic.png',
  secreto_ruina: '/packs/secretancient.png',
};

export const MarketplaceModal = ({ isOpen, onClose }: MarketplaceModalProps) => {
  const { t } = useTranslation('modals');
  const isMobile = useIsMobile();
  const { loading, myListings, activeListingsCount, maxListings, loadListings, loadMyListings, createListing, buyListing, cancelListing } = useMarketplace();
  const { 
    loading: itemLoading, myItemListings, activeItemListingsCount, maxItemListings,
    loadItemListings, loadMyItemListings, createItemListing, buyItemListing, cancelItemListing 
  } = useItemMarketplace();
  const {
    loading: packLoading,
    myPackListings,
    activePackListingsCount,
    maxPackListings,
    loadPackListings,
    loadMyPackListings,
    createPackListing,
    buyPackListing,
    cancelPackListing,
  } = usePackMarketplace();
  const { getUserPacksWithTypes, refresh: refreshUserPacks } = useCardPacks();
  const { inventory: userInventory, refreshInventory } = usePokemon();
  const { userItems, refreshUserItems } = useInventory();
  const { profile, loadProfile } = useProfile();

  // Main tab state
  const [mainTab, setMainTab] = useState('pokemon');

  // Browse tab state
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [browseLoading, setBrowseLoading] = useState(false);

  // Sell tab state
  const [selectedPokemon, setSelectedPokemon] = useState<InventoryPokemon | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellSearchQuery, setSellSearchQuery] = useState('');

  // Item browse state
  const [itemListings, setItemListings] = useState<ItemMarketplaceListing[]>([]);
  const [itemCurrentPage, setItemCurrentPage] = useState(1);
  const [itemTotalPages, setItemTotalPages] = useState(1);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [itemBrowseLoading, setItemBrowseLoading] = useState(false);

  // Item sell state
  const [selectedItem, setSelectedItem] = useState<{ id: number; name: string; icon_url: string; type: string; quantity: number } | null>(null);
  const [itemSellPrice, setItemSellPrice] = useState('');
  const [itemSellQuantity, setItemSellQuantity] = useState('1');
  const [itemSellSearch, setItemSellSearch] = useState('');

  // Pack browse/sell state
  const [packListings, setPackListings] = useState<PackMarketplaceListing[]>([]);
  const [packCurrentPage, setPackCurrentPage] = useState(1);
  const [packTotalPages, setPackTotalPages] = useState(1);
  const [packSearchQuery, setPackSearchQuery] = useState('');
  const [packBrowseLoading, setPackBrowseLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<{ pack_type_id: string; name: string; icon_url: string | null; quantity: number } | null>(null);
  const [packSellPrice, setPackSellPrice] = useState('');
  const [packSellQuantity, setPackSellQuantity] = useState('1');
  const [packSellSearch, setPackSellSearch] = useState('');

  const fetchListings = useCallback(async () => {
    setBrowseLoading(true);
    const result = await loadListings(currentPage, 12, {
      rarity: rarityFilter,
      search: searchQuery
    });
    setListings(result.listings);
    setTotalPages(result.totalPages || 1);
    setBrowseLoading(false);
  }, [loadListings, currentPage, rarityFilter, searchQuery]);

  const fetchItemListings = useCallback(async () => {
    setItemBrowseLoading(true);
    const result = await loadItemListings(itemCurrentPage, 12, {
      itemType: itemTypeFilter === 'all' ? undefined : itemTypeFilter,
      search: itemSearchQuery
    });
    setItemListings(result.listings);
    setItemTotalPages(result.totalPages || 1);
    setItemBrowseLoading(false);
  }, [loadItemListings, itemCurrentPage, itemTypeFilter, itemSearchQuery]);

  const fetchPackListings = useCallback(async () => {
    setPackBrowseLoading(true);
    const result = await loadPackListings(packCurrentPage, 12, {
      search: packSearchQuery,
    });
    setPackListings(result.listings);
    setPackTotalPages(result.totalPages || 1);
    setPackBrowseLoading(false);
  }, [loadPackListings, packCurrentPage, packSearchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchListings();
      fetchItemListings();
      fetchPackListings();
      refreshInventory();
      refreshUserItems();
      refreshUserPacks();
      loadMyListings();
      loadMyItemListings();
      loadMyPackListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rarityFilter]);

  useEffect(() => {
    if (isOpen) fetchItemListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCurrentPage, itemTypeFilter]);

  useEffect(() => {
    if (isOpen) fetchPackListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packCurrentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchListings();
  };

  const handleItemSearch = () => {
    setItemCurrentPage(1);
    fetchItemListings();
  };

  const handlePackSearch = () => {
    setPackCurrentPage(1);
    fetchPackListings();
  };

  const handleBuy = async (listing: MarketplaceListing) => {
    const success = await buyListing(listing.id);
    if (success) {
      fetchListings();
      loadProfile();
    }
  };

  const handleBuyItem = async (listing: ItemMarketplaceListing) => {
    const success = await buyItemListing(listing.id);
    if (success) {
      fetchItemListings();
      loadProfile();
      refreshUserItems();
    }
  };

  const handleBuyPack = async (listing: PackMarketplaceListing) => {
    const success = await buyPackListing(listing.id);
    if (success) {
      fetchPackListings();
      loadProfile();
      refreshUserPacks();
    }
  };

  const handleCreateListing = async () => {
    if (!selectedPokemon || !sellPrice) return;
    const price = parseInt(sellPrice);
    if (isNaN(price) || price < 1 || price > 9999) return;
    const success = await createListing(selectedPokemon.pokemon_id, price, selectedPokemon.is_shiny);
    if (success) {
      setSelectedPokemon(null);
      setSellPrice('');
      refreshInventory();
      loadProfile();
    }
  };

  const handleCreateItemListing = async () => {
    if (!selectedItem || !itemSellPrice || !itemSellQuantity) return;
    const price = parseInt(itemSellPrice);
    const qty = parseInt(itemSellQuantity);
    if (isNaN(price) || price < 1 || price > 99999) return;
    if (isNaN(qty) || qty < 1 || qty > selectedItem.quantity) return;
    const success = await createItemListing(selectedItem.id, qty, price);
    if (success) {
      setSelectedItem(null);
      setItemSellPrice('');
      setItemSellQuantity('1');
      refreshUserItems();
      loadProfile();
    }
  };

  const handleCreatePackListing = async () => {
    if (!selectedPack || !packSellPrice || !packSellQuantity) return;
    const price = parseInt(packSellPrice);
    const qty = parseInt(packSellQuantity);
    if (isNaN(price) || price < 1 || price > 99999) return;
    if (isNaN(qty) || qty < 1 || qty > selectedPack.quantity) return;

    const success = await createPackListing(selectedPack.pack_type_id, qty, price);
    if (success) {
      setSelectedPack(null);
      setPackSellPrice('');
      setPackSellQuantity('1');
      refreshUserPacks();
      loadProfile();
    }
  };

  const handleCancelListing = async (listingId: string) => {
    const success = await cancelListing(listingId);
    if (success) refreshInventory();
  };

  const handleCancelItemListing = async (listingId: string) => {
    const success = await cancelItemListing(listingId);
    if (success) refreshUserItems();
  };

  const handleCancelPackListing = async (listingId: string) => {
    const success = await cancelPackListing(listingId);
    if (success) refreshUserPacks();
  };

  const getPokemonSprite = (pokemonId: number, isShiny: boolean = false) => {
    const baseUrl = isShiny
      ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny'
      : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
    return `${baseUrl}/${pokemonId}.png`;
  };

  const filteredInventory = userInventory.filter(pokemon => {
    if (sellSearchQuery) return pokemon.pokemon_name.toLowerCase().includes(sellSearchQuery.toLowerCase());
    return true;
  });

  const filteredUserItems = userItems.filter(item => {
    // Exclude permanent upgrades from being sellable
    if (item.type === 'upgrade') return false;
    if (itemSellSearch) return item.name.toLowerCase().includes(itemSellSearch.toLowerCase());
    return true;
  });

  const filteredUserPacks = getUserPacksWithTypes()
    .filter((pack) => pack.quantity > 0)
    .filter((pack) => {
      const displayName = t(`packs.${pack.pack_type_id}`, { defaultValue: pack.pack_type.name });
      if (packSellSearch) {
        return displayName.toLowerCase().includes(packSellSearch.toLowerCase());
      }
      return true;
    });

  const formatExpiresAt = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return '<1h';
  };

  // Helper to get correct icon for items, especially Status Upgrade
  const getItemIcon = (itemId: number, fallbackUrl: string | null = null): string => {
    if (itemId === STATUS_UPGRADE_ITEM_ID || itemId === 100) {
      // Use local import for Status Upgrade, fallback to external URL if needed
      const icon = statusUpgradeIcon && statusUpgradeIcon !== '' ? statusUpgradeIcon : STATUS_UPGRADE_FALLBACK_URL;
      console.log('[getItemIcon] Status Upgrade icon:', { itemId, statusUpgradeIcon, icon });
      return icon;
    }
    return fallbackUrl || '';
  };

  const renderListingCard = (listing: MarketplaceListing, showBuyButton: boolean = true, showCancelButton: boolean = false) => (
    <div
      key={listing.id}
      className={`relative bg-card/50 border rounded-lg p-3 flex flex-col items-center ${
        listing.is_shiny ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/10 to-orange-500/10' : 'border-border'
      }`}
    >
      {listing.is_shiny && (
        <Badge className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Shiny
        </Badge>
      )}
      <img src={getPokemonSprite(listing.pokemon_id, listing.is_shiny)} alt={listing.pokemon_name} className="w-16 h-16 object-contain" />
      <p className="text-sm font-medium capitalize mt-1">{listing.pokemon_name}</p>
      <Badge className={`${rarityColors[listing.rarity]} text-white text-xs mt-1`}>
        {t(`rarities.${listing.rarity}`, listing.rarity)}
      </Badge>
      <div className="flex items-center gap-1 mt-2">
        <img src={pokecoinIcon} alt="Pokecoin" className="w-4 h-4" />
        <span className="font-bold text-primary">{listing.price}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">{listing.seller_nickname}</p>
      {listing.expires_at && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatExpiresAt(listing.expires_at)}</span>
        </div>
      )}
      {showBuyButton && (
        <Button size="sm" className="mt-2 w-full" onClick={() => handleBuy(listing)} disabled={loading || (profile?.pokecoins || 0) < listing.price}>
          <ShoppingCart className="w-3 h-3 mr-1" />
          {t('marketplace.buy')}
        </Button>
      )}
      {showCancelButton && (
        <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => handleCancelListing(listing.id)} disabled={loading}>
          <X className="w-3 h-3 mr-1" />
          {t('marketplace.cancel')}
        </Button>
      )}
    </div>
  );

  const renderItemListingCard = (listing: ItemMarketplaceListing, showBuyButton: boolean = true, showCancelButton: boolean = false) => {
    const itemIcon = getItemIcon(listing.item_id, listing.item_icon_url);
    
    return (
    <div key={listing.id} className="relative bg-card/50 border border-border rounded-lg p-3 flex flex-col items-center">
      {itemIcon ? (
        <img src={itemIcon} alt={listing.item_name} className="w-14 h-14 object-contain" />
      ) : (
        <div className="w-14 h-14 flex items-center justify-center bg-muted rounded-lg">
          <Backpack className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium mt-1 text-center">{listing.item_name}</p>
      <Badge variant="outline" className="text-xs mt-1">x{listing.quantity}</Badge>
      <div className="flex items-center gap-1 mt-2">
        <img src={pokecoinIcon} alt="Pokecoin" className="w-4 h-4" />
        <span className="font-bold text-primary">{listing.price}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">{listing.seller_nickname}</p>
      {listing.expires_at && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatExpiresAt(listing.expires_at)}</span>
        </div>
      )}
      {showBuyButton && (
        <Button size="sm" className="mt-2 w-full" onClick={() => handleBuyItem(listing)} disabled={itemLoading || (profile?.pokecoins || 0) < listing.price}>
          <ShoppingCart className="w-3 h-3 mr-1" />
          {t('marketplace.buy')}
        </Button>
      )}
      {showCancelButton && (
        <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => handleCancelItemListing(listing.id)} disabled={itemLoading}>
          <X className="w-3 h-3 mr-1" />
          {t('marketplace.cancel')}
        </Button>
      )}
    </div>
    );
  };

  const renderPackListingCard = (listing: PackMarketplaceListing, showBuyButton: boolean = true, showCancelButton: boolean = false) => {
    const artwork = listing.pack_icon_url || packArtworkByTypeId[listing.pack_type_id] || '/packs/brasacomum.png';
    const displayName = t(`packs.${listing.pack_type_id}`, { defaultValue: listing.pack_name });

    return (
      <div key={listing.id} className="relative bg-card/50 border border-border rounded-lg p-3 flex flex-col items-center">
        <img src={artwork} alt={displayName} className="w-14 h-20 object-contain" />
        <p className="text-sm font-medium mt-1 text-center line-clamp-2">{displayName}</p>
        <Badge variant="outline" className="text-xs mt-1">x{listing.quantity}</Badge>
        <div className="flex items-center gap-1 mt-2">
          <img src={pokecoinIcon} alt="Pokecoin" className="w-4 h-4" />
          <span className="font-bold text-primary">{listing.price}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">{listing.seller_nickname}</p>
        {listing.expires_at && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatExpiresAt(listing.expires_at)}</span>
          </div>
        )}
        {showBuyButton && (
          <Button size="sm" className="mt-2 w-full" onClick={() => handleBuyPack(listing)} disabled={packLoading || (profile?.pokecoins || 0) < listing.price}>
            <ShoppingCart className="w-3 h-3 mr-1" />
            {t('marketplace.buy')}
          </Button>
        )}
        {showCancelButton && (
          <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => handleCancelPackListing(listing.id)} disabled={packLoading}>
            <X className="w-3 h-3 mr-1" />
            {t('marketplace.cancel')}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="relative">
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-0 top-0 p-1 h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
          )}
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="w-6 h-6 text-primary" />
            {t('marketplace.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Main category tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="pokemon" className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Pokémon
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-1">
              <Backpack className="w-4 h-4" />
              Itens
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center gap-1">
              <BoxSelect className="w-4 h-4" />
              Packs
            </TabsTrigger>
          </TabsList>

          {/* ========== POKEMON SECTION ========== */}
          <TabsContent value="pokemon" className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="browse" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browse" className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.browse')}</span>
                </TabsTrigger>
                <TabsTrigger value="sell" className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.sell')}</span>
                </TabsTrigger>
                <TabsTrigger value="my-listings" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.myListings')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Browse Pokémon */}
              <TabsContent value="browse" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="flex-1 flex gap-2">
                    <Input placeholder={t('marketplace.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="flex-1" />
                    <Button onClick={handleSearch} size="icon"><Search className="w-4 h-4" /></Button>
                  </div>
                  <Select value={rarityFilter} onValueChange={(v) => { setRarityFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('marketplace.filterByRarity')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('marketplace.allRarities')}</SelectItem>
                      <SelectItem value="common">{t('rarities.common', 'Common')}</SelectItem>
                      <SelectItem value="uncommon">{t('rarities.uncommon', 'Uncommon')}</SelectItem>
                      <SelectItem value="rare">{t('rarities.rare', 'Rare')}</SelectItem>
                      <SelectItem value="pseudo">{t('rarities.pseudo', 'Pseudo')}</SelectItem>
                      <SelectItem value="legendary">{t('rarities.legendary', 'Legendary')}</SelectItem>
                      <SelectItem value="secret">{t('rarities.secret', 'Secret')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {browseLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : listings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noListings')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {listings.map((listing) => renderListingCard(listing, true, false))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm">{t('marketplace.page')} {currentPage} {t('marketplace.of')} {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                )}
              </TabsContent>

              {/* Sell Pokémon */}
              <TabsContent value="sell" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <Input placeholder={t('marketplace.searchYourCards')} value={sellSearchQuery} onChange={(e) => setSellSearchQuery(e.target.value)} className="flex-1" />
                  <Badge variant={activeListingsCount >= maxListings ? "destructive" : "secondary"} className="whitespace-nowrap">
                    {activeListingsCount}/{maxListings} {t('marketplace.activeListings', { defaultValue: 'ofertas' })}
                  </Badge>
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                  <ScrollArea className="h-[250px] w-full md:flex-[2]">
                    <div className="pr-4">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-1">
                        {filteredInventory.map((pokemon, index) => (
                          <div
                            key={`${pokemon.pokemon_id}-${pokemon.is_shiny}-${index}`}
                            onClick={() => setSelectedPokemon(pokemon)}
                            className={`relative cursor-pointer bg-card/50 border rounded-lg p-2 flex flex-col items-center transition-all hover:scale-105 ${
                              selectedPokemon?.pokemon_id === pokemon.pokemon_id && selectedPokemon?.is_shiny === pokemon.is_shiny
                                ? 'border-primary ring-2 ring-primary'
                                : pokemon.is_shiny ? 'border-yellow-400' : 'border-border'
                            }`}
                          >
                            {pokemon.is_shiny && <Sparkles className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />}
                            <Badge className="absolute top-1 left-1 text-xs px-1">x{pokemon.quantity}</Badge>
                            <img src={getPokemonSprite(pokemon.pokemon_id, pokemon.is_shiny)} alt={pokemon.pokemon_name} className="w-12 h-12 object-contain" />
                            <p className="text-xs capitalize truncate w-full text-center">{pokemon.pokemon_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                  {selectedPokemon && (
                    <div className="md:flex-1 bg-card/50 border rounded-lg p-4 flex flex-col items-center">
                      <h3 className="font-bold mb-2">{t('marketplace.createListing')}</h3>
                      <img src={getPokemonSprite(selectedPokemon.pokemon_id, selectedPokemon.is_shiny)} alt={selectedPokemon.pokemon_name} className="w-24 h-24 object-contain" />
                      <p className="font-medium capitalize">{selectedPokemon.pokemon_name}</p>
                      {selectedPokemon.is_shiny && <Badge className="bg-yellow-500 text-black mt-1"><Sparkles className="w-3 h-3 mr-1" />Shiny</Badge>}
                      <Badge className={`${rarityColors[selectedPokemon.rarity]} text-white mt-1`}>{t(`rarities.${selectedPokemon.rarity}`, selectedPokemon.rarity)}</Badge>
                      <div className="w-full mt-4">
                        <label className="text-sm text-muted-foreground mb-1 block">{t('marketplace.setPrice')} (1-9999)</label>
                        <div className="flex items-center gap-2">
                          <img src={pokecoinIcon} alt="Pokecoin" className="w-5 h-5" />
                          <Input type="number" min="1" max="9999" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0" className="flex-1" />
                        </div>
                      </div>
                      <Button className="w-full mt-4" onClick={handleCreateListing} disabled={loading || !sellPrice || parseInt(sellPrice) < 1 || parseInt(sellPrice) > 9999 || activeListingsCount >= maxListings}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                        {activeListingsCount >= maxListings ? t('marketplace.maxListingsReached', { defaultValue: 'Limite de ofertas atingido' }) : t('marketplace.createListing')}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* My Pokémon Listings */}
              <TabsContent value="my-listings" className="flex-1 flex flex-col overflow-hidden mt-4">
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {myListings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noMyListings')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {myListings.map((listing) => renderListingCard(listing, false, true))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ========== ITEMS SECTION ========== */}
          <TabsContent value="items" className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="browse-items" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browse-items" className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.browse')}</span>
                </TabsTrigger>
                <TabsTrigger value="sell-items" className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.sell')}</span>
                </TabsTrigger>
                <TabsTrigger value="my-item-listings" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.myListings')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Browse Items */}
              <TabsContent value="browse-items" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="flex-1 flex gap-2">
                    <Input placeholder={t('marketplace.searchItem')} value={itemSearchQuery} onChange={(e) => setItemSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleItemSearch()} className="flex-1" />
                    <Button onClick={handleItemSearch} size="icon"><Search className="w-4 h-4" /></Button>
                  </div>
                  <Select value={itemTypeFilter} onValueChange={(v) => { setItemTypeFilter(v); setItemCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="badge">Insígnias</SelectItem>
                      <SelectItem value="consumable">Consumíveis</SelectItem>
                      <SelectItem value="booster">Boosters</SelectItem>
                      <SelectItem value="upgrade">Upgrades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {itemBrowseLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : itemListings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Backpack className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noListings')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {itemListings.map((listing) => renderItemListingCard(listing, true, false))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {itemTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setItemCurrentPage(p => Math.max(1, p - 1))} disabled={itemCurrentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm">{t('marketplace.page')} {itemCurrentPage} {t('marketplace.of')} {itemTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setItemCurrentPage(p => Math.min(itemTotalPages, p + 1))} disabled={itemCurrentPage === itemTotalPages}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                )}
              </TabsContent>

              {/* Sell Items */}
              <TabsContent value="sell-items" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <Input placeholder={t('marketplace.searchYourItems')} value={itemSellSearch} onChange={(e) => setItemSellSearch(e.target.value)} className="flex-1" />
                  <Badge variant={activeItemListingsCount >= maxItemListings ? "destructive" : "secondary"} className="whitespace-nowrap">
                    {activeItemListingsCount}/{maxItemListings} {t('marketplace.activeListings')}
                  </Badge>
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                  <ScrollArea className="h-[250px] w-full md:flex-[2]">
                    <div className="pr-4">
                      {filteredUserItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Backpack className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>{t('marketplace.noItemsToSell')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-1">
                          {filteredUserItems.map((item) => {
                            const itemIconDisplay = getItemIcon(item.id, item.icon_url);
                            return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedItem({ id: item.id, name: item.name, icon_url: item.icon_url, type: item.type, quantity: item.quantity })}
                              className={`relative cursor-pointer bg-card/50 border rounded-lg p-2 flex flex-col items-center transition-all hover:scale-105 ${
                                selectedItem?.id === item.id ? 'border-primary ring-2 ring-primary' : 'border-border'
                              }`}
                            >
                              <Badge className="absolute top-1 left-1 text-xs px-1">x{item.quantity}</Badge>
                              {itemIconDisplay ? (
                                <img src={itemIconDisplay} alt={item.name} className="w-12 h-12 object-contain" />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center"><Backpack className="w-6 h-6 text-muted-foreground" /></div>
                              )}
                              <p className="text-xs truncate w-full text-center mt-1">{item.name}</p>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  {selectedItem && (
                    <div className="md:flex-1 bg-card/50 border rounded-lg p-4 flex flex-col items-center">
                      <h3 className="font-bold mb-2">{t('marketplace.createOffer')}</h3>
                      {(() => {
                        const selectedIcon = getItemIcon(selectedItem.id, selectedItem.icon_url);
                        return selectedIcon ? (
                          <img src={selectedIcon} alt={selectedItem.name} className="w-20 h-20 object-contain" />
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-lg"><Backpack className="w-10 h-10 text-muted-foreground" /></div>
                        );
                      })()}
                      <p className="font-medium mt-1">{selectedItem.name}</p>
                      <p className="text-xs text-muted-foreground">{t('marketplace.available', { count: selectedItem.quantity })}</p>

                      <div className="w-full mt-3">
                        <label className="text-sm text-muted-foreground mb-1 block">{t('marketplace.quantity')}</label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedItem.quantity}
                          value={itemSellQuantity}
                          onChange={(e) => setItemSellQuantity(e.target.value)}
                          placeholder="1"
                        />
                      </div>

                      <div className="w-full mt-3">
                        <label className="text-sm text-muted-foreground mb-1 block">{t('marketplace.totalPrice')}</label>
                        <div className="flex items-center gap-2">
                          <img src={pokecoinIcon} alt="Pokecoin" className="w-5 h-5" />
                          <Input
                            type="number"
                            min="1"
                            max="99999"
                            value={itemSellPrice}
                            onChange={(e) => setItemSellPrice(e.target.value)}
                            placeholder="0"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full mt-4"
                        onClick={handleCreateItemListing}
                        disabled={
                          itemLoading || !itemSellPrice || !itemSellQuantity ||
                          parseInt(itemSellPrice) < 1 || parseInt(itemSellPrice) > 99999 ||
                          parseInt(itemSellQuantity) < 1 || parseInt(itemSellQuantity) > selectedItem.quantity ||
                          activeItemListingsCount >= maxItemListings
                        }
                      >
                        {itemLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                        {activeItemListingsCount >= maxItemListings ? t('marketplace.maxListingsReached') : t('marketplace.createOffer')}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* My Item Listings */}
              <TabsContent value="my-item-listings" className="flex-1 flex flex-col overflow-hidden mt-4">
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {myItemListings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noItemListings')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {myItemListings.map((listing) => renderItemListingCard(listing, false, true))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ========== PACKS SECTION ========== */}
          <TabsContent value="packs" className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="browse-packs" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browse-packs" className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.browse')}</span>
                </TabsTrigger>
                <TabsTrigger value="sell-packs" className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.sell')}</span>
                </TabsTrigger>
                <TabsTrigger value="my-pack-listings" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('marketplace.myListings')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Browse Packs */}
              <TabsContent value="browse-packs" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder={t('marketplace.searchPack', { defaultValue: 'Search pack...' })}
                    value={packSearchQuery}
                    onChange={(e) => setPackSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePackSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handlePackSearch} size="icon"><Search className="w-4 h-4" /></Button>
                </div>

                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {packBrowseLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : packListings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BoxSelect className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noListings')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {packListings.map((listing) => renderPackListingCard(listing, true, false))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {packTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setPackCurrentPage(p => Math.max(1, p - 1))} disabled={packCurrentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm">{t('marketplace.page')} {packCurrentPage} {t('marketplace.of')} {packTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPackCurrentPage(p => Math.min(packTotalPages, p + 1))} disabled={packCurrentPage === packTotalPages}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                )}
              </TabsContent>

              {/* Sell Packs */}
              <TabsContent value="sell-packs" className="flex-1 flex flex-col overflow-hidden mt-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <Input
                    placeholder={t('marketplace.searchYourPacks', { defaultValue: 'Search your packs...' })}
                    value={packSellSearch}
                    onChange={(e) => setPackSellSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Badge variant={activePackListingsCount >= maxPackListings ? 'destructive' : 'secondary'} className="whitespace-nowrap">
                    {activePackListingsCount}/{maxPackListings} {t('marketplace.activeListings')}
                  </Badge>
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                  <ScrollArea className="h-[250px] w-full md:flex-[2]">
                    <div className="pr-4">
                      {filteredUserPacks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <BoxSelect className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>{t('marketplace.noPacksToSell', { defaultValue: 'You do not have packs to sell.' })}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-1">
                          {filteredUserPacks.map((pack) => {
                            const artwork = pack.pack_type.icon_url || packArtworkByTypeId[pack.pack_type_id] || '/packs/brasacomum.png';
                            const displayName = t(`packs.${pack.pack_type_id}`, { defaultValue: pack.pack_type.name });

                            return (
                              <div
                                key={pack.id}
                                onClick={() => setSelectedPack({ pack_type_id: pack.pack_type_id, name: displayName, icon_url: pack.pack_type.icon_url, quantity: pack.quantity })}
                                className={`relative cursor-pointer bg-card/50 border rounded-lg p-2 flex flex-col items-center transition-all hover:scale-105 ${
                                  selectedPack?.pack_type_id === pack.pack_type_id ? 'border-primary ring-2 ring-primary' : 'border-border'
                                }`}
                              >
                                <Badge className="absolute top-1 left-1 text-xs px-1">x{pack.quantity}</Badge>
                                <img src={artwork} alt={displayName} className="w-10 h-14 object-contain" />
                                <p className="text-[10px] truncate w-full text-center mt-1">{displayName}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {selectedPack && (
                    <div className="md:flex-1 bg-card/50 border rounded-lg p-4 flex flex-col items-center">
                      <h3 className="font-bold mb-2">{t('marketplace.createOffer')}</h3>
                      <img
                        src={selectedPack.icon_url || packArtworkByTypeId[selectedPack.pack_type_id] || '/packs/brasacomum.png'}
                        alt={selectedPack.name}
                        className="w-16 h-24 object-contain"
                      />
                      <p className="font-medium mt-1 text-center">{selectedPack.name}</p>
                      <p className="text-xs text-muted-foreground">{t('marketplace.available', { count: selectedPack.quantity })}</p>

                      <div className="w-full mt-3">
                        <label className="text-sm text-muted-foreground mb-1 block">{t('marketplace.quantity')}</label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedPack.quantity}
                          value={packSellQuantity}
                          onChange={(e) => setPackSellQuantity(e.target.value)}
                          placeholder="1"
                        />
                      </div>

                      <div className="w-full mt-3">
                        <label className="text-sm text-muted-foreground mb-1 block">{t('marketplace.totalPrice')}</label>
                        <div className="flex items-center gap-2">
                          <img src={pokecoinIcon} alt="Pokecoin" className="w-5 h-5" />
                          <Input
                            type="number"
                            min="1"
                            max="99999"
                            value={packSellPrice}
                            onChange={(e) => setPackSellPrice(e.target.value)}
                            placeholder="0"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full mt-4"
                        onClick={handleCreatePackListing}
                        disabled={
                          packLoading || !packSellPrice || !packSellQuantity ||
                          parseInt(packSellPrice) < 1 || parseInt(packSellPrice) > 99999 ||
                          parseInt(packSellQuantity) < 1 || parseInt(packSellQuantity) > selectedPack.quantity ||
                          activePackListingsCount >= maxPackListings
                        }
                      >
                        {packLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                        {activePackListingsCount >= maxPackListings ? t('marketplace.maxListingsReached') : t('marketplace.createOffer')}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* My Pack Listings */}
              <TabsContent value="my-pack-listings" className="flex-1 flex flex-col overflow-hidden mt-4">
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4">
                    {myPackListings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('marketplace.noPackListings', { defaultValue: 'You have no active pack listings.' })}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                        {myPackListings.map((listing) => renderPackListingCard(listing, false, true))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
