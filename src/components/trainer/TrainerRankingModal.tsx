import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, Mountain, Swords, X, Crown } from "lucide-react";
import { useTrainerRankings } from "@/hooks/useTrainerRankings";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { AVAILABLE_AVATARS } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface TrainerRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TrainerRankingEntry {
  id: string;
  user_id: string;
  nickname: string;
  avatar: string | null;
  highest_stage: number;
  highest_stage_rank: number | null;
  total_pokemon_defeated: number;
  defeated_rank: number | null;
  updated_at: string;
}

export function TrainerRankingModal({ isOpen, onClose }: TrainerRankingModalProps) {
  const { t, i18n } = useTranslation('trainer');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const {
    stageRankings,
    defeatedRankings,
    loading,
    lastUpdate,
    getMyStagePosition,
    getMyDefeatedPosition,
    refreshRankings
  } = useTrainerRankings();

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      refreshRankings().then(() => setHasLoaded(true));
    }
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen, hasLoaded, refreshRankings]);

  const getAvatarSrc = (avatarId: string | null): string => {
    if (!avatarId) return AVAILABLE_AVATARS[0].src;
    const avatar = AVAILABLE_AVATARS.find(a => a.id === avatarId);
    return avatar?.src || AVAILABLE_AVATARS[0].src;
  };

  const locale = i18n.language === 'pt' ? ptBR : enUS;

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      <div className="flex justify-center items-end gap-4 mb-6">
        <Skeleton className="h-24 w-20 rounded-lg" />
        <Skeleton className="h-32 w-24 rounded-lg" />
        <Skeleton className="h-20 w-20 rounded-lg" />
      </div>
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );

  const myStagePosition = getMyStagePosition();
  const myDefeatedPosition = getMyDefeatedPosition();

  // Podium Component for Top 3
  const Podium = ({
    rankings,
    getRank,
    getValue,
  }: {
    rankings: TrainerRankingEntry[];
    getRank: (entry: TrainerRankingEntry) => number;
    getValue: (entry: TrainerRankingEntry) => string;
  }) => {
    const top3 = rankings.filter(r => getRank(r) <= 3).sort((a, b) => getRank(a) - getRank(b));
    if (top3.length === 0) return null;

    const first = top3.find(r => getRank(r) === 1);
    const second = top3.find(r => getRank(r) === 2);
    const third = top3.find(r => getRank(r) === 3);

    const PodiumEntry = ({
      entry,
      position,
      height
    }: {
      entry: TrainerRankingEntry | undefined;
      position: 1 | 2 | 3;
      height: string;
    }) => {
      if (!entry) return <div className={cn("w-20 sm:w-24", height)} />;
      const isMe = user?.id === entry.user_id;
      
      const positionStyles = {
        1: "bg-gradient-to-b from-yellow-400/30 to-yellow-600/20 border-yellow-500 ring-yellow-400/50",
        2: "bg-gradient-to-b from-gray-300/30 to-gray-400/20 border-gray-400 ring-gray-300/50",
        3: "bg-gradient-to-b from-orange-400/30 to-orange-600/20 border-orange-500 ring-orange-400/50"
      };
      
      const crownColors = {
        1: "text-yellow-500",
        2: "text-gray-400",
        3: "text-orange-500"
      };
      
      const medals = {
        1: "🥇",
        2: "🥈",
        3: "🥉"
      };

      return (
        <div className={cn(
          "flex flex-col items-center",
          position === 1 ? "order-2" : position === 2 ? "order-1" : "order-3"
        )}>
          {position === 1 && (
            <Crown className={cn("w-6 h-6 mb-1 animate-bounce", crownColors[1])} />
          )}
          
          <div className={cn(
            "relative p-1 rounded-full ring-2 transition-all duration-300",
            positionStyles[position],
            isMe && "ring-4 ring-primary/70"
          )}>
            <Avatar className={cn(
              "border-2 border-background shadow-lg",
              position === 1 ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"
            )}>
              <AvatarImage src={getAvatarSrc(entry.avatar)} />
              <AvatarFallback className="text-lg font-bold bg-muted">
                {entry.nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xl">
              {medals[position]}
            </span>
          </div>
          
          <div className={cn(
            "mt-4 rounded-t-lg flex flex-col items-center justify-start pt-2 px-2 border-t-2",
            height,
            positionStyles[position],
            "w-20 sm:w-24"
          )}>
            <span className={cn(
              "font-bold text-xs sm:text-sm truncate max-w-full text-center",
              isMe && "text-primary"
            )}>
              {entry.nickname}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {getValue(entry)}
            </span>
            {isMe && (
              <Badge variant="default" className="mt-1 text-[10px] px-1">
                {t('ranking.you', 'Você')}
              </Badge>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="flex justify-center items-end gap-2 sm:gap-4 mb-6 pt-4">
        <PodiumEntry entry={second} position={2} height="h-20 sm:h-24" />
        <PodiumEntry entry={first} position={1} height="h-28 sm:h-32" />
        <PodiumEntry entry={third} position={3} height="h-16 sm:h-20" />
      </div>
    );
  };

  // Ranking Card Component
  const RankingCard = ({
    entry,
    rank,
    value,
    isMe
  }: {
    entry: TrainerRankingEntry;
    rank: number;
    value: string;
    isMe: boolean;
  }) => {
    const getPositionStyle = (rank: number) => {
      if (rank <= 3) return "";
      if (rank <= 10) return "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30";
      return "bg-card hover:bg-muted/50";
    };

    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01]",
        getPositionStyle(rank),
        isMe && "ring-2 ring-primary bg-primary/10 border-primary/50"
      )}>
        <div className="w-8 h-8 flex items-center justify-center">
          <span className={cn(
            "font-bold",
            rank <= 10 ? "text-primary" : "text-muted-foreground"
          )}>
            {rank}
          </span>
        </div>
        
        <Avatar className="h-10 w-10 border-2 border-background shadow">
          <AvatarImage src={getAvatarSrc(entry.avatar)} />
          <AvatarFallback className="bg-muted">
            {entry.nickname[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate",
              isMe && "text-primary font-bold"
            )}>
              {entry.nickname}
            </span>
            {isMe && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {t('ranking.you', 'Você')}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right font-mono text-sm font-semibold">
          {value}
        </div>
      </div>
    );
  };

  // Render ranking list (excluding top 3)
  const RankingList = ({
    rankings,
    getRank,
    getValue
  }: {
    rankings: TrainerRankingEntry[];
    getRank: (entry: TrainerRankingEntry) => number;
    getValue: (entry: TrainerRankingEntry) => string;
  }) => {
    const rest = rankings.filter(r => getRank(r) > 3);
    if (rest.length === 0) return null;

    return (
      <div className="space-y-2">
        {rest.map(entry => {
          const rank = getRank(entry);
          const isMe = user?.id === entry.user_id;
          return (
            <RankingCard
              key={entry.id}
              entry={entry}
              rank={rank}
              value={getValue(entry)}
              isMe={isMe}
            />
          );
        })}
      </div>
    );
  };

  const UpdateInfo = () => (
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 px-1">
      <span className="flex items-center gap-1">
        <Trophy className="w-3 h-3" />
        Top 50
      </span>
      {lastUpdate && (
        <span>
          {t('ranking.lastUpdate', 'Última atualização')}: {formatDistanceToNow(lastUpdate, {
            addSuffix: true,
            locale
          })}
        </span>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
              {t('ranking.title', 'Ranking Treinador')}
            </span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="stage" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
            <TabsTrigger
              value="stage"
              className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20"
            >
              <Mountain className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">{t('ranking.stageTab', 'Maior Fase')}</span>
              <span className="sm:hidden">Fase</span>
              {myStagePosition && myStagePosition <= 50 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  #{myStagePosition}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="defeated"
              className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-orange-500/20"
            >
              <Swords className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">{t('ranking.defeatedTab', 'Pokémon Derrotados')}</span>
              <span className="sm:hidden">Derrotados</span>
              {myDefeatedPosition && myDefeatedPosition <= 50 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  #{myDefeatedPosition}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4 px-1">
            <TabsContent value="stage" className="mt-0 h-full">
              {loading ? (
                <LoadingSkeleton />
              ) : stageRankings.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Mountain className="w-12 h-12 mx-auto mb-4 text-purple-400/50" />
                  <p>{t('ranking.noStageRankings', 'Nenhum treinador completou fases ainda')}</p>
                </div>
              ) : (
                <>
                  <UpdateInfo />
                  <Podium
                    rankings={stageRankings}
                    getRank={e => e.highest_stage_rank || 0}
                    getValue={e => e.highest_stage.toString()}
                  />
                  <RankingList
                    rankings={stageRankings}
                    getRank={e => e.highest_stage_rank || 0}
                    getValue={e => e.highest_stage.toString()}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="defeated" className="mt-0 h-full">
              {loading ? (
                <LoadingSkeleton />
              ) : defeatedRankings.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Swords className="w-12 h-12 mx-auto mb-4 text-red-400/50" />
                  <p>{t('ranking.noDefeatedRankings', 'Nenhum treinador derrotou Pokémon ainda')}</p>
                </div>
              ) : (
                <>
                  <UpdateInfo />
                  <Podium
                    rankings={defeatedRankings}
                    getRank={e => e.defeated_rank || 0}
                    getValue={e => `${e.total_pokemon_defeated.toLocaleString()}`}
                  />
                  <RankingList
                    rankings={defeatedRankings}
                    getRank={e => e.defeated_rank || 0}
                    getValue={e => `${e.total_pokemon_defeated.toLocaleString()}`}
                  />
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
