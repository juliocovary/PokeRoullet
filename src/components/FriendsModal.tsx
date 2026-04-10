import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserPlus, Users, Clock, Send, Search, X, Gift } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useFriendGifts } from '@/hooks/useFriendGifts';
import { useLaunchEvent } from '@/hooks/useLaunchEvent';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrainerCard } from './TrainerCard';
import { FriendPokedexModal } from './FriendPokedexModal';
import { PendingGiftsModal } from './PendingGiftsModal';
import { PlayerProfileModal } from './PlayerProfileModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Type for batch-loaded friend stats
interface FriendStatsMap {
  [friendId: string]: {
    pokemonCount: number;
    uniquePokemonCount: number;
    canSendGift: boolean;
  };
}

export const FriendsModal = ({ isOpen, onClose }: FriendsModalProps) => {
  const { t } = useTranslation('modals');
  const { user } = useAuth();
  const { friends, pendingRequests, sentRequests, loading, searchUsers, sendFriendRequest, respondToFriendRequest, removeFriend, loadFriends } = useFriends();
  const { pendingGifts, loadPendingGifts } = useFriendGifts();
  const { checkFriendsMission } = useLaunchEvent();
  const isMobile = useIsMobile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewPokedexModal, setViewPokedexModal] = useState<{ isOpen: boolean; friendId: string; friendNickname: string }>({
    isOpen: false,
    friendId: '',
    friendNickname: ''
  });
  const [viewProfileModal, setViewProfileModal] = useState<{ isOpen: boolean; userId: string; nickname: string }>({
    isOpen: false,
    userId: '',
    nickname: ''
  });
  const [giftsModalOpen, setGiftsModalOpen] = useState(false);
  const [friendStats, setFriendStats] = useState<FriendStatsMap>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // OPTIMIZATION: Batch load friend stats when modal opens
  const loadFriendStats = useCallback(async () => {
    if (!user || friends.length === 0) {
      setFriendStats({});
      return;
    }
    
    setLoadingStats(true);
    try {
      const friendIds = friends.map(f => f.user_id);
      const { data, error } = await supabase.rpc('get_friends_stats_batch', {
        p_user_id: user.id,
        p_friend_ids: friendIds
      });
      
      if (error) {
        console.error('Error loading friend stats:', error);
        return;
      }
      
      // Convert array to map for quick lookup
      const statsMap: FriendStatsMap = {};
      (data || []).forEach((stat: any) => {
        statsMap[stat.friend_id] = {
          pokemonCount: stat.pokemon_count,
          uniquePokemonCount: stat.unique_pokemon_count,
          canSendGift: stat.can_send_gift
        };
      });
      
      setFriendStats(statsMap);
    } catch (error) {
      console.error('Error loading friend stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user, friends]);

  // OPTIMIZATION: Lazy-load friends data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
      checkFriendsMission();
      loadPendingGifts();
    }
  }, [isOpen, checkFriendsMission, loadPendingGifts, loadFriends]);
  
  // Load friend stats when friends list is available
  useEffect(() => {
    if (isOpen && friends.length > 0) {
      loadFriendStats();
    }
  }, [isOpen, friends, loadFriendStats]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewPokedex = (friendId: string, friendNickname: string) => {
    setViewPokedexModal({ isOpen: true, friendId, friendNickname });
  };

  const handleViewProfile = (userId: string, nickname: string) => {
    setViewProfileModal({ isOpen: true, userId, nickname });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader className="relative">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-0 top-0 p-1 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('friends.title')}
            </DialogTitle>
            
            {/* Pending Gifts Button */}
            {pendingGifts.length > 0 && (
              <div className="flex justify-center mt-2">
                <Button
                  size="sm"
                  onClick={() => setGiftsModalOpen(true)}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {t('friends.pendingGifts')}
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {pendingGifts.length}
                  </Badge>
                </Button>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="friends" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">{t('friends.tabs.friends')}</span> ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">{t('friends.tabs.pending')}</span> ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t('friends.tabs.sent')}</span> ({sentRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">{t('friends.tabs.search')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 h-96 overflow-y-auto">
              <TabsContent value="friends" className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('friends.noFriends')}</p>
                    <p className="text-sm">{t('friends.searchHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <TrainerCard 
                        key={friend.user_id} 
                        friend={friend} 
                        type="friend"
                        stats={friendStats[friend.user_id]}
                        onRemoveFriend={removeFriend}
                        onViewPokedex={handleViewPokedex}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('friends.noPending')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((friend) => (
                      <TrainerCard 
                        key={friend.user_id} 
                        friend={friend} 
                        type="pending"
                        onAcceptRequest={respondToFriendRequest}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-3">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('friends.noSent')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sentRequests.map((friend) => (
                      <TrainerCard 
                        key={friend.user_id} 
                        friend={friend} 
                        type="sent"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('friends.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length === 0 && searchQuery && !searching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('friends.noResults')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <TrainerCard 
                        key={user.user_id} 
                        friend={user} 
                        type="search"
                        onAddFriend={sendFriendRequest}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Friend Pokedex Modal */}
      <FriendPokedexModal
        isOpen={viewPokedexModal.isOpen}
        onClose={() => setViewPokedexModal({ isOpen: false, friendId: '', friendNickname: '' })}
        friendId={viewPokedexModal.friendId}
        friendNickname={viewPokedexModal.friendNickname}
      />

      {/* Pending Gifts Modal */}
      <PendingGiftsModal
        isOpen={giftsModalOpen}
        onClose={() => {
          setGiftsModalOpen(false);
          loadPendingGifts();
        }}
      />

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={viewProfileModal.isOpen}
        onClose={() => setViewProfileModal({ isOpen: false, userId: '', nickname: '' })}
        userId={viewProfileModal.userId}
        nickname={viewProfileModal.nickname}
      />
    </>
  );
};
