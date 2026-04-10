import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Star, Sparkles, BookOpen, Calendar, MapPin, Trophy, Swords, Shield, Crown, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AVAILABLE_AVATARS } from '@/hooks/useProfile';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEmblemById } from '@/components/clan/ClanEmblems';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  nickname: string;
}

interface TeamSlotPokemon {
  pokemon_name: string;
  pokemon_id: number;
  level: number;
  power: number;
  star_rating: number;
  is_shiny: boolean;
  pokemon_type: string;
}

interface PublicProfile {
  profile: {
    nickname: string;
    avatar: string | null;
    level: number;
    experience_points: number;
    starter_pokemon: string | null;
    current_region: string;
    created_at: string;
  };
  pokedex_count: number;
  shiny_count: number;
  total_collected: number;
  rarest_pokemon: {
    pokemon_id: number;
    pokemon_name: string;
    rarity: string;
    is_shiny: boolean;
  } | null;
  rankings: {
    level_rank: number | null;
    pokedex_rank: number | null;
    shiny_rank: number | null;
  } | null;
  trainer_rankings: {
    highest_stage: number;
    highest_stage_rank: number | null;
    total_pokemon_defeated: number;
    defeated_rank: number | null;
  } | null;
  clan: {
    clan_name: string;
    clan_emblem: string;
    role: string;
  } | null;
  trainer_team: {
    slot_1: TeamSlotPokemon | null;
    slot_2: TeamSlotPokemon | null;
    slot_3: TeamSlotPokemon | null;
    pet_pokemon_name: string | null;
    pet_pokemon_id: number | null;
    pet_is_shiny: boolean;
    pet_rarity: string | null;
  } | null;
  achievements_count: number;
  badges: {
    slot_1: { name: string; icon_url: string | null; type: string } | null;
    slot_2: { name: string; icon_url: string | null; type: string } | null;
    slot_3: { name: string; icon_url: string | null; type: string } | null;
  } | null;
}

const RARITY_COLORS: Record<string, string> = {
  secret: 'from-violet-500 to-purple-600',
  legendary: 'from-yellow-500 to-amber-600',
  pseudo: 'from-blue-500 to-indigo-600',
  starter: 'from-green-500 to-emerald-600',
  rare: 'from-sky-500 to-cyan-600',
  uncommon: 'from-teal-500 to-green-600',
  common: 'from-gray-400 to-gray-500',
};

const RARITY_LABELS: Record<string, string> = {
  secret: '🔮 Secreto',
  legendary: '⭐ Lendário',
  pseudo: '💎 Pseudo-lendário',
  starter: '🌱 Starter',
  rare: '💠 Raro',
  uncommon: '🟢 Incomum',
  common: '⚪ Comum',
};

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn',
  sinnoh: 'Sinnoh', unova: 'Unova', kalos: 'Kalos',
};

const ROLE_LABELS: Record<string, string> = {
  leader: 'Líder', vice_leader: 'Vice-Líder', member: 'Membro',
};

const getPokemonSprite = (id: number, isShiny: boolean) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  return isShiny ? `${base}/shiny/${id}.png` : `${base}/${id}.png`;
};

const getAvatarSrc = (avatarId: string | null): string => {
  if (!avatarId) return AVAILABLE_AVATARS[0].src;
  return AVAILABLE_AVATARS.find(a => a.id === avatarId)?.src || AVAILABLE_AVATARS[0].src;
};

