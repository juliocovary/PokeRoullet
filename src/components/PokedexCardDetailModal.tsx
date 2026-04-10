import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePokemon } from '@/hooks/usePokemon';
import { TYPE_COLORS, getWeaknesses, getStrengths } from '@/data/typeAdvantages';
import { getPokemonTypes } from '@/data/pokemonTypes';
import { getPokemonById } from '@/data/trainerPokemonPool';
import { TypeBadge } from '@/components/TypeBadge';
import { Crown, Sparkles, Star, X, Shield, Sword, Heart, ScanLine, Radar, Activity, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import { toast } from '@/hooks/use-toast';
import { getRegionNameByPokemonId } from '@/data/regionPacks';

interface PokedexCardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonId: number;
  pokemonData: {
    name: string;
    rarity: string;
    isShiny: boolean;
    placedAt: string;
  };
  isFavorite?: boolean;
  onToggleFavorite?: () => boolean;
}

// Helper functions

const getOfficialArtwork = (id: number, isShiny: boolean): string => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
  return isShiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const seededStat = (seed: number, min: number, max: number) => {
  const x = Math.abs(Math.sin(seed) * 10000);
  const normalized = x - Math.floor(x);
  return Math.round(min + normalized * (max - min));
};

const buildPokedexStats = (pokemonId: number) => {
  const trainerData = getPokemonById(pokemonId);
  const basePower = trainerData?.basePower ?? (220 + (pokemonId % 90) * 8);
  const starBonus = (trainerData?.starRating ?? 2) * 6;

  const hp = clamp(Math.round(basePower / 8 + starBonus + seededStat(pokemonId * 0.9, 8, 26)), 45, 255);
  const atk = clamp(Math.round(basePower / 10 + starBonus + seededStat(pokemonId * 1.7, 8, 24)), 40, 230);
  const def = clamp(Math.round(basePower / 11 + starBonus + seededStat(pokemonId * 2.3, 8, 22)), 35, 220);
  const spAtk = clamp(Math.round(basePower / 10.5 + starBonus + seededStat(pokemonId * 2.9, 10, 24)), 35, 230);
  const speed = clamp(Math.round(basePower / 12 + starBonus + seededStat(pokemonId * 3.5, 10, 28)), 30, 220);

  return [
    { key: 'hp', label: 'HP', value: hp, color: 'linear-gradient(90deg, rgba(34,197,94,0.85), rgba(132,204,22,0.9))', icon: Activity },
    { key: 'atk', label: 'ATK', value: atk, color: 'linear-gradient(90deg, rgba(239,68,68,0.85), rgba(249,115,22,0.9))', icon: Sword },
    { key: 'def', label: 'DEF', value: def, color: 'linear-gradient(90deg, rgba(59,130,246,0.85), rgba(14,165,233,0.9))', icon: Shield },
    { key: 'spAtk', label: 'SP.ATK', value: spAtk, color: 'linear-gradient(90deg, rgba(168,85,247,0.85), rgba(236,72,153,0.9))', icon: Flame },
    { key: 'speed', label: 'SPD', value: speed, color: 'linear-gradient(90deg, rgba(45,212,191,0.85), rgba(56,189,248,0.9))', icon: Radar }
  ];
};

