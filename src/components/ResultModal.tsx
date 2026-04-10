import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PokemonCard } from './PokemonCard';
import { Pokemon } from '@/hooks/usePokemon';
import { useTranslation } from 'react-i18next';
import { SpecialRevealAnimation } from './SpecialRevealAnimation';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon: Pokemon | null;
  pokécoinsEarned?: number;
  multiplePokemons?: Pokemon[];
}

export const ResultModal = ({
  isOpen,
  onClose,
  pokemon,
  pokécoinsEarned = 0,
  multiplePokemons
}: ResultModalProps) => {
  const { t } = useTranslation('modals');
  const [showSpecialAnimation, setShowSpecialAnimation] = useState(true);
  const [specialPokemonToAnimate, setSpecialPokemonToAnimate] = useState<Pokemon | null>(null);

  // Determine special pokemon to animate (legendary or secret)
  const isMultiple = multiplePokemons && multiplePokemons.length > 0;
  const displayPokemons = isMultiple ? (multiplePokemons || []) : (pokemon ? [pokemon] : []);
  
  // Find legendary or secret pokemon for special animation (both single and multi-spin)
  const legendaryPokemon = displayPokemons.find(p => p?.rarity === 'legendary');
  const secretPokemon = displayPokemons.find(p => p?.rarity === 'secret');
  
  // Priority: secret > legendary for animation
  const pokemonForSpecialAnim = secretPokemon || legendaryPokemon;
  
  useEffect(() => {
    if (isOpen && pokemonForSpecialAnim) {
      setSpecialPokemonToAnimate(pokemonForSpecialAnim);
      setShowSpecialAnimation(true);
    } else {
      setShowSpecialAnimation(false);
      setSpecialPokemonToAnimate(null);
    }
  }, [isOpen, pokemonForSpecialAnim]);

  if (!pokemon && !multiplePokemons) return null;
  
  const hasSpecialPokemon = displayPokemons.some(p => p?.rarity === 'legendary' || p?.rarity === 'starter' || p?.rarity === 'pseudo' || p?.rarity === 'secret');
  const shinyPokemons = displayPokemons.filter(p => p?.isShiny);
  const hasShiny = shinyPokemons.length > 0;

  // Show special animation for legendary/secret
  if (showSpecialAnimation && specialPokemonToAnimate && isOpen) {
    return (
      <SpecialRevealAnimation
        pokemon={specialPokemonToAnimate}
        isLegendary={specialPokemonToAnimate.rarity === 'legendary'}
        onComplete={() => setShowSpecialAnimation(false)}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMultiple ? "max-w-[95vw] sm:max-w-3xl lg:max-w-5xl" : "max-w-md"} mx-auto bg-transparent border-0 shadow-none p-4 sm:p-6 max-h-[90vh] flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-base sm:text-xl md:text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {isMultiple ? t('result.multipleTitle', { count: displayPokemons.length }) : hasSpecialPokemon ? t('result.specialTitle') : t('result.newTitle')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0 text-center space-y-4 sm:space-y-6">
          {/* Confetti effect for special pokemon */}
          {hasSpecialPokemon && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute animate-bounce" 
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  {['⭐', '✨', '🎊', '🎉'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}

          {/* Pokemon Cards */}
          {isMultiple ? (
            <div className="py-2 sm:py-4 w-full">
              {/* Mobile: 2 on top, 1 centered below */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 justify-center items-center">
                {/* Top row - first 2 cards side by side on mobile */}
                <div className="flex gap-2 sm:gap-6 justify-center">
                  {displayPokemons.slice(0, 2).map((poke, index) => poke && (
                    <div 
                      key={index} 
                      className="scale-[0.65] sm:scale-100 lg:scale-110 animate-float flex-shrink-0" 
                      style={{
                        animation: `float ${3 + index * 0.3}s ease-in-out infinite`,
                        animationDelay: `${index * 0.2}s`
                      }}
                    >
                      <PokemonCard pokemon={poke} isRevealing />
                    </div>
                  ))}
                </div>
                {/* Bottom row - 3rd card centered (only on mobile shows separately) */}
                {displayPokemons.length > 2 && (
                  <div className="flex justify-center sm:hidden">
                    <div 
                      className="scale-[0.65] animate-float flex-shrink-0" 
                      style={{
                        animation: `float 3.6s ease-in-out infinite`,
                        animationDelay: `0.4s`
                      }}
                    >
                      <PokemonCard pokemon={displayPokemons[2]} isRevealing />
                    </div>
                  </div>
                )}
                {/* Desktop: show 3rd card inline */}
                {displayPokemons.length > 2 && displayPokemons[2] && (
                  <div 
                    className="hidden sm:block scale-100 lg:scale-110 animate-float flex-shrink-0" 
                    style={{
                      animation: `float 3.6s ease-in-out infinite`,
                      animationDelay: `0.4s`
                    }}
                  >
                    <PokemonCard pokemon={displayPokemons[2]} isRevealing />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2 sm:py-4 w-full">
              {displayPokemons.map((poke, index) => poke && (
                <div 
                  key={index} 
                  className="scale-100 sm:scale-110 animate-float flex-shrink-0" 
                  style={{
                    animation: `float ${3 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  <PokemonCard pokemon={poke} isRevealing />
                </div>
              ))}
            </div>
          )}

          {/* Congratulations Message */}
          <div className={`space-y-2 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/40 dark:via-amber-800/40 dark:to-yellow-900/40 backdrop-blur-sm rounded-lg p-3 border-2 border-yellow-400/50 dark:border-yellow-600/50 shadow-lg ${isMultiple ? 'mx-2 sm:mx-8 lg:mx-[300px]' : 'mx-auto max-w-md'}`}>
            {isMultiple 
              ? <h3 className="text-base md:text-lg font-bold">{t('result.obtained', { count: displayPokemons.length })}</h3> 
              : <h3 className="text-base md:text-lg font-bold capitalize">{t('result.obtainedSingle', { name: pokemon!.name })}</h3>
            }
            {pokécoinsEarned > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('result.coinsEarned', { amount: pokécoinsEarned })}
              </p>
            )}
          </div>

          {/* Shiny Message */}
          {!isMultiple && pokemon?.isShiny && (
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/60 dark:to-yellow-800/60 p-4 rounded-lg border-2 border-yellow-400 shadow-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-bold text-lg">
                {t('result.shinyTitle')}
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                {t('result.shinyDesc')}
              </p>
            </div>
          )}

          {/* Special Messages - Only show for single pokemon */}
          {!isMultiple && pokemon && (
            <>
              {pokemon.rarity === 'legendary' && (
                <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg border border-yellow-300">
                  <p className="text-yellow-800 font-bold">
                    {t('result.legendaryTitle')}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    {t('result.legendaryDesc')}
                  </p>
                </div>
              )}

              {pokemon.rarity === 'starter' && (
                <div className="bg-gradient-to-r from-orange-100 to-orange-200 p-4 rounded-lg border border-orange-300">
                  <p className="text-orange-800 font-bold">
                    {t('result.starterTitle')}
                  </p>
                  <p className="text-orange-700 text-sm">
                    {t('result.starterDesc')}
                  </p>
                </div>
              )}

              {pokemon.rarity === 'pseudo' && (
                <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg border border-purple-300">
                  <p className="text-purple-800 font-bold">
                    {t('result.pseudoTitle')}
                  </p>
                  <p className="text-purple-700 text-sm">
                    {t('result.pseudoDesc')}
                  </p>
                </div>
              )}

              {pokemon.rarity === 'secret' && (
                <div className="bg-gradient-to-r from-violet-100 to-violet-200 p-4 rounded-lg border border-violet-300">
                  <p className="text-violet-800 font-bold">
                    {t('result.secretTitle')}
                  </p>
                  <p className="text-violet-700 text-sm">
                    {t('result.secretDesc')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Multi-spin shiny message */}
          {isMultiple && hasShiny && (
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/60 dark:to-yellow-800/60 p-4 rounded-lg border-2 border-yellow-400 shadow-lg mx-2 sm:mx-8 lg:mx-[50px]">
              <p className="text-yellow-800 dark:text-yellow-200 font-bold text-lg">
                ✨ {shinyPokemons.length === 1 
                  ? t('result.shinyMultiSingle', { name: shinyPokemons[0]?.name }) 
                  : t('result.shinyMultiMultiple', { count: shinyPokemons.length })}
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                {t('result.shinyMultiDesc')}
              </p>
            </div>
          )}

          {/* Multi-spin summary */}
          {isMultiple && hasSpecialPokemon && (
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg border border-yellow-300 mx-2 sm:mx-8 lg:mx-[50px]">
              <p className="text-yellow-800 font-bold">
                {t('result.specialPokemon')}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Button at bottom - outside scrollable area */}
        <div className="flex-shrink-0 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-center">
          <Button onClick={onClose} className="btn-casino py-2.5 text-sm md:text-base px-8 shadow-lg shadow-primary/30">
            {t('result.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};