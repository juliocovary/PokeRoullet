import { useState, useEffect } from 'react';
import { X, ShoppingCart, Coins, TrendingUp, Package } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useSpinProgression } from '@/hooks/useSpinProgression';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import giroEternoIcon from '@/assets/giro-eterno-icon.png';
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
  onBuyItem: (itemId: number) => Promise<boolean>;
}
export const ShopModal = ({
  isOpen,
  onClose,
  items,
  userPokecoins,
  userPokeshards,
  onBuyItem
}: ShopModalProps) => {
  const {
    user
  } = useAuth();
  const {
    increaseBaseSpins,
    isLoading: spinLoading
  } = useSpinProgression();
  const [buying, setBuying] = useState<number | null>(null);
  const [giroEternoPurchases, setGiroEternoPurchases] = useState(0);
  const [buyingGiroEterno, setBuyingGiroEterno] = useState(false);
  useEffect(() => {
    const fetchGiroEternoPurchases = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('user_items').select('quantity').eq('user_id', user.id).eq('item_id', 999) // Special ID for Giro Eterno
        .single();
        if (data && !error) {
          setGiroEternoPurchases(data.quantity);
        }
      } catch (error) {
        console.error('Error fetching Giro Eterno purchases:', error);
      }
    };
    if (isOpen) {
      fetchGiroEternoPurchases();
    }
  }, [isOpen, user]);
  const giroEternoPrice = 25 + giroEternoPurchases * 10;
  const handleBuyGiroEterno = async () => {
    if (!user) return;
    if (userPokeshards < giroEternoPrice) {
      toast({
        title: 'Pokeshards insuficientes!',
        description: `Você precisa de ${giroEternoPrice} pokeshards para comprar este upgrade.`,
        variant: 'destructive'
      });
      return;
    }
    setBuyingGiroEterno(true);
    try {
      // First update purchase count in database
      const newPurchaseCount = giroEternoPurchases + 1;

      // Check if user already has this item, then update or insert accordingly
      const {
        data: existingItem
      } = await supabase.from('user_items').select('quantity').eq('user_id', user.id).eq('item_id', 999).single();
      if (existingItem) {
        // Update existing record
        const {
          error: itemError
        } = await supabase.from('user_items').update({
          quantity: newPurchaseCount
        }).eq('user_id', user.id).eq('item_id', 999);
        if (itemError) {
          console.error('Error updating user_items:', itemError);
          throw itemError;
        }
      } else {
        // Insert new record
        const {
          error: itemError
        } = await supabase.from('user_items').insert({
          user_id: user.id,
          item_id: 999,
          quantity: newPurchaseCount
        });
        if (itemError) {
          console.error('Error inserting user_items:', itemError);
          throw itemError;
        }
      }
      console.log('Calling increaseBaseSpins...');
      // Increase base spins
      const success = await increaseBaseSpins(1);
      if (success) {
        // Deduct pokeshards
        const {
          error: updateError
        } = await supabase.from('profiles').update({
          pokeshards: userPokeshards - giroEternoPrice
        }).eq('user_id', user.id);
        if (updateError) throw updateError;

        // Update local state immediately
        setGiroEternoPurchases(newPurchaseCount);
        toast({
          title: '🎉 Giro Eterno comprado!',
          description: 'Seus giros base foram aumentados em +1!'
        });

        // Call onClose to trigger parent refresh (this will update pokeshards)
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Rollback purchase count if spin increase failed
        await supabase.from('user_items').upsert({
          user_id: user.id,
          item_id: 999,
          quantity: giroEternoPurchases
        });
        toast({
          title: 'Erro na compra',
          description: 'Houve um problema ao processar sua compra.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na compra',
        description: 'Houve um problema ao processar sua compra.',
        variant: 'destructive'
      });
    } finally {
      setBuyingGiroEterno(false);
    }
  };
  const handleBuyItem = async (item: ShopItem) => {
    if (userPokecoins < item.price) {
      toast({
        title: 'Pokécoins insuficientes!',
        description: `Você precisa de ${item.price} pokécoins para comprar este item.`,
        variant: 'destructive'
      });
      return;
    }
    setBuying(item.id);
    try {
      const success = await onBuyItem(item.id);
      if (success) {
        toast({
          title: '🎉 Item comprado!',
          description: `${item.name} foi adicionado ao seu inventário!`
        });
      } else {
        toast({
          title: 'Erro na compra',
          description: 'Houve um problema ao processar sua compra.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na compra',
        description: 'Houve um problema ao processar sua compra.',
        variant: 'destructive'
      });
    } finally {
      setBuying(null);
    }
  };
  const renderUpgrades = () => <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
      <div className="card-pokemon p-6 text-center card-hover transition-all duration-300 bg-gradient-to-br from-white to-blue-50 border-blue-200">
        <img src={giroEternoIcon} alt="Giro Eterno" className="w-16 h-16 mx-auto mb-4" />
        <h3 className="font-bold text-xl mb-2">Giro Eterno</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adiciona +1 giro base permanentemente
        </p>
        
        {giroEternoPurchases > 0 && <Badge variant="secondary" className="mb-4">
            Comprado {giroEternoPurchases}x
          </Badge>}
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={pokeshardIcon} alt="Pokeshard" className="w-5 h-5" />
          <span className="font-bold text-lg text-purple-700">
            {giroEternoPrice}
          </span>
        </div>
        
        <Button onClick={handleBuyGiroEterno} disabled={userPokeshards < giroEternoPrice || buyingGiroEterno || spinLoading} className={`w-full ${userPokeshards >= giroEternoPrice ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : ''}`}>
          {buyingGiroEterno ? <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Comprando...
            </div> : userPokeshards >= giroEternoPrice ? <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Comprar Upgrade
            </div> : 'Pokeshards insuficientes'}
        </Button>
      </div>
    </div>;
  const renderItems = () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => {
        const canAfford = userPokecoins >= item.price;
        const isBuying = buying === item.id;
        return (
          <Card key={item.id} className="p-6 bg-white/80 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
            <div className="text-center space-y-4">
              {item.icon_url && <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <img src={item.icon_url} alt={item.name} className="w-12 h-12 object-contain" />
                  </div>
                </div>}
              <div>
                <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xl font-bold">
                <img src={pokecoinIcon} alt="Pokecoin" className="w-6 h-6" />
                <span className="text-yellow-600">{item.price.toLocaleString()}</span>
              </div>
              <Button onClick={() => handleBuyItem(item)} disabled={!canAfford || isBuying} className={`w-full ${canAfford && !isBuying ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gray-400'} text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${canAfford && !isBuying ? 'hover:scale-105' : ''}`}>
                {isBuying ? 'Comprando...' : canAfford ? 'Comprar' : 'Pokécoins Insuficientes'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white/80 backdrop-blur-sm rounded-t-lg">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-primary">Loja</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Currency Balance */}
          <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-purple-50">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <img src={pokecoinIcon} alt="Pokécoin" className="w-6 h-6" />
                <span className="text-lg font-bold text-amber-700">
                  {userPokecoins.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img src={pokeshardIcon} alt="Pokeshard" className="w-6 h-6" />
                <span className="text-lg font-bold text-purple-700">
                  {userPokeshards.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Shop Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="upgrades" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="upgrades" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Upgrades
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Loja
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upgrades" className="flex-1 p-6 overflow-y-auto">
                {renderUpgrades()}
              </TabsContent>
              
              <TabsContent value="items" className="flex-1 p-6 overflow-y-auto">
                {renderItems()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};