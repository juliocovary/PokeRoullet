import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { PokedexCard } from './PokedexCard';
import { usePokedex } from '@/hooks/usePokedex';
import { usePokemon } from '@/hooks/usePokemon';
import { Skeleton } from '@/components/ui/skeleton';
import pokedexIcon from '@/assets/pokedex-icon.png';
interface PokedexModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const CARDS_PER_PAGE = 15;
const SECTIONS = [{
  id: 'kanto',
  name: 'Kanto',
  range: [1, 150],
  rewards: [
    { milestone: 50, coins: 100, xp: 500, shards: 25 },
    { milestone: 100, coins: 250, xp: 1000, shards: 50 },
    { milestone: 150, coins: 500, xp: 2500, shards: 100 }
  ]
}, {
  id: 'secretos',
  name: 'Secretos',
  range: [151, 493],
  rewards: [
    { milestone: 1, coins: 200, xp: 1000, shards: 50 },
    { milestone: 2, coins: 400, xp: 2000, shards: 100 },
    { milestone: 3, coins: 1000, xp: 5000, shards: 250 }
  ]
}];
export const PokedexModal = ({
  isOpen,
  onClose
}: PokedexModalProps) => {
  const {
    GEN1_POKEMON
  } = usePokemon();
  const {
    loading,
    placePokemonInPokedex,
    getOwnedQuantity,
    isPlacedInPokedex,
    getPokedexCompletionRate,
    refreshPokedex
  } = usePokedex();
  const [selectedSection, setSelectedSection] = useState(() => {
    return localStorage.getItem('pokedex_selected_section') || 'kanto';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('pokedex_current_page');
    // Clean up after reading
    localStorage.removeItem('pokedex_current_page');
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [showRewards, setShowRewards] = useState(false);
  const currentSection = SECTIONS.find(s => s.id === selectedSection);

  // Get Pokemon for current section in correct order
  const sectionPokemon = selectedSection === 'kanto' 
    ? GEN1_POKEMON.filter(p => p.id >= 1 && p.id <= 150).sort((a, b) => a.id - b.id)
    : selectedSection === 'secretos' 
    ? GEN1_POKEMON.filter(p => p.id === 151 || p.id === 251 || p.id === 493).sort((a, b) => a.id - b.id)
    : [];
  
  // Calculate pagination with consistent 15 cards per page
  const totalPages = Math.ceil(sectionPokemon.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const currentPagePokemon = sectionPokemon.slice(startIndex, startIndex + CARDS_PER_PAGE);
  
  // Debug log to verify pagination
  console.log(`Page ${currentPage}: showing ${currentPagePokemon.length} cards (IDs: ${currentPagePokemon.map(p => p.id).join(', ')})`);
  const completionRate = getPokedexCompletionRate();
  const handlePlaceCard = async (pokemonId: number, pokemonName: string) => {
    const success = await placePokemonInPokedex(pokemonId, pokemonName);
    if (success) {
      // Store current state to restore after reload
      localStorage.setItem('pokedex_selected_section', selectedSection);
      localStorage.setItem('pokedex_current_page', currentPage.toString());
      localStorage.setItem('pokedex_should_reopen', 'true');

      // Refresh the page to update inventory counts
      window.location.reload();
    }
  };
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  if (loading) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Pokédex - Carregando...</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 p-4">
            {Array.from({
            length: 16
          }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] bg-gradient-to-br from-red-600 via-red-500 to-red-700 border-8 border-red-800 shadow-[0_0_60px_rgba(220,38,38,0.6)] !fixed !left-1/2 !top-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 rounded-3xl overflow-hidden flex flex-col">
        {/* Decorative Top Bar - Pokedex Style */}
        <div className="absolute -top-2 left-4 right-4 h-16 bg-gradient-to-b from-red-700 to-red-600 rounded-t-2xl border-4 border-red-800 flex items-center justify-between px-6">
          {/* Left Blue Circle - Iconic Pokedex Element */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-300 via-cyan-400 to-cyan-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(34,211,238,0.8),inset_0_4px_8px_rgba(255,255,255,0.6)]">
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/80 rounded-full blur-sm"></div>
            </div>
          </div>
          
          {/* Right Indicator Lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 shadow-inner"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-inner"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-green-600 shadow-inner animate-pulse"></div>
          </div>
        </div>

        <DialogHeader className="pb-4 pt-16 px-6 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-2xl font-bold">
            <span className="flex items-center gap-3 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <img src={pokedexIcon} alt="Pokédex" className="w-8 h-8 drop-shadow-lg" />
              POKÉDEX NACIONAL
            </span>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end bg-black/40 px-4 py-2 rounded-lg border-2 border-white/20">
                <span className="text-xs text-cyan-300 font-semibold tracking-wider">PROGRESSO</span>
                <div className="flex flex-col items-end gap-1.5 mt-1">
                  <Badge variant="outline" className="bg-emerald-400/90 border-2 border-white text-black font-bold px-3 py-1 text-sm shadow-lg">
                    {completionRate.placed}/{completionRate.total} ({completionRate.percentage}%)
                  </Badge>
                  <div className="w-32 bg-black/60 rounded-full h-2 border border-white/40">
                    <div className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{
                    width: `${completionRate.percentage}%`
                  }} />
                  </div>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar px-6 pb-6">
          {/* Section Selector - Screen Style */}
          <div className="flex items-center justify-between gap-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 rounded-xl border-4 border-gray-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-cyan-300 tracking-wider uppercase">REGIÃO:</label>
              <Select value={selectedSection} onValueChange={value => {
              setSelectedSection(value);
              setCurrentPage(1);
              setShowRewards(false);
            }}>
                <SelectTrigger className="w-56 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-cyan-400/50 hover:border-cyan-400 transition-all text-white font-semibold shadow-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-2 border-cyan-400/50">
                  {SECTIONS.map(section => <SelectItem key={section.id} value={section.id} className="hover:bg-cyan-400/20 text-white font-medium">
                      {section.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setShowRewards(!showRewards)}
              className={`bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-500 border-4 border-yellow-700 text-black font-bold px-6 py-2 shadow-[0_4px_12px_rgba(234,179,8,0.6)] hover:shadow-[0_0_20px_rgba(234,179,8,0.8)] transition-all duration-200 hover:scale-105 ${showRewards ? 'ring-4 ring-yellow-300' : ''}`}
            >
              <Gift className="h-5 w-5 mr-2" />
              RECOMPENSAS
            </Button>
          </div>

          {/* Rewards Section */}
          {showRewards && (
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 rounded-2xl border-4 border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <h3 className="text-xl font-bold text-yellow-300 mb-4 text-center tracking-wider drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                RECOMPENSAS DE {currentSection?.name.toUpperCase()}
              </h3>
              <div className="space-y-3">
                {currentSection?.rewards.map((reward, index) => {
                  const sectionPokedexCount = GEN1_POKEMON.filter(p => {
                    if (selectedSection === 'kanto') return p.id >= 1 && p.id <= 150;
                    if (selectedSection === 'secretos') return p.id === 151 || p.id === 251 || p.id === 493;
                    return false;
                  }).filter(p => isPlacedInPokedex(p.id)).length;
                  
                  const isCompleted = sectionPokedexCount >= reward.milestone;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl border-4 transition-all ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                          : 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${isCompleted ? 'bg-green-500' : 'bg-gray-500'} text-white font-bold px-3 py-1 text-sm`}>
                          {reward.milestone} POKÉMON
                        </Badge>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-yellow-400/90 border-2 border-yellow-600 text-black font-bold">
                            {reward.coins} 💰
                          </Badge>
                          <Badge variant="outline" className="bg-blue-400/90 border-2 border-blue-600 text-black font-bold">
                            {reward.xp} XP
                          </Badge>
                          <Badge variant="outline" className="bg-purple-400/90 border-2 border-purple-600 text-white font-bold">
                            {reward.shards} 💎
                          </Badge>
                        </div>
                      </div>
                      {isCompleted ? (
                        <Badge className="bg-green-500 text-white font-bold px-4 py-2">
                          ✓ COMPLETO
                        </Badge>
                      ) : (
                        <span className="text-gray-400 font-semibold">
                          {sectionPokedexCount}/{reward.milestone}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pokemon Grid - Screen Style */}
          <div className="relative">
            <div className="grid grid-cols-5 gap-3 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 rounded-2xl border-4 border-gray-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
              {currentPagePokemon.map(pokemon => <PokedexCard key={pokemon.id} pokemonId={pokemon.id} isPlaced={isPlacedInPokedex(pokemon.id)} ownedQuantity={getOwnedQuantity(pokemon.id)} onPlaceCard={handlePlaceCard} />)}
            </div>

            {/* Navigation Buttons - D-Pad Style */}
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToPage(currentPage - 1)}
                className="absolute left-0 top-[45%] transform -translate-y-1/2 z-20 w-14 h-14 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-600 hover:border-cyan-400 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-7 w-7 text-cyan-300" />
              </Button>
            )}
            
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToPage(currentPage + 1)}
                className="absolute right-0 top-[45%] transform -translate-y-1/2 z-20 w-14 h-14 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-600 hover:border-cyan-400 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-7 w-7 text-cyan-300" />
              </Button>
            )}
          </div>
          
          {/* Page Info - Digital Display Style */}
          <div className="text-center text-base bg-gradient-to-r from-gray-800 via-black to-gray-800 rounded-xl p-4 border-4 border-gray-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="font-bold text-cyan-300 tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">PÁGINA {currentPage} / {totalPages}</span>
            <span className="ml-6 text-emerald-300 font-semibold tracking-wide drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">• {currentPagePokemon.length} POKÉMON</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};