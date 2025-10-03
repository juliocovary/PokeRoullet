import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

interface FriendProfile {
  user_id: string;
  nickname: string;
  avatar: string;
  level: number;
  experience_points: number;
  pokemon_count?: number;
  friendship?: Friendship;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Buscar amizades aceitas
      const { data: acceptedFriendships, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendsError) {
        console.error('Error loading friends:', friendsError);
        return;
      }

      // Buscar perfis dos amigos
      const friendIds = acceptedFriendships?.map(friendship => 
        friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id
      ) || [];

      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar, level, experience_points')
        .in('user_id', friendIds);

      if (profilesError) {
        console.error('Error loading friend profiles:', profilesError);
        return;
      }

      const friendsList = friendProfiles?.map(profile => {
        const friendship = acceptedFriendships?.find(f => 
          f.requester_id === profile.user_id || f.addressee_id === profile.user_id
        );
        return {
          ...profile,
          friendship
        } as FriendProfile;
      }) || [];

      // Buscar pedidos pendentes recebidos
      const { data: pendingFriendships, error: pendingError } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Error loading pending requests:', pendingError);
        return;
      }

      const pendingIds = pendingFriendships?.map(f => f.requester_id) || [];
      const { data: pendingProfiles, error: pendingProfilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar, level, experience_points')
        .in('user_id', pendingIds);

      if (pendingProfilesError) {
        console.error('Error loading pending profiles:', pendingProfilesError);
        return;
      }

      const pendingList = pendingProfiles?.map(profile => {
        const friendship = pendingFriendships?.find(f => f.requester_id === profile.user_id);
        return {
          ...profile,
          friendship
        } as FriendProfile;
      }) || [];

      // Buscar pedidos enviados
      const { data: sentFriendships, error: sentError } = await supabase
        .from('friendships')
        .select('*')
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (sentError) {
        console.error('Error loading sent requests:', sentError);
        return;
      }

      const sentIds = sentFriendships?.map(f => f.addressee_id) || [];
      const { data: sentProfiles, error: sentProfilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar, level, experience_points')
        .in('user_id', sentIds);

      if (sentProfilesError) {
        console.error('Error loading sent profiles:', sentProfilesError);
        return;
      }

      const sentList = sentProfiles?.map(profile => {
        const friendship = sentFriendships?.find(f => f.addressee_id === profile.user_id);
        return {
          ...profile,
          friendship
        } as FriendProfile;
      }) || [];

      setFriends(friendsList);
      setPendingRequests(pendingList);
      setSentRequests(sentList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (searchTerm: string): Promise<FriendProfile[]> => {
    if (!user || !searchTerm.trim()) return [];

    try {
      // Busca por nickname
      const { data: userByNickData, error: nickError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          nickname,
          avatar,
          level,
          experience_points
        `)
        .ilike('nickname', `%${searchTerm}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (nickError) {
        console.error('Error searching by nickname:', nickError);
        return [];
      }

      return userByNickData || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: friendId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Pedido já enviado',
            description: 'Você já enviou um pedido de amizade para este usuário.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: 'Erro ao enviar pedido de amizade.',
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Pedido enviado!',
        description: 'Seu pedido de amizade foi enviado com sucesso.',
      });

      // Recarregar dados
      loadFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const respondToFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', friendshipId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao responder pedido de amizade.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: accept ? 'Amizade aceita!' : 'Pedido recusado',
        description: accept 
          ? 'Vocês agora são amigos!' 
          : 'O pedido de amizade foi recusado.',
      });

      // Recarregar dados
      loadFriends();
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao remover amigo.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Amigo removido',
        description: 'A amizade foi removida com sucesso.',
      });

      // Recarregar dados
      loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    loadFriends
  };
};