import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Star, Sparkles, X, Crown } from "lucide-react";
import { useRankings } from "@/hooks/useRankings";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { AVAILABLE_AVATARS } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { PlayerProfileModal } from "./PlayerProfileModal";

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RankingEntry {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  level: number;
  experience_points: number;
  level_rank: number | null;
  pokedex_count: number;
  pokedex_rank: number | null;
  shiny_count: number;
  shiny_rank: number | null;
  updated_at: string;
}

// ── Module-level helpers (stable across renders) ──

const getAvatarSrc = (avatarId: string | null): string => {
  if (!avatarId) return AVAILABLE_AVATARS[0].src;
  return AVAILABLE_AVATARS.find(a => a.id === avatarId)?.src || AVAILABLE_AVATARS[0].src;
};

const podiumPositionStyles = {
  1: "bg-gradient-to-b from-yellow-400/30 to-yellow-600/20 border-yellow-500 ring-yellow-400/50",
  2: "bg-gradient-to-b from-gray-300/30 to-gray-400/20 border-gray-400 ring-gray-300/50",
  3: "bg-gradient-to-b from-orange-400/30 to-orange-600/20 border-orange-500 ring-orange-400/50",
} as const;

const crownColors = { 1: "text-yellow-500", 2: "text-gray-400", 3: "text-orange-500" } as const;
const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;

// ── Module-level components (won't remount on parent state change) ──

