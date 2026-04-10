import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { X, Crown, Sparkles, Star, Zap } from 'lucide-react';
import type { PackCard } from '@/hooks/useCardPacks';
import { GEN1_POKEMON } from '@/data/allPokemon';

interface PackOpeningAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  cards: PackCard[];
  packName: string;
  packTypeId?: string;
  isStarterPack?: boolean;
  packArtwork?: string;
}

const PACK_ARTWORK_BY_TYPE_ID: Record<string, string> = {
  brasa_comum: '/packs/brasacomum.png',
  aurora_incomum: '/packs/uncommonaurora.png',
  prisma_raro: '/packs/rareprism.png',
  eclipse_epico: '/packs/epiceclipse.png',
  reliquia_lendaria: '/packs/legendaryrelic.png',
  secreto_ruina: '/packs/secretancient.png',
};

const POKEMON_NAME_BY_ID = new Map<number, string>(
  GEN1_POKEMON.map((pokemon) => [pokemon.id, pokemon.name])
);

const formatPokemonDisplayName = (name: string) => {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const resolveCardPokemonName = (card: PackCard) => {
  const normalizedPokemonId = Number(card.pokemon_id);
  const rawName = (card.pokemon_name || '').trim();
  const isGeneric = /^pokemon-\d+$/i.test(rawName);

  if (!rawName || isGeneric) {
    const lookup = Number.isFinite(normalizedPokemonId) ? POKEMON_NAME_BY_ID.get(normalizedPokemonId) : undefined;
    if (lookup) return formatPokemonDisplayName(lookup);
    return Number.isFinite(normalizedPokemonId) ? `Pokemon ${normalizedPokemonId}` : 'Pokemon';
  }

  return formatPokemonDisplayName(rawName);
};

const RARITY_COLORS: Record<string, string> = {
  common: 'from-green-400 to-green-600',
  uncommon: 'from-blue-400 to-blue-600',
  rare: 'from-purple-400 to-purple-600',
  pseudo: 'from-orange-400 to-orange-600',
  starter: 'from-yellow-400 to-yellow-600',
  legendary: 'from-yellow-300 to-amber-500',
  secret: 'from-violet-500 to-fuchsia-600',
};

const RARITY_GLOW: Record<string, string> = {
  common: 'shadow-green-400/30',
  uncommon: 'shadow-blue-400/30',
  rare: 'shadow-purple-400/50',
  pseudo: 'shadow-orange-400/50',
  starter: 'shadow-yellow-400/50',
  legendary: 'shadow-yellow-300/70',
  secret: 'shadow-violet-500/80',
};

const RARITY_BORDER_GLOW: Record<string, string> = {
  common: 'border-green-400/40',
  uncommon: 'border-blue-400/40',
  rare: 'border-purple-400/60',
  pseudo: 'border-orange-400/60',
  starter: 'border-yellow-400/50',
  legendary: 'border-yellow-300/70',
  secret: 'border-violet-500/80',
};

// Map pack IDs to artwork files
const PACK_ARTWORK_MAP: Record<string, string> = {
  brasa_comum: '/packs/brasacomum.png',
  aurora_incomum: '/packs/uncommonaurora.png',
  prisma_raro: '/packs/rareprism.png',
  eclipse_epico: '/packs/epiceclipse.png',
  reliquia_lendaria: '/packs/legendaryrelic.png',
  secreto_ruina: '/packs/secretancient.png',
};

const getSprite = (card: PackCard) => {
  return card.is_shiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${card.pokemon_id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.pokemon_id}.png`;
};

export const PackOpeningAnimation = ({ isOpen, onClose, cards, packName, packTypeId, isStarterPack = false, packArtwork }: PackOpeningAnimationProps) => {
  const isSingleCard = isStarterPack || cards.length === 1;

  if (!isOpen) return null;

  if (isSingleCard) {
    return <SingleCardReveal card={cards[0]} packName={packName} onClose={onClose} isStarterPack={isStarterPack} />;
  }

  return <MultiCardReveal cards={cards} packName={packName} packTypeId={packTypeId} onClose={onClose} packArtwork={packArtwork} />;
};

/* ===== SINGLE CARD REVEAL (Starter / Secret) ===== */
const SingleCardReveal = ({
  card,
  packName,
  onClose,
  isStarterPack,
}: {
  card: PackCard;
  packName: string;
  onClose: () => void;
  isStarterPack: boolean;
}) => {
  const [phase, setPhase] = useState<'buildup' | 'flash' | 'reveal' | 'complete'>('buildup');
  const [particleCount, setParticleCount] = useState(0);

  const tone: 'starter' | 'legendary' | 'secret' = isStarterPack
    ? 'starter'
    : card.rarity === 'secret'
    ? 'secret'
    : 'legendary';

  useEffect(() => {
    const particleInterval = setInterval(() => {
      setParticleCount((prev) => Math.min(prev + 1, 50));
    }, 50);

    const isLegendaryLike = tone !== 'secret';
    const t1 = setTimeout(() => setPhase('flash'), isLegendaryLike ? 2500 : 3500);
    const t2 = setTimeout(() => setPhase('reveal'), isLegendaryLike ? 2800 : 4000);
    const t3 = setTimeout(() => setPhase('complete'), isLegendaryLike ? 3500 : 5000);

    return () => {
      clearInterval(particleInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [tone]);

  useEffect(() => {
    if (phase !== 'complete') return;
    const closeTimer = setTimeout(() => {
      onClose();
    }, 1500);

    return () => clearTimeout(closeTimer);
  }, [phase, onClose]);

  const colors =
    tone === 'starter'
      ? {
          primary: 'from-yellow-400 via-lime-300 to-emerald-400',
          secondary: 'from-yellow-200 to-emerald-300',
          text: 'text-yellow-300',
          particles: ['bg-yellow-300', 'bg-lime-300', 'bg-emerald-300', 'bg-amber-300'],
          glowColor: 'rgba(253, 224, 71, 0.85)',
          glowWeak: 'rgba(110, 231, 183, 0.55)',
        }
      : tone === 'legendary'
      ? {
          primary: 'from-yellow-500 via-amber-400 to-orange-500',
          secondary: 'from-yellow-300 to-amber-300',
          text: 'text-yellow-400',
          particles: ['bg-yellow-400', 'bg-amber-400', 'bg-orange-400', 'bg-yellow-300'],
          glowColor: 'rgba(251, 191, 36, 0.8)',
          glowWeak: 'rgba(251, 191, 36, 0.6)',
        }
      : {
          primary: 'from-violet-600 via-purple-500 to-pink-500',
          secondary: 'from-purple-400 via-violet-400 to-pink-400',
          text: 'text-purple-400',
          particles: ['bg-violet-400', 'bg-purple-400', 'bg-pink-400', 'bg-fuchsia-400', 'bg-cyan-400'],
          glowColor: 'rgba(168, 85, 247, 0.8)',
          glowWeak: 'rgba(168, 85, 247, 0.6)',
        };

  const isSecret = tone === 'secret';
  const displayName = resolveCardPokemonName(card);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          phase === 'buildup'
            ? 'bg-black/40'
            : phase === 'flash'
            ? 'bg-white'
            : `bg-gradient-to-br ${colors.primary} opacity-20`
        }`}
      />

      {phase === 'buildup' && (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 opacity-50"
              style={{
                borderColor: colors.glowColor.slice(0, -3),
                width: `${100 + i * 150}px`,
                height: `${100 + i * 150}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `pulse-ring ${2 + i * 0.3}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </>
      )}

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
                  boxShadow: `0 0 ${size * 2}px ${size}px currentColor`,
                }}
              />
            );
          })}
        </div>
      )}

      {isSecret && phase === 'buildup' && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `lightning-flash 0.3s ease-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <Zap className="text-purple-400" size={30 + Math.random() * 40} style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }} />
            </div>
          ))}
        </>
      )}

      {phase === 'buildup' && (
        <div
          className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${colors.primary} animate-pulse`}
          style={{
            boxShadow: `0 0 60px 30px ${colors.glowWeak}`,
            animation: 'energy-pulse 0.5s ease-in-out infinite',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
        </div>
      )}

      {phase === 'flash' && <div className="absolute inset-0 bg-white" style={{ animation: 'flash-fade 0.5s ease-out forwards' }} />}

      {(phase === 'reveal' || phase === 'complete') && (
        <div className="relative z-10 flex flex-col items-center">
          <div className={`absolute w-80 h-80 rounded-full bg-gradient-to-br ${colors.secondary} blur-3xl opacity-60`} style={{ animation: 'aura-pulse 2s ease-in-out infinite' }} />

          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'slow-spin 10s linear infinite' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute" style={{ transform: `rotate(${i * 45}deg) translateY(-140px)` }}>
                  {tone !== 'secret' ? <Star className={`${colors.text} w-6 h-6`} fill="currentColor" /> : <Sparkles className={`${colors.text} w-6 h-6`} />}
                </div>
              ))}
            </div>

            <div
              className={`relative ${card.is_shiny ? 'animate-shiny-glow' : ''}`}
              style={{
                filter: `drop-shadow(0 0 30px ${colors.glowColor})`,
                animation: phase === 'complete' ? 'pokemon-float 3s ease-in-out infinite' : 'pokemon-entrance 1s ease-out',
              }}
            >
              <img 
                src={getSprite(card)}
                alt={displayName}
                className="w-64 h-64 object-contain pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {tone !== 'secret' && phase === 'complete' && (
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 animate-bounce z-20">
                <Crown className="w-12 h-12 text-yellow-400" fill="currentColor" />
              </div>
            )}
          </div>

          {phase === 'complete' && (
            <div className="mt-8 text-center">
              <h2 
                className={`text-4xl md:text-5xl font-bold capitalize ${colors.text} drop-shadow-lg`}
                style={{
                  textShadow: `0 0 20px ${colors.glowColor}`
                }}
              >
                {displayName}
              </h2>

              <div className={`mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r ${colors.primary} text-white font-bold text-lg shadow-lg`}>
                {tone === 'starter' ? (
                  <>
                    <Star className="w-5 h-5" />
                    STARTER
                    <Star className="w-5 h-5" />
                  </>
                ) : tone === 'legendary' ? (
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

              {card.is_shiny && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold animate-pulse">
                  ✨ SHINY ✨
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
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
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 1; }
        }
        @keyframes lightning-flash {
          0%, 90%, 100% { opacity: 0; }
          5%, 15% { opacity: 1; }
          10% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

/* ===== MULTI CARD REVEAL (5-card packs) ===== */
const MultiCardReveal = ({
  cards,
  packName,
  packTypeId,
  onClose,
  packArtwork,
}: {
  cards: PackCard[];
  packName: string;
  packTypeId?: string;
  onClose: () => void;
  packArtwork?: string;
}) => {
  const { t } = useTranslation('modals');
  const [phase, setPhase] = useState<'cinema' | 'explosion' | 'deck' | 'done'>('cinema');
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const closeTimerRef = useRef<number | null>(null);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 1500);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const artworkSrc = packArtwork || (() => {
    if (packTypeId && PACK_ARTWORK_MAP[packTypeId]) {
      return PACK_ARTWORK_MAP[packTypeId];
    }

    const normalized = packName.toLowerCase().replace(/\s+/g, '_');
    for (const [key, src] of Object.entries(PACK_ARTWORK_MAP)) {
      if (normalized.includes(key)) return src;
    }
    return '/packs/brasacomum.png';
  })();

  // Cinema phase: increasing shake over 2s
  useEffect(() => {
    if (phase !== 'cinema') return;
    let frame: number;
    const start = Date.now();
    const CINEMA_DURATION = 2000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / CINEMA_DURATION, 1);
      setShakeIntensity(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase('explosion');
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Explosion → deck transition
  useEffect(() => {
    if (phase !== 'explosion') return;
    const timer = setTimeout(() => {
      setPhase('deck');
      revealNextCard(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [phase]);

  const revealNextCard = useCallback(
    (index: number) => {
      if (index >= cards.length) {
        setPhase('done');
        scheduleClose();
        return;
      }
      setRevealedIndex(index);
      const card = cards[index];
      const isHighRarity = ['rare', 'pseudo', 'legendary', 'secret'].includes(card.rarity);
      const delay = isHighRarity ? 1000 : 700;
      setTimeout(() => revealNextCard(index + 1), delay);
    },
    [cards, scheduleClose]
  );

  const RARITY_BG: Record<string, string> = {
    common: 'from-green-500/20 to-green-700/20 border-green-400/50',
    uncommon: 'from-blue-500/20 to-blue-700/20 border-blue-400/50',
    rare: 'from-purple-500/20 to-purple-700/20 border-purple-400/60',
    pseudo: 'from-orange-500/20 to-orange-700/20 border-orange-400/60',
    starter: 'from-yellow-500/20 to-yellow-700/20 border-yellow-400/50',
    legendary: 'from-yellow-400/30 to-amber-600/30 border-yellow-400/70',
    secret: 'from-violet-500/30 to-fuchsia-600/30 border-violet-400/80',
  };

  const RARITY_BADGE_COLORS: Record<string, string> = {
    common: 'bg-green-100 text-green-800 border-green-300',
    uncommon: 'bg-blue-100 text-blue-800 border-blue-300',
    rare: 'bg-purple-100 text-purple-800 border-purple-300',
    pseudo: 'bg-orange-100 text-orange-800 border-orange-300',
    starter: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-400',
    secret: 'bg-gradient-to-r from-violet-400 to-violet-600 text-white border-violet-400',
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* ===== CINEMA PHASE ===== */}
      {phase === 'cinema' && (
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)',
              animation: 'mc-energy-pulse 0.8s ease-in-out infinite',
            }}
          />
          <div
            className="relative"
            style={{
              animation: `mc-pack-shake ${Math.max(0.07, 0.15 - shakeIntensity * 0.08)}s ease-in-out infinite`,
              transform: `scale(${1 + shakeIntensity * 0.15})`,
              transition: 'transform 0.1s',
            }}
          >
            <img
              src={artworkSrc}
              alt={packName}
              className="w-48 h-72 sm:w-56 sm:h-80 object-contain drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]"
            />
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                boxShadow: `0 0 ${30 + shakeIntensity * 60}px ${10 + shakeIntensity * 30}px rgba(251,191,36,${0.2 + shakeIntensity * 0.4})`,
              }}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(Math.floor(shakeIntensity * 30))].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-amber-400"
                style={{
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  left: `${40 + Math.random() * 20}%`,
                  top: `${30 + Math.random() * 40}%`,
                  animation: `mc-sparkle-rise ${1 + Math.random() * 2}s ease-out infinite`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===== EXPLOSION PHASE ===== */}
      {phase === 'explosion' && (
        <div className="absolute inset-0 z-20 bg-white" style={{ animation: 'mc-flash 0.6s ease-out forwards' }} />
      )}

      {/* ===== DECK REVEAL PHASE ===== */}
      {(phase === 'deck' || phase === 'done') && (
        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wide text-center text-white mb-4 sm:mb-6 drop-shadow-lg">
            {packName}
          </h2>

          {/* Cards grid - no overlap */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {cards.map((card, index) => {
              const isRevealed = index <= revealedIndex;
              const isCurrent = index === revealedIndex;
              const rarityBg = RARITY_BG[card.rarity] || RARITY_BG.common;
              const badgeColors = RARITY_BADGE_COLORS[card.rarity] || RARITY_BADGE_COLORS.common;
              const isHighRarity = ['rare', 'pseudo', 'legendary', 'secret'].includes(card.rarity);
              const displayName = resolveCardPokemonName(card);

              return (
                <div
                  key={index}
                  className="relative"
                  style={{
                    width: 'clamp(130px, 17vw, 160px)',
                    opacity: isRevealed ? 1 : index === revealedIndex + 1 ? 0.15 : 0,
                    transform: isRevealed
                      ? isCurrent
                        ? 'translateY(0) scale(1.05)'
                        : 'translateY(0) scale(1)'
                      : 'translateY(60px) scale(0.8)',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    zIndex: isCurrent ? 20 : 10,
                  }}
                >
                  {/* Glow behind card for high rarity */}
                  {isRevealed && isHighRarity && (
                    <div
                      className="absolute -inset-3 rounded-2xl blur-xl opacity-60 pointer-events-none"
                      style={{
                        background: card.rarity === 'legendary'
                          ? 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, transparent 70%)'
                          : card.rarity === 'secret'
                          ? 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)'
                          : card.rarity === 'pseudo'
                          ? 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
                        animation: 'mc-glow-pulse 2s ease-in-out infinite',
                      }}
                    />
                  )}

                  {/* Card body - matches PokemonCard style */}
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 bg-gradient-to-br ${rarityBg} backdrop-blur-sm shadow-xl`}
                    style={{
                      animation: isCurrent ? 'mc-card-entrance 0.5s cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
                    }}
                  >
                    <div className="p-3 sm:p-4 flex flex-col items-center">
                      {/* Shiny badge */}
                      {card.is_shiny && isRevealed && (
                        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-lg animate-pulse border border-yellow-600">
                          ✨ SHINY
                        </div>
                      )}

                      {/* Rarity badge */}
                      {isRevealed && (
                        <div className={`absolute top-1.5 right-1.5 ${badgeColors} text-[9px] font-bold px-2 py-0.5 rounded-full border z-10`}>
                          {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                        </div>
                      )}

                      {/* Dex number */}
                      <p className="text-[10px] text-white/50 font-mono mb-1">
                        #{card.pokemon_id.toString().padStart(3, '0')}
                      </p>

                      {/* Sprite container */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-2">
                        {isRevealed ? (
                          <img
                            src={getSprite(card)}
                            alt={displayName}
                            className={`w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${card.is_shiny ? 'animate-pulse' : ''}`}
                            style={{
                              imageRendering: 'pixelated',
                              animation: isCurrent ? 'mc-sprite-pop 0.4s ease-out' : undefined,
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl text-white/20">?</span>
                          </div>
                        )}

                        {/* Sparkle effects for legendary/secret */}
                        {isRevealed && isHighRarity && (
                          <>
                            <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                            <div className="absolute top-2 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                            <div className="absolute bottom-2 left-2 w-1 h-1 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                          </>
                        )}
                      </div>

                      {/* Pokemon name */}
                      <h3 className="text-sm sm:text-base font-bold text-white capitalize truncate w-full text-center">
                        {isRevealed ? displayName : '???'}
                      </h3>
                    </div>

                    {/* Holographic shimmer on reveal */}
                    {isRevealed && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 70%)',
                          animation: 'mc-shimmer 2.5s ease-in-out infinite',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* "All revealed" flash */}
          {phase === 'done' && (
            <div className="mt-6 text-center">
              <p className="text-white/80 text-sm font-medium animate-pulse">
                {t('packs.allRevealed', { defaultValue: '✨ All cards revealed!' })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ambient particles */}
      {(phase === 'deck' || phase === 'done') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-amber-300/60"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `mc-sparkle-rise ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes mc-pack-shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-3px) translateY(1px); }
          50% { transform: translateX(3px) translateY(-1px); }
          75% { transform: translateX(-2px) translateY(2px); }
        }
        @keyframes mc-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes mc-energy-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes mc-sparkle-rise {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-40px) scale(1.3); opacity: 0.9; }
        }
        @keyframes mc-card-entrance {
          0% { transform: translateY(80px) scale(0.6) rotateX(30deg); opacity: 0; }
          60% { transform: translateY(-8px) scale(1.08) rotateX(-3deg); opacity: 1; }
          100% { transform: translateY(0) scale(1) rotateX(0deg); opacity: 1; }
        }
        @keyframes mc-sprite-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes mc-shimmer {
          0% { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(200%) rotate(15deg); }
        }
        @keyframes mc-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};