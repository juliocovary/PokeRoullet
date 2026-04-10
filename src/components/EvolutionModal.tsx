import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, ArrowRight, X, Gem } from 'lucide-react';
import { useEvolution } from '@/hooks/useEvolution';
import { UserItem } from '@/hooks/useInventory';
import { toast } from '@/hooks/use-toast';
import { canEvolve } from '@/data/evolutionData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import pokeballIcon from '@/assets/pokeball_icon.png';

interface PokemonInventoryItem {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  quantity: number;
  is_shiny?: boolean;
}

interface Region {
  id: string;
  nameKey: string;
}

const REGIONS: Region[] = [
  { id: 'all', nameKey: 'all' },
  { id: 'kanto', nameKey: 'kanto' },
  { id: 'johto', nameKey: 'johto' },
  { id: 'hoenn', nameKey: 'hoenn' },
  { id: 'sinnoh', nameKey: 'sinnoh' },
  { id: 'unova', nameKey: 'unova' },
];

const REGION_RANGES: Record<string, [number, number]> = {
  kanto: [1, 151],
  johto: [152, 251],
  hoenn: [252, 386],
  sinnoh: [387, 493],
  unova: [494, 649],
};

const getRarityBadgeClass = (rarity: string): string => {
  const rarityClasses: Record<string, string> = {
    common: 'bg-emerald-500/90 text-white border-emerald-600 shadow-emerald-500/30',
    uncommon: 'bg-sky-500/90 text-white border-sky-600 shadow-sky-500/30',
    rare: 'bg-violet-500/90 text-white border-violet-600 shadow-violet-500/30',
    pseudo: 'bg-orange-500/90 text-white border-orange-600 shadow-orange-500/30',
    starter: 'bg-amber-400/90 text-amber-950 border-amber-500 shadow-amber-500/30',
    legendary: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border-yellow-600 shadow-yellow-500/40',
    secret: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border-fuchsia-700 shadow-fuchsia-500/40',
  };
  return cn(
    'text-xs px-2 py-0.5 font-semibold border shadow-sm',
    rarityClasses[rarity.toLowerCase()] || 'bg-slate-500 text-white border-slate-600'
  );
};

const getRarityGradient = (rarity: string): string => {
  const gradients: Record<string, string> = {
    common: 'from-emerald-500/10 to-emerald-600/5',
    uncommon: 'from-sky-500/10 to-sky-600/5',
    rare: 'from-violet-500/10 to-violet-600/5',
    pseudo: 'from-orange-500/10 to-orange-600/5',
    starter: 'from-amber-400/10 to-amber-500/5',
    legendary: 'from-yellow-400/15 to-amber-500/10',
    secret: 'from-fuchsia-500/15 to-purple-600/10',
  };
  return gradients[rarity.toLowerCase()] || 'from-slate-500/10 to-slate-600/5';
};

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonInventory: PokemonInventoryItem[];
  userItems: UserItem[];
  refreshInventory: () => Promise<void>;
  refreshUserItems: () => Promise<void>;
  onEvolutionSuccess?: (result: {
    basePokemonId: number;
    basePokemonName: string;
    evolvedPokemonId: number;
    evolvedPokemonName: string;
    evolvedPokemonRarity: string;
  }) => void;
}

