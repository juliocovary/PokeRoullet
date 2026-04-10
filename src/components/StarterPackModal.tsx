import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackOpeningAnimation } from './PackOpeningAnimation';
import type { PackCard } from '@/hooks/useCardPacks';
import { useToast } from '@/hooks/use-toast';
import { getRegionGlowColor, getRegionPackConfig, getStarterPreview } from '@/data/regionPacks';

interface StarterPackModalProps {
  isOpen: boolean;
  region: string;
  onOpenPack: (region: string) => Promise<{ success: boolean; pokemon_id?: number; pokemon_name?: string; rarity?: string; is_shiny?: boolean; message?: string }>;
  onComplete: () => void;
}

export const StarterPackModal = ({ isOpen, region, onOpenPack, onComplete }: StarterPackModalProps) => {
  const { t } = useTranslation('modals');
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<'idle' | 'preopen' | 'requesting'>('idle');
  const [revealedCards, setRevealedCards] = useState<PackCard[] | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [useFallbackArtwork, setUseFallbackArtwork] = useState(false);

  const regionGlow = getRegionGlowColor(region);
  const regionName = getRegionPackConfig(region)?.name || region.charAt(0).toUpperCase() + region.slice(1);
  const starterPreview = getStarterPreview(region);
  const packArtworkSrc = `/packs/starter-${region}.png`;
  const isSelectionActive = selectedPackIndex !== null;
  const isBusy = isOpening || selectionPhase !== 'idle';
  const PREOPEN_MIN_MS = 560;

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleClickPack = async (index: number) => {
    if (isBusy) return;
    setSelectedPackIndex(index);
    setSelectionPhase('preopen');
    setIsOpening(true);

    const startedAt = Date.now();
    const requestPromise = onOpenPack(region);

    // Keep the pre-open choreography visible before moving into cinematic.
    await wait(220);
    setSelectionPhase('requesting');

    const result = await requestPromise;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, PREOPEN_MIN_MS - elapsed);
    if (remaining > 0) {
      await wait(remaining);
    }

    if (result.success && result.pokemon_id && result.pokemon_name) {
      setRevealedCards([{
        pokemon_id: result.pokemon_id,
        pokemon_name: result.pokemon_name,
        rarity: result.rarity || 'starter',
        is_shiny: result.is_shiny || false,
      }]);
      setShowAnimation(true);
    } else {
      const failureMessage = result.message || t('packs.openStarterError', { defaultValue: 'Unable to open this region starter pack.' });
      toast({
        title: t('packs.openStarterFailedTitle', { defaultValue: 'Failed to open starter pack' }),
        description: failureMessage,
        variant: 'destructive',
      });

      setSelectedPackIndex(null);
      setSelectionPhase('idle');

      // If the backend says this region pack was already opened, close this modal to avoid loop.
      if (/already opened|ja foi aberto/i.test(failureMessage)) {
        onComplete();
      }
    }

    setIsOpening(false);
  };

  const handleAnimationClose = () => {
    setShowAnimation(false);
    setRevealedCards(null);
    setSelectionPhase('idle');
    setSelectedPackIndex(null);
    setIsOpening(false);
    onComplete();
  };

  if (!isOpen) return null;

  if (showAnimation && revealedCards) {
    return (
      <PackOpeningAnimation
        isOpen={true}
        onClose={handleAnimationClose}
        cards={revealedCards}
        packName={`Starter Pack ${regionName}`}
        isStarterPack={true}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Dark translucent backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="starter-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: regionGlow.replace('0.5', '0.8'),
            }}
          />
        ))}
      </div>

      {/* Instruction panel */}
      <div className="absolute top-6 sm:top-10 left-0 right-0 z-10 px-4">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/40 backdrop-blur-md px-4 py-3 text-center shadow-[0_16px_60px_rgba(0,0,0,0.35)]">
          <p className="text-amber-300 text-[12px] sm:text-sm font-extrabold uppercase tracking-[0.32em] drop-shadow-[0_0_10px_rgba(251,191,36,0.22)]">
            {t('packs.starterTitle', { defaultValue: 'Choose Your Destiny' })}
          </p>
          <p className="mt-1 text-white text-sm sm:text-base font-semibold tracking-wide">
            {t('packs.starterSubtitle', { defaultValue: 'Pick one of the 3 packs to reveal your starter Pokémon.' })}
          </p>
        </div>
      </div>

      {/* Three floating packs */}
      <div className="relative z-10 mt-16 sm:mt-20 w-full max-w-5xl px-4 flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-7 md:gap-10">
        {[0, 1, 2].map((index) => {
          const floatDelay = index * 0.5;
          const isSelected = selectedPackIndex === index;
          const isCenterSelected = selectedPackIndex === 1;
          const isLeftSelected = selectedPackIndex === 0;
          const isRightSelected = selectedPackIndex === 2;
          const isHoldingSelection = isSelected && selectionPhase === 'requesting';

          let slotMotionClass = '';
          if (isSelectionActive) {
            if (isSelected) {
              slotMotionClass = index === 1 ? 'starter-slot-selected-center' : 'starter-slot-selected-side';
            } else if (isCenterSelected) {
              slotMotionClass = index === 0 ? 'starter-slot-exit-left' : 'starter-slot-exit-right';
            } else if (isLeftSelected) {
              slotMotionClass = 'starter-slot-exit-right';
            } else if (isRightSelected) {
              slotMotionClass = 'starter-slot-exit-left';
            }
          }

          return (
            <div
              key={index}
              className={`relative group starter-pack-slot-${index} ${isSelectionActive ? 'starter-selection-active' : ''} ${slotMotionClass} ${isHoldingSelection ? 'starter-slot-selected-hold' : ''}`}
              style={{ animationDelay: `${floatDelay}s` }}
            >
              {/* Soft glow behind each pack */}
              <div
                className="starter-pack-ambient-glow"
                style={{
                  background: `radial-gradient(circle, ${regionGlow} 0%, transparent 70%)`,
                }}
              />
              <div
                className="starter-pack-ambient-core"
                style={{
                  background: `radial-gradient(circle, ${regionGlow} 0%, transparent 65%)`,
                }}
              />

              <div
                className={`starter-pack-floating-card ${isBusy ? 'pointer-events-none' : 'cursor-pointer'} ${isSelected ? 'starter-pack-card-selected' : ''} ${isSelectionActive && !isSelected ? 'starter-pack-card-deselected' : ''}`}
                style={{ animationDelay: `${floatDelay}s` }}
                onClick={() => handleClickPack(index)}
                aria-label={t('packs.openPack', { defaultValue: 'Open Pack' })}
              >
                <div className="starter-booster-shell-floating">
                  {!useFallbackArtwork && (
                    <img
                      src={packArtworkSrc}
                      alt={`Starter Pack ${regionName}`}
                      className="starter-booster-artwork"
                      loading="lazy"
                      onError={() => setUseFallbackArtwork(true)}
                    />
                  )}

                  {useFallbackArtwork && (
                    <>
                      <div className="starter-booster-logo">POKE ROULETTE</div>
                      <div className="starter-booster-showcase">
                        {starterPreview.map((pokemonId) => (
                          <img
                            key={pokemonId}
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
                            alt={`starter-${pokemonId}`}
                            className="starter-booster-sprite"
                            loading="lazy"
                          />
                        ))}
                      </div>
                      <div className="starter-booster-pokeball" />
                      <div className="starter-booster-label">STARTER PACK</div>
                    </>
                  )}

                  {/* Holo shimmer */}
                  <div className="starter-pack-holo-shimmer" />
                </div>

                <div className="starter-pack-choice-chip">
                  {t('packs.openPack', { defaultValue: 'Open Pack' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {(isOpening || selectionPhase === 'requesting') && (
        <div className="absolute bottom-12 left-0 right-0 z-10 flex justify-center">
          <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            {t('packs.opening', { defaultValue: 'Opening...' })}
          </div>
        </div>
      )}
    </div>
  );
};
