import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { UserPlus, Users, Clock, Send, Search } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { TrainerCard } from './TrainerCard';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendsModal = ({ isOpen, onClose }: FriendsModalProps) => {
  const { friends, pendingRequests, sentRequests, loading, searchUsers, sendFriendRequest, respondToFriendRequest, removeFriend } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            👫 Amigos
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pedidos ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviados ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
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
                  <p>Você ainda não tem amigos.</p>
                  <p className="text-sm">Use a aba "Buscar" para encontrar outros treinadores!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <TrainerCard 
                      key={friend.user_id} 
                      friend={friend} 
                      type="friend"
                      onRemoveFriend={removeFriend}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pedido de amizade pendente.</p>
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
                  <p>Nenhum pedido enviado.</p>
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
                  placeholder="Digite o nickname do treinador..."
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
                  <p>Nenhum treinador encontrado com esse nickname.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <TrainerCard 
                      key={user.user_id} 
                      friend={user} 
                      type="search"
                      onAddFriend={sendFriendRequest}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};