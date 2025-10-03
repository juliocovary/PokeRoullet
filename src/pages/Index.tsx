import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { RouletteWheel } from '@/components/RouletteWheel';
import { PokemonCard } from '@/components/PokemonCard';
import { ResultModal } from '@/components/ResultModal';
import { StarterSelectionModal } from '@/components/StarterSelectionModal';
import { InventoryModal } from '@/components/InventoryModal';
import { ShopModal } from '@/components/ShopModal';
import { SellModal } from '@/components/SellModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePokemon, Pokemon } from '@/hooks/usePokemon';
import { useInventory } from '@/hooks/useInventory';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { useMissions } from '@/hooks/useMissions';
import { AchievementsModal } from '@/components/AchievementsModal';
import { PokedexModal } from '@/components/PokedexModal';
import pokeball from '@/assets/pokeball.png';
import inventarioIcon from '@/assets/inventario.png';
import lojaIcon from '@/assets/loja_de_itens.png';
import pokedexIcon from '@/assets/pokedex.png';
import evoluirIcon from '@/assets/evoluir_1.png';
import pokecoinIcon from '@/assets/pokecoin.png';
const Index = () => {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    inventory,
    profile,
    spins,
    spinRoulette,
    selectStarter,
    sellPokemon,
    loading: pokemonLoading
  } = usePokemon();
  const {
    profile: userProfile
  } = useProfile();
  const {
    shopItems,
    userItems,
    buyItem
  } = useInventory();
  const {
    resetMissions
  } = useMissions();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showStarterSelection, setShowStarterSelection] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);

  useEffect(() => {
    // Check if we should reopen the Pokedex after a page reload
    const shouldReopen = localStorage.getItem('pokedex_should_reopen');
    if (shouldReopen === 'true') {
      localStorage.removeItem('pokedex_should_reopen');
      setShowPokedex(true);
    }
  }, []);
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Verificar se deve mostrar seleção de inicial
  useEffect(() => {
    if (!pokemonLoading && profile && !profile.starter_pokemon) {
      setShowStarterSelection(true);
    }
  }, [profile, pokemonLoading]);

  // Remover verificação periódica - agora é global
  // Os resets acontecem automaticamente a cada 2 horas

  // Handle roulette spin
  const handleSpin = async () => {
    if (!spins || spins.free_spins <= 0) {
      toast({
        title: 'Sem giros!',
        description: 'Você não tem giros gratuitos disponíveis.',
        variant: 'destructive'
      });
      return;
    }
    setIsSpinning(true);

    // Simulate spin duration
    setTimeout(async () => {
      const caughtPokemon = await spinRoulette();
      if (caughtPokemon) {
        setSelectedPokemon(caughtPokemon);
        setShowResult(true);
      }
      setIsSpinning(false);
    }, 1500);
  };

  // Handle starter selection
  const handleStarterSelection = async (starter: Pokemon) => {
    const success = await selectStarter(starter);
    if (success) {
      setShowStarterSelection(false);
    } else {
      throw new Error('Falha ao selecionar starter');
    }
  };
  if (authLoading || pokemonLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <img src={pokeball} alt="Pokebola" className="w-16 h-16 mx-auto mb-4 animate-spin" style={{
          animationDuration: '2s'
        }} />
          <p className="text-lg">Carregando...</p>
          <p className="text-muted-foreground">Preparando sua aventura Pokémon!</p>
        </div>
      </div>;
  }
  if (!user) return null;
  return <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      <Header pokécoins={profile?.pokecoins || 0} nickname={profile?.nickname || 'Trainer'} onOpenAchievements={() => setShowAchievements(true)} onOpenPokedex={() => setShowPokedex(true)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Roulette Section */}
          <div className="lg:col-span-2 flex justify-center">
            <RouletteWheel onSpin={handleSpin} isSpinning={isSpinning} freeSpins={spins?.free_spins || 0} baseSpins={spins?.base_free_spins || 5} />
          </div>

          {/* Inventory Section */}
          <div className="space-y-6">
            <Card className="card-pokemon p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">📦 Seu Inventário</h2>
              
              {inventory.length === 0 ? <div className="text-center text-muted-foreground py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p>Seu inventário está vazio!</p>
                  <p className="text-sm">Gire a roleta para capturar Pokémon!</p>
                </div> : <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {inventory.map(pokemon => <div key={pokemon.pokemon_id} className="scale-75 origin-top">
                      <PokemonCard pokemon={{
                  id: pokemon.pokemon_id,
                  name: pokemon.pokemon_name,
                  sprite: pokemon.sprite,
                  rarity: pokemon.rarity as any
                }} quantity={pokemon.quantity} />
                    </div>)}
                </div>}
            </Card>

            {/* Actions */}
            <Card className="card-pokemon p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Ações</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowInventory(true)}>
                  <img src={inventarioIcon} alt="Inventário" className="w-8 h-8" />
                  <span className="text-sm font-medium">Inventário</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowShop(true)}>
                  <img src={lojaIcon} alt="Loja de Itens" className="w-8 h-8" />
                  <span className="text-sm font-medium">Loja</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" disabled>
                  <img src={evoluirIcon} alt="Evoluções" className="w-8 h-8" />
                  <span className="text-sm font-medium">Evoluções</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowPokedex(true)}>
                  <img src={pokedexIcon} alt="Pokédex" className="w-8 h-8" />
                  <span className="text-sm font-medium">Pokédex</span>
                </Button>
              </div>
              
              {/* Vender button centered below */}
              <div className="flex justify-center mt-4">
                <Button variant="outline" className="h-20 w-32 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowSell(true)}>
                  <img src={pokecoinIcon} alt="Vender" className="w-8 h-8" />
                  <span className="text-sm font-medium">Vender</span>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                * Funcionalidades em desenvolvimento
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <ResultModal isOpen={showResult} onClose={() => setShowResult(false)} pokemon={selectedPokemon} />

      {/* Starter Selection Modal */}
      <StarterSelectionModal isOpen={showStarterSelection} onSelect={handleStarterSelection} />

      {/* Inventory Modal */}
      <InventoryModal isOpen={showInventory} onClose={() => setShowInventory(false)} pokemonInventory={inventory} itemInventory={userItems} />

      {/* Shop Modal */}
      <ShopModal 
        isOpen={showShop} 
        onClose={() => {
          setShowShop(false);
          // Reload profile data to refresh pokeshards
          window.location.reload();
        }} 
        items={shopItems} 
        userPokecoins={userProfile?.pokecoins || 0}
        userPokeshards={userProfile?.pokeshards || 0}
        onBuyItem={async itemId => {
          const success = await buyItem(itemId);
          if (success) {
            window.location.reload();
          }
          return success;
        }} 
      />

      {/* Sell Modal */}
      <SellModal isOpen={showSell} onClose={() => setShowSell(false)} pokemonInventory={inventory} onSellSuccess={() => window.location.reload()} />

      {/* Achievements Modal */}
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} />

      {/* Pokedex Modal */}
      <PokedexModal isOpen={showPokedex} onClose={() => setShowPokedex(false)} />
    </div>;
};
export default Index;