// Rarity configurations
const RARITY_CONFIG: Record<string, {
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  icon: React.ReactNode;
  label: string;
  auraClass?: string;
}> = {
  common: {
    bgGradient: 'from-slate-800 via-slate-700 to-slate-800',
    borderColor: 'border-slate-500',
    glowColor: '',
    icon: null,
    label: 'Common'
  },
  uncommon: {
    bgGradient: 'from-slate-700 via-slate-600 to-slate-700',
    borderColor: 'border-slate-400',
    glowColor: '',
    icon: null,
    label: 'Uncommon'
  },
  rare: {
    bgGradient: 'from-blue-900 via-blue-800 to-blue-900',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]',
    icon: <Star className="h-4 w-4 text-blue-400" fill="currentColor" />,
    label: 'Rare'
  },
  starter: {
    bgGradient: 'from-emerald-900 via-emerald-800 to-emerald-900',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-[0_0_30px_rgba(52,211,153,0.4)]',
    icon: <Star className="h-4 w-4 text-emerald-400" fill="currentColor" />,
    label: 'Starter'
  },
  pseudo: {
    bgGradient: 'from-purple-900 via-purple-800 to-purple-900',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-[0_0_40px_rgba(147,51,234,0.5)]',
    icon: <Sparkles className="h-4 w-4 text-purple-400" />,
    label: 'Pseudo'
  },
  legendary: {
    bgGradient: 'from-amber-900 via-yellow-800 to-amber-900',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-[0_0_50px_rgba(251,191,36,0.6)]',
    icon: <Crown className="h-4 w-4 text-amber-400" fill="currentColor" />,
    label: 'Legendary',
    auraClass: 'animate-pulse'
  },
  secret: {
    bgGradient: 'from-fuchsia-900 via-pink-800 to-violet-900',
    borderColor: 'border-fuchsia-400',
    glowColor: 'shadow-[0_0_60px_rgba(236,72,153,0.6)]',
    icon: <Sparkles className="h-4 w-4 text-fuchsia-400" />,
    label: 'Secret',
    auraClass: 'animate-pulse'
  }
};

