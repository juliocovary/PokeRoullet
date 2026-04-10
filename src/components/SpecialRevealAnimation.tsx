import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pokemon } from '@/hooks/usePokemon';
import { Sparkles, Star, Crown, Zap } from 'lucide-react';

type RevealPhase = 'buildup' | 'flash' | 'reveal' | 'complete';

interface SpecialRevealAnimationProps {
  pokemon: Pokemon;
  onComplete: () => void;
  isLegendary: boolean; // true = legendary, false = secret
}

export const SpecialRevealAnimation = ({ 
  pokemon, 
  onComplete,
  isLegendary 
}: SpecialRevealAnimationProps) => {
  const { t } = useTranslation('common');
  const [phase, setPhase] = useState<RevealPhase>('buildup');
  const [particleCount, setParticleCount] = useState(0);

  useEffect(() => {
    // Buildup phase - dramatic anticipation
    const buildupTimer = setTimeout(() => {
      setPhase('flash');
    }, isLegendary ? 2500 : 3500); // Secret takes longer for more drama

    // Flash phase - bright explosion
    const flashTimer = setTimeout(() => {
      setPhase('reveal');
    }, isLegendary ? 2800 : 4000);

    // Complete phase - show pokemon fully
    const completeTimer = setTimeout(() => {
      setPhase('complete');
    }, isLegendary ? 3500 : 5000);

    // Auto-close after animation
    const closeTimer = setTimeout(() => {
      onComplete();
    }, isLegendary ? 5500 : 7000);

    // Particle spawn during buildup
    const particleInterval = setInterval(() => {
      setParticleCount(prev => Math.min(prev + 1, 50));
    }, 50);

    return () => {
      clearTimeout(buildupTimer);
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
      clearTimeout(closeTimer);
      clearInterval(particleInterval);
    };
  }, [isLegendary, onComplete]);

  const getSprite = () => {
    if (pokemon.isShiny) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  };

  // Color schemes
  const legendaryColors = {
    primary: 'from-yellow-500 via-amber-400 to-orange-500',
    secondary: 'from-yellow-300 to-amber-300',
    glow: 'shadow-yellow-500/80',
    text: 'text-yellow-400',
    particles: ['bg-yellow-400', 'bg-amber-400', 'bg-orange-400', 'bg-yellow-300'],
    ring: 'border-yellow-400'
  };

  const secretColors = {
    primary: 'from-violet-600 via-purple-500 to-pink-500',
    secondary: 'from-purple-400 via-violet-400 to-pink-400',
    glow: 'shadow-purple-500/80',
    text: 'text-purple-400',
    particles: ['bg-violet-400', 'bg-purple-400', 'bg-pink-400', 'bg-fuchsia-400', 'bg-cyan-400'],
    ring: 'border-purple-400'
  };

  const colors = isLegendary ? legendaryColors : secretColors;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Semi-transparent dark backdrop for text readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Animated background */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          phase === 'buildup' 
            ? 'bg-black/40' 
            : phase === 'flash' 
              ? 'bg-white' 
              : `bg-gradient-to-br ${colors.primary} opacity-20`
        }`}
      />

      {/* Radial pulse rings during buildup */}
      {phase === 'buildup' && (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full border-2 ${colors.ring} opacity-50`}
              style={{
                width: `${100 + i * 150}px`,
                height: `${100 + i * 150}px`,
                animation: `pulse-ring ${2 + i * 0.3}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </>
      )}

      {/* Particle explosion */}
      {(phase === 'buildup' || phase === 'flash') && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(particleCount)].map((_, i) => {
            const angle = (i / particleCount) * 360;
            const distance = phase === 'flash' ? 400 + Math.random() * 200 : 50 + Math.random() * 100;
            const size = 4 + Math.random() * 8;
            const delay = Math.random() * 0.5;
            const colorClass = colors.particles[i % colors.particles.length];
            
            return (
              <div
                key={i}
                className={`absolute left-1/2 top-1/2 rounded-full ${colorClass}`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}px)`,
                  opacity: phase === 'flash' ? 1 : 0.6,
                  transition: `all ${0.5 + delay}s ease-out`,
                  boxShadow: `0 0 ${size * 2}px ${size}px currentColor`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Lightning bolts for secret rarity */}
      {!isLegendary && phase === 'buildup' && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `lightning-flash 0.3s ease-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <Zap 
                className="text-purple-400" 
                size={30 + Math.random() * 40}
                style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }}
              />
            </div>
          ))}
        </>
      )}

      {/* Central energy orb during buildup */}
      {phase === 'buildup' && (
        <div 
          className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${colors.primary} animate-pulse`}
          style={{
            boxShadow: `0 0 60px 30px ${isLegendary ? 'rgba(251, 191, 36, 0.6)' : 'rgba(168, 85, 247, 0.6)'}`,
            animation: 'energy-pulse 0.5s ease-in-out infinite'
          }}
        >
          <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
        </div>
      )}

      {/* Flash overlay */}
      {phase === 'flash' && (
        <div 
          className="absolute inset-0 bg-white animate-flash"
          style={{ animation: 'flash-fade 0.5s ease-out forwards' }}
        />
      )}

      {/* Pokemon reveal */}
      {(phase === 'reveal' || phase === 'complete') && (
        <div className="relative z-10 flex flex-col items-center animate-scale-in">
          {/* Glowing background aura */}
          <div 
            className={`absolute w-80 h-80 rounded-full bg-gradient-to-br ${colors.secondary} blur-3xl opacity-60`}
            style={{ animation: 'aura-pulse 2s ease-in-out infinite' }}
          />

          {/* Pokemon sprite with effects */}
          <div className="relative">
            {/* Rotating ring of symbols */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'slow-spin 10s linear infinite' }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-140px)`
                  }}
                >
                  {isLegendary ? (
                    <Star className={`${colors.text} w-6 h-6`} fill="currentColor" />
                  ) : (
                    <Sparkles className={`${colors.text} w-6 h-6`} />
                  )}
                </div>
              ))}
            </div>

            {/* Pokemon image */}
            <div 
              className={`relative ${pokemon.isShiny ? 'animate-shiny-glow' : ''}`}
              style={{
                filter: `drop-shadow(0 0 30px ${isLegendary ? 'rgba(251, 191, 36, 0.8)' : 'rgba(168, 85, 247, 0.8)'})`,
                animation: phase === 'complete' ? 'pokemon-float 3s ease-in-out infinite' : 'pokemon-entrance 1s ease-out'
              }}
            >
              <img 
                src={getSprite()}
                alt={pokemon.name}
                className="w-64 h-64 object-contain pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Crown for legendary */}
            {isLegendary && phase === 'complete' && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                <Crown className="w-12 h-12 text-yellow-400" fill="currentColor" />
              </div>
            )}
          </div>

          {/* Pokemon name and rarity badge */}
          {phase === 'complete' && (
            <div className="mt-8 text-center animate-fade-in">
              <h2 
                className={`text-4xl md:text-5xl font-bold capitalize ${colors.text} drop-shadow-lg`}
                style={{
                  textShadow: `0 0 20px ${isLegendary ? 'rgba(251, 191, 36, 0.8)' : 'rgba(168, 85, 247, 0.8)'}`
                }}
              >
                {pokemon.name}
              </h2>
              
              <div className={`mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r ${colors.primary} text-white font-bold text-lg shadow-lg ${colors.glow}`}>
                {isLegendary ? (
                  <>
                    <Crown className="w-5 h-5" />
                    LEGENDARY
                    <Crown className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    SECRET
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </div>

              {pokemon.isShiny && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold animate-pulse">
                  ✨ SHINY ✨
                </div>
              )}

              <p className="mt-6 text-white/80 text-lg">
                {t('tapToContinue')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating sparkles throughout */}
      {(phase === 'reveal' || phase === 'complete') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${colors.particles[i % colors.particles.length]} rounded-full opacity-80`}
              style={{
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `sparkle-float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Click to continue overlay */}
      {phase === 'complete' && (
        <button 
          onClick={onComplete}
          className="absolute inset-0 z-20 cursor-pointer"
          aria-label={t('tapToContinue')}
        />
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes energy-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        
        @keyframes flash-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes aura-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pokemon-entrance {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes pokemon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes sparkle-float {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.8; 
          }
          50% { 
            transform: translateY(-30px) scale(1.2); 
            opacity: 1; 
          }
        }
        
        @keyframes lightning-flash {
          0%, 90%, 100% { opacity: 0; }
          5%, 15% { opacity: 1; }
          10% { opacity: 0.5; }
        }
        
        @keyframes shiny-glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 30px rgba(251, 191, 36, 0.8)); }
          50% { filter: brightness(1.3) drop-shadow(0 0 50px rgba(251, 191, 36, 1)); }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-shiny-glow {
          animation: shiny-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