export function PlayerProfileModal({ isOpen, onClose, userId, nickname }: PlayerProfileModalProps) {
  const { i18n } = useTranslation();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = i18n.language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setData(null);

    supabase.rpc('get_public_profile', { p_user_id: userId })
      .then(({ data: result, error }) => {
        if (!error && result && !(result as any).error) {
          setData(result as unknown as PublicProfile);
        }
        setLoading(false);
      });
  }, [isOpen, userId]);

  const profile = data?.profile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12 px-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : !data || !profile ? (
          <div className="text-center py-12 px-6 text-muted-foreground">
            <p>Perfil não encontrado</p>
          </div>
        ) : (
          <>
            {/* Header Card */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-5 pb-4">
              <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-3 top-3 h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive z-10">
                <X className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-background shadow-lg flex-shrink-0">
                  <AvatarImage src={getAvatarSrc(profile.avatar)} />
                  <AvatarFallback className="bg-muted text-2xl font-bold">
                    {profile.nickname[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">{profile.nickname}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary">Nv. {profile.level}</Badge>
                    {data.clan && (
                      <Badge variant="outline" className="gap-1">
                        <img src={getEmblemById(data.clan.clan_emblem).image} className="w-3.5 h-3.5" alt="" />
                        {data.clan.clan_name}
                      </Badge>
                    )}
                  </div>
                  {/* Equipped Badges */}
                  {data.badges && (data.badges.slot_1 || data.badges.slot_2 || data.badges.slot_3) && (
                    <div className="flex gap-1.5 mt-2">
                      {[data.badges.slot_1, data.badges.slot_2, data.badges.slot_3].filter(Boolean).map((badge, i) => (
                        <div key={i} className="flex items-center gap-1 bg-background/60 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border">
                          {badge!.icon_url && <img src={badge!.icon_url} className="w-3 h-3" alt="" />}
                          {badge!.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="stats" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
                <TabsTrigger value="stats" className="text-xs gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Vitrine
                </TabsTrigger>
                <TabsTrigger value="team" className="text-xs gap-1">
                  <Swords className="w-3.5 h-3.5" /> Time
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Info
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto px-5 pb-5 pt-3">
                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-0 space-y-4">
                  {/* Collection Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatBox icon={<BookOpen className="w-3.5 h-3.5" />} label="Pokédex" value={`${data.pokedex_count}/809`} />
                    <StatBox icon={<Sparkles className="w-3.5 h-3.5 text-yellow-500" />} label="Shinys" value={String(data.shiny_count)} />
                    <StatBox icon={<Star className="w-3.5 h-3.5 text-blue-500" />} label="Coletados" value={String(data.total_collected)} />
                  </div>

                  {/* Ranking Positions */}
                  {data.rankings && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3 h-3" /> Rankings
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <RankBox label="Nível" rank={data.rankings.level_rank} />
                        <RankBox label="Pokédex" rank={data.rankings.pokedex_rank} />
                        <RankBox label="Shiny" rank={data.rankings.shiny_rank} />
                      </div>
                    </div>
                  )}

                  {/* Trainer Rankings */}
                  {data.trainer_rankings && data.trainer_rankings.highest_stage > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Swords className="w-3 h-3" /> Modo Treinador
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                          <span className="text-xs text-muted-foreground">Maior Fase</span>
                          <span className="font-bold text-sm">{data.trainer_rankings.highest_stage}</span>
                          {data.trainer_rankings.highest_stage_rank && (
                            <Badge variant="outline" className="text-[10px]">#{data.trainer_rankings.highest_stage_rank}</Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                          <span className="text-xs text-muted-foreground">Derrotados</span>
                          <span className="font-bold text-sm">{data.trainer_rankings.total_pokemon_defeated.toLocaleString()}</span>
                          {data.trainer_rankings.defeated_rank && (
                            <Badge variant="outline" className="text-[10px]">#{data.trainer_rankings.defeated_rank}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {data.achievements_count > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <Award className="w-5 h-5 text-amber-500" />
                      <div>
                        <span className="text-xs text-muted-foreground">Conquistas</span>
                        <p className="font-bold text-sm">{data.achievements_count} completadas</p>
                      </div>
                    </div>
                  )}

                  {/* Rarest Pokemon */}
                  {data.rarest_pokemon && <RarestPokemonCard rarest={data.rarest_pokemon} />}
                </TabsContent>

                {/* Team Tab */}
                <TabsContent value="team" className="mt-0 space-y-4">
                  {data.trainer_team && (data.trainer_team.slot_1 || data.trainer_team.slot_2 || data.trainer_team.slot_3) ? (
                    <>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time de Batalha</h4>
                      <div className="space-y-2">
                        {[data.trainer_team.slot_1, data.trainer_team.slot_2, data.trainer_team.slot_3].map((slot, i) => 
                          slot ? <TeamPokemonCard key={i} pokemon={slot} slot={i + 1} /> : null
                        )}
                      </div>
                      {data.trainer_team.pet_pokemon_id && (
                        <>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Pet</h4>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <img
                              src={getPokemonSprite(data.trainer_team.pet_pokemon_id, data.trainer_team.pet_is_shiny)}
                              alt={data.trainer_team.pet_pokemon_name || ''}
                              className="w-12 h-12 object-contain"
                            />
                            <div>
                              <p className="font-bold capitalize text-sm">
                                {data.trainer_team.pet_pokemon_name}
                                {data.trainer_team.pet_is_shiny && <span className="text-yellow-500 ml-1">✨</span>}
                              </p>
                              {data.trainer_team.pet_rarity && (
                                <Badge variant="outline" className="text-[10px] mt-0.5">
                                  {RARITY_LABELS[data.trainer_team.pet_rarity] || data.trainer_team.pet_rarity}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Swords className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Este treinador ainda não montou seu time</p>
                    </div>
                  )}
                </TabsContent>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-0 space-y-3">
                  <div className="space-y-3 text-sm">
                    <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Região atual" value={REGION_LABELS[profile.current_region] || profile.current_region} />
                    {profile.starter_pokemon && (
                      <InfoRow icon={<Star className="w-3.5 h-3.5" />} label="Starter" value={profile.starter_pokemon} capitalize />
                    )}
                    <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Jogando há" value={formatDistanceToNow(new Date(profile.created_at), { locale })} />
                    {data.clan && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <img src={getEmblemById(data.clan.clan_emblem).image} className="w-8 h-8" alt="" />
                        <div>
                          <p className="font-bold text-sm">{data.clan.clan_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {data.clan.role === 'leader' ? <Crown className="w-3 h-3" /> : data.clan.role === 'vice_leader' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {ROLE_LABELS[data.clan.role] || data.clan.role}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ── */

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border">
      {icon}
      <span className="font-bold text-sm">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function RankBox({ label, rank }: { label: string; rank: number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-muted/50 border border-border">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {rank ? (
        <span className={cn("font-bold text-sm", rank <= 3 && "text-yellow-500", rank > 3 && rank <= 10 && "text-blue-500")}>
          #{rank}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}

function TeamPokemonCard({ pokemon, slot }: { pokemon: TeamSlotPokemon; slot: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="relative">
        <img
          src={getPokemonSprite(pokemon.pokemon_id, pokemon.is_shiny)}
          alt={pokemon.pokemon_name}
          className="w-14 h-14 object-contain"
        />
        {pokemon.is_shiny && (
          <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold capitalize text-sm truncate">
          {pokemon.pokemon_name}
          {pokemon.is_shiny && <span className="text-yellow-500 ml-1">✨</span>}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px]">Nv. {pokemon.level}</Badge>
          <Badge variant="outline" className="text-[10px]">⚡ {pokemon.power}</Badge>
          <span className="text-[10px] text-muted-foreground">{'⭐'.repeat(Math.min(pokemon.star_rating, 5))}</span>
        </div>
      </div>
    </div>
  );
}

function RarestPokemonCard({ rarest }: { rarest: NonNullable<PublicProfile['rarest_pokemon']> }) {
  return (
    <div className={cn(
      "relative rounded-xl p-4 border overflow-hidden",
      "bg-gradient-to-br",
      RARITY_COLORS[rarest.rarity] || RARITY_COLORS.common,
      "bg-opacity-10"
    )}>
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative flex items-center gap-4">
        <div className={cn(
          "relative w-16 h-16 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br",
          RARITY_COLORS[rarest.rarity] || RARITY_COLORS.common,
          "bg-opacity-20"
        )}>
          <div className="absolute inset-0 rounded-lg bg-background/60" />
          <img
            src={getPokemonSprite(rarest.pokemon_id, rarest.is_shiny)}
            alt={rarest.pokemon_name}
            className="relative w-14 h-14 object-contain"
          />
          {rarest.is_shiny && (
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">Pokémon mais raro</p>
          <p className="font-bold capitalize text-base">
            {rarest.pokemon_name}
            {rarest.is_shiny && <span className="text-yellow-500 ml-1">✨</span>}
          </p>
          <Badge variant="outline" className="mt-1 text-[10px]">
            {RARITY_LABELS[rarest.rarity] || rarest.rarity}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, capitalize = false }: { icon: React.ReactNode; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span>{label}: <span className={cn("text-foreground font-medium", capitalize && "capitalize")}>{value}</span></span>
    </div>
  );
}