function PodiumEntryCard({
  entry, position, height, isMe, onClickPlayer, yourLabel, displayValue,
}: {
  entry: RankingEntry | undefined;
  position: 1 | 2 | 3;
  height: string;
  isMe: boolean;
  onClickPlayer: (userId: string, nickname: string) => void;
  yourLabel: string;
  displayValue: string;
}) {
  if (!entry) return <div className={cn("w-20 sm:w-24", height)} />;
  return (
    <div
      className={cn("flex flex-col items-center cursor-pointer", position === 1 ? "order-2" : position === 2 ? "order-1" : "order-3")}
      onClick={() => !isMe && onClickPlayer(entry.user_id, entry.nickname)}
    >
      {position === 1 && <Crown className={cn("w-6 h-6 mb-1 animate-bounce", crownColors[1])} />}
      <div className={cn("relative p-1 rounded-full ring-2 transition-all duration-300", podiumPositionStyles[position], isMe && "ring-4 ring-primary/70")}>
        <Avatar className={cn("border-2 border-background shadow-lg", position === 1 ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16")}>
          <AvatarImage src={getAvatarSrc(entry.avatar)} />
          <AvatarFallback className="text-lg font-bold bg-muted">{entry.nickname[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xl">{medals[position]}</span>
      </div>
      <div className={cn("mt-4 rounded-t-lg flex flex-col items-center justify-start pt-2 px-2 border-t-2", height, podiumPositionStyles[position], "w-20 sm:w-24")}>
        <span className={cn("font-bold text-xs sm:text-sm truncate max-w-full text-center", isMe && "text-primary")}>{entry.nickname}</span>
        <span className="text-xs text-muted-foreground mt-1">{displayValue}</span>
        {isMe && <Badge variant="default" className="mt-1 text-[10px] px-1">{yourLabel}</Badge>}
      </div>
    </div>
  );
}

function RankingCardItem({
  entry, rank, value, isMe, onClickPlayer, yourLabel,
}: {
  entry: RankingEntry;
  rank: number;
  value: string;
  isMe: boolean;
  onClickPlayer: (userId: string, nickname: string) => void;
  yourLabel: string;
}) {
  const style = rank <= 3 ? "" : rank <= 10 ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30" : "bg-card hover:bg-muted/50";
  return (
    <div
      onClick={() => !isMe && onClickPlayer(entry.user_id, entry.nickname)}
      className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] cursor-pointer", style, isMe && "ring-2 ring-primary bg-primary/10 border-primary/50")}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        <span className={cn("font-bold", rank <= 10 ? "text-primary" : "text-muted-foreground")}>{rank}</span>
      </div>
      <Avatar className="h-10 w-10 border-2 border-background shadow">
        <AvatarImage src={getAvatarSrc(entry.avatar)} />
        <AvatarFallback className="bg-muted">{entry.nickname[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium truncate", isMe && "text-primary font-bold")}>{entry.nickname}</span>
          {isMe && <Badge variant="secondary" className="text-[10px] shrink-0">{yourLabel}</Badge>}
        </div>
      </div>
      <div className="text-right font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    <div className="flex justify-center items-end gap-4 mb-6">
      <Skeleton className="h-24 w-20 rounded-lg" />
      <Skeleton className="h-32 w-24 rounded-lg" />
      <Skeleton className="h-20 w-20 rounded-lg" />
    </div>
    {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
  </div>
);

// ── Main component ──

export function RankingModal({ isOpen, onClose }: RankingModalProps) {
  const { t, i18n } = useTranslation('modals');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ userId: string; nickname: string } | null>(null);
  const {
    levelRankings, pokedexRankings, shinyRankings,
    loading, lastUpdate,
    getMyLevelPosition, getMyPokedexPosition, getMyShinyPosition,
    refreshRankings,
  } = useRankings();

  const totalPokemon = 809;

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      refreshRankings().then(() => setHasLoaded(true));
    }
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, hasLoaded, refreshRankings]);

  const locale = i18n.language === 'pt' ? ptBR : enUS;
  const myLevelPosition = getMyLevelPosition();
  const myPokedexPosition = getMyPokedexPosition();
  const myShinyPosition = getMyShinyPosition();
  const yourLabel = t('ranking.yourPosition');

  const handleClickPlayer = useCallback((userId: string, nickname: string) => {
    setSelectedPlayer({ userId, nickname });
  }, []);

  const renderPodium = (rankings: RankingEntry[], getRank: (e: RankingEntry) => number, getValue: (e: RankingEntry) => string) => {
    const top3 = rankings.filter(r => getRank(r) <= 3).sort((a, b) => getRank(a) - getRank(b));
    if (top3.length === 0) return null;
    const first = top3.find(r => getRank(r) === 1);
    const second = top3.find(r => getRank(r) === 2);
    const third = top3.find(r => getRank(r) === 3);
    return (
      <div className="flex justify-center items-end gap-2 sm:gap-4 mb-6 pt-4">
        <PodiumEntryCard entry={second} position={2} height="h-20 sm:h-24" isMe={user?.id === second?.user_id} onClickPlayer={handleClickPlayer} yourLabel={yourLabel} displayValue={second ? getValue(second) : ''} />
        <PodiumEntryCard entry={first} position={1} height="h-28 sm:h-32" isMe={user?.id === first?.user_id} onClickPlayer={handleClickPlayer} yourLabel={yourLabel} displayValue={first ? getValue(first) : ''} />
        <PodiumEntryCard entry={third} position={3} height="h-16 sm:h-20" isMe={user?.id === third?.user_id} onClickPlayer={handleClickPlayer} yourLabel={yourLabel} displayValue={third ? getValue(third) : ''} />
      </div>
    );
  };

  const renderList = (rankings: RankingEntry[], getRank: (e: RankingEntry) => number, getValue: (e: RankingEntry) => string) => {
    const rest = rankings.filter(r => getRank(r) > 3);
    if (rest.length === 0) return null;
    return (
      <div className="space-y-2">
        {rest.map(entry => (
          <RankingCardItem key={entry.id} entry={entry} rank={getRank(entry)} value={getValue(entry)} isMe={user?.id === entry.user_id} onClickPlayer={handleClickPlayer} yourLabel={yourLabel} />
        ))}
      </div>
    );
  };

  const UpdateInfo = () => (
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 px-1">
      <span className="flex items-center gap-1">
        <Trophy className="w-3 h-3" />
        {t('ranking.top50')}
      </span>
      {lastUpdate && (
        <span>
          {t('ranking.lastUpdate')}: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale })}
        </span>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent font-bold">
                {t('ranking.title')}
              </span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>

          <Tabs defaultValue="level" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50">
              <TabsTrigger value="level" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">{t('ranking.levelTab')}</span>
                <span className="sm:hidden">Nível</span>
                {myLevelPosition && myLevelPosition <= 50 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">#{myLevelPosition}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="pokedex" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20">
                <Star className="w-4 h-4 text-green-500" />
                <span className="hidden sm:inline">{t('ranking.pokedexTab')}</span>
                <span className="sm:hidden">Pokédex</span>
                {myPokedexPosition && myPokedexPosition <= 50 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">#{myPokedexPosition}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="shiny" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/20 data-[state=active]:to-amber-500/20">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="hidden sm:inline">{t('ranking.shinyTab')}</span>
                <span className="sm:hidden">Shiny</span>
                {myShinyPosition && myShinyPosition <= 50 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">#{myShinyPosition}</Badge>}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4 px-1">
              <TabsContent value="level" className="mt-0 h-full">
                {loading ? <LoadingSkeleton /> : (
                  <>
                    <UpdateInfo />
                    {renderPodium(levelRankings, e => e.level_rank || 0, e => `Nv. ${e.level}`)}
                    {renderList(levelRankings, e => e.level_rank || 0, e => `Nv. ${e.level}`)}
                  </>
                )}
              </TabsContent>

              <TabsContent value="pokedex" className="mt-0 h-full">
                {loading ? <LoadingSkeleton /> : (
                  <>
                    <UpdateInfo />
                    {renderPodium(pokedexRankings, e => e.pokedex_rank || 0, e => `${e.pokedex_count}/${totalPokemon}`)}
                    {renderList(pokedexRankings, e => e.pokedex_rank || 0, e => `${e.pokedex_count}/${totalPokemon}`)}
                  </>
                )}
              </TabsContent>

              <TabsContent value="shiny" className="mt-0 h-full">
                {loading ? <LoadingSkeleton /> : shinyRankings.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400/50" />
                    <p>Nenhum jogador tem Shinys colados na Pokédex ainda</p>
                  </div>
                ) : (
                  <>
                    <UpdateInfo />
                    {renderPodium(shinyRankings, e => e.shiny_rank || 0, e => `✨ ${e.shiny_count}`)}
                    {renderList(shinyRankings, e => e.shiny_rank || 0, e => `✨ ${e.shiny_count}`)}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PlayerProfileModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        userId={selectedPlayer?.userId || ''}
        nickname={selectedPlayer?.nickname || ''}
      />
    </>
  );
}
