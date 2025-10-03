import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSpinTimer } from '@/hooks/useSpinTimer';
import { toast } from '@/hooks/use-toast';
import pokeballIcon from '@/assets/pokeball_icon.png';
interface RouletteWheelProps {
  onSpin: () => void;
  isSpinning: boolean;
  freeSpins: number;
  baseSpins?: number;
}
export const RouletteWheel = ({
  onSpin,
  isSpinning,
  freeSpins,
  baseSpins
}: RouletteWheelProps) => {
  const {
    isTimerActive,
    formattedTime
  } = useSpinTimer(freeSpins, baseSpins);
  const [rotation, setRotation] = useState(0);
  const handleSpin = () => {
    if (freeSpins <= 0) {
      toast({
        title: "Sem giros disponíveis!",
        description: `Próximo reset: ${formattedTime}`,
        variant: "destructive"
      });
      return;
    }

    // Random rotation between 1440-2880 degrees (4-8 full rotations)
    const newRotation = rotation + 1440 + Math.random() * 1440;
    setRotation(newRotation);
    onSpin();
  };
  return <div className="flex flex-col items-center space-y-8">
      {/* Free Spins Counter */}
      <Card className="card-pokemon px-6 py-3 animate-glow-pulse">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Giros Disponíveis
        </p>
          <p className="text-3xl font-bold text-accent">{freeSpins}</p>
          
        </div>
      </Card>

      {/* Roulette Wheel */}
      <div className="relative">
        {/* Wheel Container */}
        <div className="relative w-80 h-80">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-accent"></div>
          </div>

          {/* Wheel */}
          <div className={`w-full h-full roulette-wheel transition-transform duration-[1500ms] ease-out ${isSpinning ? 'spinning' : ''}`} style={{
          transform: `rotate(${rotation}deg)`
        }}>
            {/* Wheel Segments Labels */}
            <div className="absolute inset-4 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 animate-spin">
                    <img src={pokeballIcon} alt="Pokeball" className="w-full h-full" />
                  </div>
                  <div className="text-lg font-bold">SPIN</div>
                </div>
              </div>
            </div>
            
            {/* Pokéball center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-b from-red-500 via-white to-white border-4 border-gray-800">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-800">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-800"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Outer Ring - Only decorative animation */}
        <div className="absolute -inset-4 rounded-full border-4 border-dashed border-accent/50 animate-spin" style={{
        animationDuration: '20s'
      }}>
        </div>
      </div>

      {/* Spin Button */}
      <Button onClick={handleSpin} disabled={isSpinning || freeSpins <= 0} className="btn-casino text-xl px-12 py-6 hover:scale-105 transition-transform duration-200">
        <img src={pokeballIcon} alt="Pokebola" className="w-6 h-6 mr-2" />
        {isSpinning ? 'GIRANDO...' : freeSpins <= 0 ? 'SEM GIROS' : 'GIRAR ROLETA'}
      </Button>

      
      
      {/* Timer Display - Só aparece quando não há giros E há um timer ativo */}
      {freeSpins === 0 && isTimerActive && <Card className="card-pokemon p-6 w-full max-w-md animate-glow-pulse border-yellow-500/50">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              
              <h3 className="text-lg font-bold text-yellow-400">Reset dos Giros</h3>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
              <p className="text-sm text-muted-foreground mb-2">Próximo reset em:</p>
              <div className="text-3xl font-mono font-bold text-accent tracking-wider">
                {formattedTime}
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-muted-foreground">Aguarde o reset global para ganhar {baseSpins || 5} giros</p>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </Card>}

      {/* Probability Display */}
      <Card className="card-pokemon p-4 w-full max-w-md">
        <h3 className="font-bold text-center mb-3">Chances de Drop</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>🥇 Lendário:</span>
              <span className="font-bold text-rarity-legendary">0.1%</span>
            </div>
            <div className="flex justify-between">
              <span>⭐ Inicial:</span>
              <span className="font-bold text-rarity-starter">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>🐉 Pseudo:</span>
              <span className="font-bold text-rarity-pseudo">1%</span>
            </div>
            <div className="flex justify-between">
              <span>💎 Raro:</span>
              <span className="font-bold text-rarity-rare">10%</span>
            </div>
            <div className="flex justify-between">
              <span>🔹 Incomum:</span>
              <span className="font-bold text-rarity-uncommon">25%</span>
            </div>
            <div className="flex justify-between">
              <span>⚪ Comum:</span>
              <span className="font-bold text-rarity-common">65%</span>
            </div>
          </div>
      </Card>
    </div>;
};