export const PokedexCardDetailModal = ({
  isOpen,
  onClose,
  pokemonId,
  pokemonData,
  isFavorite = false,
  onToggleFavorite
}: PokedexCardDetailModalProps) => {
  const { t } = useTranslation('modals');
  const { GEN1_POKEMON } = usePokemon();
  const [isFavoriteLocal, setIsFavoriteLocal] = useState(isFavorite);
  const [showScan, setShowScan] = useState(false);
  const [scanCycle, setScanCycle] = useState(0);
  const stats = useMemo(() => buildPokedexStats(pokemonId), [pokemonId]);

  useEffect(() => {
    if (!isOpen) {
      setShowScan(false);
      return;
    }

    setScanCycle((prev) => prev + 1);
    setShowScan(true);

    const timeout = window.setTimeout(() => setShowScan(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [isOpen, pokemonId]);

  useEffect(() => {
    setIsFavoriteLocal(isFavorite);
  }, [isFavorite, pokemonId]);
  
  const pokemon = GEN1_POKEMON.find(p => p.id === pokemonId);
  if (!pokemon) return null;
  
  const rarityConfig = RARITY_CONFIG[pokemonData.rarity] || RARITY_CONFIG.common;
  const region = getRegionNameByPokemonId(pokemonId);
  const artworkUrl = getOfficialArtwork(pokemonId, pokemonData.isShiny);
  
  // Get Pokemon types from the comprehensive type mapping
  const pokemonTypes = getPokemonTypes(pokemonId);
  const primaryType = pokemonTypes?.primary;
  const secondaryType = pokemonTypes?.secondary;
  
  // Get weaknesses and strengths
  const weaknesses = primaryType ? getWeaknesses(primaryType) : [];
  const strengths = primaryType ? getStrengths(primaryType) : [];
  
  // Format date based on current language
  const locale = i18n.language === 'pt' ? ptBR : enUS;
  const formattedDate = pokemonData.placedAt 
    ? format(new Date(pokemonData.placedAt), 'dd/MM/yyyy', { locale })
    : '-';

  const isPortuguese = i18n.language === 'pt';
  const descriptionText = isPortuguese
    ? `${pokemonData.name.charAt(0).toUpperCase()}${pokemonData.name.slice(1)} e um Pokemon da regiao de ${region}. Seus sinais energeticos apontam adaptacao de combate ${primaryType ? `do tipo ${primaryType}` : 'versatil'}, com resposta tatica elevada em ambientes hostis.`
    : `${pokemonData.name.charAt(0).toUpperCase()}${pokemonData.name.slice(1)} is a Pokemon from the ${region} region. Pokédex telemetry indicates a ${primaryType ? `${primaryType}-aligned` : 'versatile'} combat profile with high tactical adaptation in hostile scenarios.`;

  const handleFavorite = () => {
    let nextFavorite = !isFavoriteLocal;

    if (onToggleFavorite) {
      nextFavorite = onToggleFavorite();
    }

    setIsFavoriteLocal(nextFavorite);

    toast({
      title: nextFavorite
        ? t('pokedexDetail.favoriteRemoved', 'Removido dos favoritos')
        : t('pokedexDetail.favoriteAdded', 'Adicionado aos favoritos'),
      description: `#${pokemonId.toString().padStart(3, '0')} ${pokemonData.name}`
    });
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      className="w-[96vw] max-w-6xl h-[92dvh] max-h-[92dvh] sm:h-[90vh] p-0 border-red-600/60"
    >
      <div className={`pokedex-font pokedex-detail-shell pokedex-detail-enter relative flex h-full flex-col overflow-hidden rounded-2xl ${rarityConfig.glowColor}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(227,53,13,0.24),transparent_36%),radial-gradient(circle_at_88%_82%,rgba(34,211,238,0.16),transparent_40%)]" />

        <header className="relative z-20 flex items-center justify-between gap-2 border-b border-red-500/30 bg-gradient-to-r from-[#130809] via-[#2b0a0b] to-[#0a0f16] px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-8 w-8 rounded-full border-2 border-cyan-300/70 bg-cyan-400/25 shadow-[0_0_16px_rgba(34,211,238,0.5)]" />
              <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
              <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/90">Pokedex</p>
              <h2 className="truncate text-base font-bold tracking-[0.08em] text-white sm:text-xl sm:tracking-[0.12em]">
                #{pokemonId.toString().padStart(3, '0')} {pokemonData.name}
              </h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close pokedex detail"
            className="h-9 w-9 rounded-full border border-red-400/50 bg-black/35 text-white transition-all duration-200 hover:scale-105 hover:bg-red-500/25 hover:shadow-[0_0_18px_rgba(239,68,68,0.45)]"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="relative z-10 grid flex-1 min-h-0 gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4 lg:grid-cols-[1.05fr_1fr]">
          <section className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-red-500/30 bg-black/45 shadow-[inset_0_0_35px_rgba(0,0,0,0.45)] sm:min-h-[300px]">
            <div className="pokedex-grid-bg absolute inset-0 opacity-75" />

            {(pokemonData.rarity === 'legendary' || pokemonData.rarity === 'secret') && (
              <div
                className={`absolute inset-0 ${
                  pokemonData.rarity === 'legendary'
                    ? 'bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.2),transparent_58%)]'
                    : 'bg-[radial-gradient(circle_at_center,rgba(232,121,249,0.18),transparent_58%)]'
                } ${rarityConfig.auraClass ?? ''}`}
              />
            )}

            <div className={`relative z-10 flex h-60 w-60 items-center justify-center rounded-full border-2 ${rarityConfig.borderColor} bg-black/55 shadow-[inset_0_0_22px_rgba(0,0,0,0.45)] sm:h-80 sm:w-80`}>
              {primaryType && (
                <div
                  className="absolute inset-6 rounded-full opacity-30 blur-2xl"
                  style={{ backgroundColor: TYPE_COLORS[primaryType] }}
                />
              )}

              <img
                src={artworkUrl}
                alt={pokemonData.name}
                className="relative z-20 h-48 w-48 object-contain drop-shadow-[0_16px_26px_rgba(0,0,0,0.65)] sm:h-64 sm:w-64"
                style={{ filter: pokemonData.isShiny ? 'drop-shadow(0 0 14px rgba(255, 215, 0, 0.55))' : undefined }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = pokemon.sprite;
                }}
              />

              {showScan && (
                <div className="pokedex-scan-overlay" aria-hidden="true" key={`${pokemonId}-${scanCycle}`}>
                  <div className="pokedex-scan-noise" />
                  <div className="pokedex-scan-pulse" />
                  <div className="pokedex-scan-beam" />
                  <div className="pokedex-scan-line" />
                  <div className="pokedex-scan-flare" />
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-lg border border-cyan-400/30 bg-black/50 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-cyan-200/85">
              <span className="inline-flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5" /> Scan complete</span>
              <span>{region}</span>
            </div>

            {pokemonData.isShiny && (
              <Badge className="absolute left-3 top-3 z-20 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-3 py-1 text-[11px] font-bold text-black shadow-lg">
                ✨ {t('pokedexDetail.shiny')}
              </Badge>
            )}
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-black/95 shadow-[inset_0_0_45px_rgba(6,182,212,0.12)]">
            <div className="border-b border-cyan-400/20 px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/75">Entry</p>
                  <h3 className="truncate text-xl font-bold capitalize tracking-wide text-white sm:text-2xl">{pokemonData.name}</h3>
                </div>
                <Badge className="border border-red-500/50 bg-red-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-red-200 sm:px-3 sm:text-[11px] sm:tracking-[0.12em]">
                  {rarityConfig.icon}
                  <span className="ml-1">{t(`rarities.${pokemonData.rarity}`)}</span>
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {primaryType && <TypeBadge type={primaryType} size="md" />}
                {secondaryType && <TypeBadge type={secondaryType} size="md" />}
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">Dex Description</p>
                <p className="leading-relaxed text-slate-100/90">{descriptionText}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-400">{t('pokedexDetail.region')}</span>
                  <span className="mt-1 block font-semibold text-white">{region}</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-400">{t('pokedexDetail.placedOn')}</span>
                  <span className="mt-1 block font-semibold text-white">{formattedDate}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-cyan-400/20 bg-cyan-950/15 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">Battle Stats</p>
                {stats.map((stat, index) => {
                  const percent = clamp((stat.value / 255) * 100, 4, 100);
                  const Icon = stat.icon;

                  return (
                    <div key={stat.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-cyan-300" />{stat.label}</span>
                        <span className="font-semibold text-white">{stat.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90">
                        <div
                          className="pokedex-stat-fill h-full rounded-full"
                          style={{
                            ['--fill' as string]: `${percent}%`,
                            ['--delay' as string]: `${index * 90 + 120}ms`,
                            background: stat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {primaryType && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {weaknesses.length > 0 && (
                    <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-red-300">
                        <Shield className="h-3.5 w-3.5" />
                        <span>{t('pokedexDetail.weakTo', 'Fraco contra')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {weaknesses.slice(0, 4).map((type) => (
                          <TypeBadge key={type} type={type} size="sm" showIcon={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {strengths.length > 0 && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-emerald-300">
                        <Sword className="h-3.5 w-3.5" />
                        <span>{t('pokedexDetail.strongAgainst', 'Forte contra')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {strengths.slice(0, 4).map((type) => (
                          <TypeBadge key={type} type={type} size="sm" showIcon={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="relative z-20 flex items-center justify-center border-t border-red-500/25 bg-black/45 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
          <Button
            onClick={handleFavorite}
            variant="outline"
            className={`h-11 w-full max-w-xs rounded-xl border-white/20 bg-white/5 text-white transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] sm:h-10 sm:w-auto ${isFavoriteLocal ? 'border-pink-400/60 text-pink-200' : ''}`}
          >
            <Heart className={`mr-1.5 h-4 w-4 ${isFavoriteLocal ? 'fill-current' : ''}`} />
            {isFavoriteLocal ? t('pokedexDetail.favorited', 'Favoritado') : t('pokedexDetail.favorite', 'Favoritar')}
          </Button>
        </footer>
      </div>
    </ResponsiveModal>
  );
};

export default PokedexCardDetailModal;