export const EvolutionModal = ({
  isOpen,
  onClose,
  pokemonInventory: initialPokemonInventory,
  userItems: initialUserItems,
  refreshInventory,
  refreshUserItems,
  onEvolutionSuccess,
}: EvolutionModalProps) => {
  const { t } = useTranslation('modals');
  const isMobile = useIsMobile();
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonInventoryItem | null>(null);
  const [selectedEvolution, setSelectedEvolution] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [evolvedPokemon, setEvolvedPokemon] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [pokemonInventory, setPokemonInventory] = useState(initialPokemonInventory);
  const [userItems, setUserItems] = useState(initialUserItems);

  useEffect(() => {
    setPokemonInventory(initialPokemonInventory);
    setUserItems(initialUserItems);
  }, [initialPokemonInventory, initialUserItems]);

  const { isEvolving, checkEvolutionRequirements, evolvePokemon, getEvolutionOptions } = useEvolution(
    pokemonInventory,
    userItems,
    refreshInventory,
    refreshUserItems
  );

  // Evolution only consumes non-shiny cards. Group by pokemon_id to avoid
  // duplicate rows/keys when inventory has split entries for the same species.
  const groupedBasePokemon = Array.from(
    pokemonInventory
      .filter(p => !p.is_shiny)
      .reduce((acc, pokemon) => {
        const existing = acc.get(pokemon.pokemon_id);
        if (existing) {
          existing.quantity += pokemon.quantity;
        } else {
          acc.set(pokemon.pokemon_id, { ...pokemon });
        }
        return acc;
      }, new Map<number, PokemonInventoryItem>())
      .values()
  );

  const evolvablePokemon = groupedBasePokemon.filter(p => {
    if (!canEvolve(p.pokemon_id)) return false;
    if (searchTerm && !p.pokemon_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedRegion === 'all') return true;
    const range = REGION_RANGES[selectedRegion];
    if (!range) return true;
    return p.pokemon_id >= range[0] && p.pokemon_id <= range[1];
  });

  const evolutionOptions = selectedPokemon ? getEvolutionOptions(selectedPokemon.pokemon_id) : [];

  const handleEvolve = async (evolution: any) => {
    if (!selectedPokemon) return;
    setIsAnimating(true);
    
    const success = await evolvePokemon(
      selectedPokemon.pokemon_id,
      selectedPokemon.pokemon_name,
      evolution
    );

    if (success) {
      const evolutionResult = {
        basePokemonId: selectedPokemon.pokemon_id,
        basePokemonName: selectedPokemon.pokemon_name,
        evolvedPokemonId: evolution.evolvesTo,
        evolvedPokemonName: evolution.evolvedName,
        evolvedPokemonRarity: evolution.evolvedRarity,
      };
      setEvolvedPokemon(evolution.evolvedName);
      setPokemonInventory(prevInventory => {
        const updatedInventory = [...prevInventory];
        const baseIndex = updatedInventory.findIndex(p => p.pokemon_id === selectedPokemon.pokemon_id);
        if (baseIndex !== -1) {
          const newQuantity = updatedInventory[baseIndex].quantity - evolution.requiredCards;
          if (newQuantity <= 0) {
            updatedInventory.splice(baseIndex, 1);
          } else {
            updatedInventory[baseIndex] = { ...updatedInventory[baseIndex], quantity: newQuantity };
          }
        }
        const evolvedIndex = updatedInventory.findIndex(p => p.pokemon_id === evolution.evolvesTo);
        if (evolvedIndex !== -1) {
          updatedInventory[evolvedIndex] = { ...updatedInventory[evolvedIndex], quantity: updatedInventory[evolvedIndex].quantity + 1 };
        } else {
          updatedInventory.push({ pokemon_id: evolution.evolvesTo, pokemon_name: evolution.evolvedName, rarity: evolution.evolvedRarity, quantity: 1 });
        }
        return updatedInventory;
      });
      
      if (evolution.requiredItem) {
        setUserItems(prevItems => {
          const updatedItems = [...prevItems];
          const itemIndex = updatedItems.findIndex(i => i.id === evolution.requiredItem.id);
          if (itemIndex !== -1) {
            const newQuantity = updatedItems[itemIndex].quantity - 1;
            if (newQuantity <= 0) {
              updatedItems.splice(itemIndex, 1);
            } else {
              updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQuantity };
            }
          }
          return updatedItems;
        });
      }
      
      // Refresh data via callbacks instead of page reload
      await Promise.all([refreshInventory(), refreshUserItems()]);
      setIsAnimating(false);
      handleClose();
      // Open the result after closing the evolution dialog to avoid modal stacking race conditions.
      setTimeout(() => onEvolutionSuccess?.(evolutionResult), 0);
    } else {
      setIsAnimating(false);
    }
  };

  const handleClose = () => {
    setSelectedPokemon(null);
    setSelectedEvolution(null);
    setShowSuccess(false);
    setEvolvedPokemon('');
    setSelectedRegion('all');
    setSearchTerm('');
    setPokemonInventory(initialPokemonInventory);
    setUserItems(initialUserItems);
    onClose();
  };

  const getRegionName = (region: Region) => {
    if (region.id === 'all') return t('evolution.all');
    return t(`evolution.regions.${region.id}`, region.id.charAt(0).toUpperCase() + region.id.slice(1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {isAnimating && (
        <DialogPortal>
          <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-500 rounded-3xl p-10 max-w-md mx-4 shadow-2xl overflow-hidden">
              {/* Particle effects */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>
              
              <div className="text-center space-y-6 relative z-10">
                <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse blur-2xl" />
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedPokemon?.pokemon_id}.png`} 
                    alt={selectedPokemon?.pokemon_name} 
                    className="w-full h-full object-contain animate-bounce brightness-150 drop-shadow-[0_0_50px_rgba(255,255,255,0.9)]" 
                  />
                  <Sparkles className="absolute top-0 right-0 w-10 h-10 text-yellow-300 animate-spin" />
                  <Sparkles className="absolute bottom-0 left-0 w-10 h-10 text-yellow-300 animate-spin" style={{ animationDirection: 'reverse' }} />
                  <Sparkles className="absolute top-1/2 left-0 w-8 h-8 text-white animate-pulse" />
                  <Sparkles className="absolute top-1/2 right-0 w-8 h-8 text-white animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-white animate-pulse drop-shadow-lg tracking-wide">{t('evolution.evolving')}</p>
                  <p className="text-xl text-white/90 font-medium">{selectedPokemon?.pokemon_name}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogPortal>
      )}

      <DialogContent className="max-w-full sm:max-w-7xl h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        {/* Thematic Header */}
        <DialogHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-4 sm:p-5 border-b-4 border-purple-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 drop-shadow-md">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              {isMobile ? t('evolution.titleMobile') : t('evolution.title')}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {showSuccess && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-3xl font-bold text-primary">{t('evolution.evolutionComplete')}</h2>
            <p className="text-lg">{selectedPokemon?.pokemon_name} {t('evolution.evolved')} <span className="font-bold text-primary">{evolvedPokemon}</span>!</p>
            <Button onClick={handleClose} size="lg">{t('evolution.close')}</Button>
          </div>
        )}

        {!showSuccess && !isAnimating && (
          <div className="flex flex-col sm:flex-row gap-0 overflow-hidden flex-1">
            {/* Left Panel - Pokemon List */}
            <div className={cn("flex flex-col border-b sm:border-r sm:border-b-0 bg-muted/10", isMobile ? "w-full" : "w-80")}>
              <div className="p-3 sm:p-4 border-b bg-gradient-to-b from-muted/40 to-muted/20 space-y-3">
                <div>
                  <input 
                    type="text" 
                    placeholder={t('evolution.search')} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border-2 border-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t('evolution.filterRegion')}</p>
                  <ScrollArea className="w-full">
                    <div className="flex sm:flex-wrap gap-1.5 pb-2">
                      {REGIONS.map(region => (
                        <button 
                          key={region.id} 
                          onClick={() => setSelectedRegion(region.id)} 
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                            selectedRegion === region.id 
                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30" 
                              : "bg-background hover:bg-muted text-muted-foreground border border-muted-foreground/20 hover:border-primary/50"
                          )}
                        >
                          {getRegionName(region)}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <ScrollArea className={cn("p-3", isMobile ? "max-h-64" : "flex-1")}>
                <div className="space-y-2">
                  {evolvablePokemon.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">{t('evolution.noPokemonEvolvable')}</p>
                      {selectedRegion !== 'all' && <p className="text-xs mt-1 opacity-70">{t('evolution.inThisRegion')}</p>}
                    </div>
                  ) : (
                    evolvablePokemon.map((pokemon, index) => {
                      const evolutionOpts = getEvolutionOptions(pokemon.pokemon_id);
                      const canEvolveNow = evolutionOpts.some(evo => checkEvolutionRequirements(pokemon.pokemon_id, evo).canEvolve);
                      return (
                        <div 
                          key={`${pokemon.pokemon_id}-${pokemon.rarity}-${index}`} 
                          onClick={() => { setSelectedPokemon(pokemon); setSelectedEvolution(null); }} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2",
                            `bg-gradient-to-r ${getRarityGradient(pokemon.rarity)}`,
                            selectedPokemon?.pokemon_id === pokemon.pokemon_id 
                              ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/40" 
                              : "border-transparent hover:border-muted-foreground/30 hover:shadow-md",
                            canEvolveNow && selectedPokemon?.pokemon_id !== pokemon.pokemon_id && "ring-1 ring-yellow-400/40"
                          )}
                        >
                          {/* Pokemon Image */}
                          <div className="relative flex-shrink-0">
                            <div className={cn(
                              "w-16 h-16 rounded-xl flex items-center justify-center",
                              "bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-sm"
                            )}>
                              <img 
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`} 
                                alt={pokemon.pokemon_name} 
                                className="w-14 h-14 drop-shadow-md" 
                              />
                            </div>
                            {canEvolveNow && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                                <Sparkles className="w-3 h-3 text-yellow-900" />
                              </div>
                            )}
                          </div>
                          
                          {/* Pokemon Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{pokemon.pokemon_name}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge className={getRarityBadgeClass(pokemon.rarity)}>
                                {t(`rarities.${pokemon.rarity}`, pokemon.rarity)}
                              </Badge>
                              <Badge className="bg-slate-700/90 text-white font-bold text-xs px-2 py-0.5 border border-slate-500 shadow-md">
                                x{pokemon.quantity}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Evolve Indicator */}
                          {canEvolveNow && (
                            <div className="flex-shrink-0">
                              <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Evolution Details */}
            <ScrollArea className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-background to-muted/20">
              {!selectedPokemon ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 opacity-40" />
                    </div>
                    <p className="text-xl font-semibold">{t('evolution.selectPokemon')}</p>
                    <p className="text-sm mt-1 opacity-70">{t('evolution.toSeeOptions')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Current Pokemon */}
                    <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-muted-foreground/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('evolution.currentPokemon')}</h3>
                      <div className="relative">
                        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedPokemon.pokemon_id}.png`} 
                            alt={selectedPokemon.pokemon_name} 
                            className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-lg" 
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{selectedPokemon.pokemon_name}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <Badge className={getRarityBadgeClass(selectedPokemon.rarity)}>
                            {t(`rarities.${selectedPokemon.rarity}`, selectedPokemon.rarity)}
                          </Badge>
                          <Badge className="bg-slate-700/90 text-white font-bold border border-slate-500">
                            x{selectedPokemon.quantity}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center items-center py-4 lg:py-0">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>

                    {/* Evolution Options */}
                    <div className="flex flex-col space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center lg:text-left">{t('evolution.evolveTo')}</h3>
                      <div className="space-y-3">
                        {evolutionOptions.map((evolution) => {
                          const requirements = checkEvolutionRequirements(selectedPokemon.pokemon_id, evolution);
                          const hasEnoughCards = selectedPokemon.quantity >= evolution.requiredCards;
                          const progressPercent = Math.min((selectedPokemon.quantity / evolution.requiredCards) * 100, 100);
                          const hasItem = !evolution.requiredItem || userItems.some(i => i.id === evolution.requiredItem?.id && i.quantity >= 1);
                          
                          return (
                            <div 
                              key={evolution.evolvesTo} 
                              className={cn(
                                "relative cursor-pointer transition-all rounded-2xl overflow-hidden",
                                requirements.canEvolve && "hover:scale-[1.02]"
                              )} 
                              onClick={() => { if (requirements.canEvolve) setSelectedEvolution(evolution); }}
                            >
                              <div className={cn(
                                "border-3 rounded-2xl p-4 transition-all",
                                requirements.canEvolve 
                                  ? "border-yellow-400 bg-gradient-to-br from-yellow-500/15 to-orange-500/10 shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-400/30" 
                                  : "border-muted-foreground/20 bg-muted/30 opacity-70"
                              )}>
                                <div className="flex items-center gap-4">
                                  {/* Evolution Image */}
                                  <div className={cn(
                                    "relative w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0",
                                    requirements.canEvolve 
                                      ? "bg-gradient-to-br from-yellow-400/20 to-orange-400/10" 
                                      : "bg-muted/50"
                                  )}>
                                    <img 
                                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolution.evolvesTo}.png`} 
                                      alt={evolution.evolvedName} 
                                      className={cn(
                                        "w-16 h-16 object-contain",
                                        requirements.canEvolve && "drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                      )} 
                                    />
                                    {requirements.canEvolve && (
                                      <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
                                    )}
                                  </div>
                                  
                                  {/* Evolution Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base">{evolution.evolvedName}</h4>
                                    <Badge className={cn(getRarityBadgeClass(evolution.evolvedRarity), "mt-1")}>
                                      {t(`rarities.${evolution.evolvedRarity}`, evolution.evolvedRarity)}
                                    </Badge>
                                    
                                    {/* Requirements with progress */}
                                    <div className="mt-3 space-y-2">
                                      {/* Cards requirement */}
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <img src={pokeballIcon} alt="" className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className="truncate">{selectedPokemon.pokemon_name}</span>
                                            <span className={cn(
                                              "font-bold ml-2",
                                              hasEnoughCards ? "text-emerald-500" : "text-red-500"
                                            )}>
                                              {selectedPokemon.quantity}/{evolution.requiredCards}
                                            </span>
                                          </div>
                                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                              className={cn(
                                                "h-full rounded-full transition-all",
                                                hasEnoughCards 
                                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                                                  : "bg-gradient-to-r from-red-400 to-red-500"
                                              )}
                                              style={{ width: `${progressPercent}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Item requirement */}
                                      {evolution.requiredItem && (
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Gem className="w-4 h-4 text-violet-400" />
                                          </div>
                                          <span className="text-xs flex-1">1x {evolution.requiredItem.name}</span>
                                          <span className={cn(
                                            "text-xs font-bold",
                                            hasItem ? "text-emerald-500" : "text-red-500"
                                          )}>
                                            {hasItem ? "✓" : "✗"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {!requirements.canEvolve && (
                                      <p className="text-xs text-destructive mt-2 font-medium">{requirements.missingMessage}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedEvolution && (
                    <div className="flex justify-center pt-6 border-t border-muted-foreground/10">
                      <Button 
                        onClick={() => handleEvolve(selectedEvolution)} 
                        disabled={isEvolving} 
                        size="lg" 
                        className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 text-amber-950 font-bold px-8 shadow-lg shadow-amber-500/30"
                      >
                        {isEvolving ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('evolution.evolving')}</>
                        ) : (
                          <><Sparkles className="mr-2 h-5 w-5" />{t('evolution.confirmEvolution')}</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
