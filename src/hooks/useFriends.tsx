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

      // Buscar perfis dos amigos usando a função segura
      const friendIds = acceptedFriendships?.map(friendship => 
        friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id
      ) || [];

      if (friendIds.length > 0) {
        const { data: friendProfiles, error: profilesError } = await supabase
          .rpc('get_public_profiles_by_ids', { user_ids: friendIds });

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

        setFriends(friendsList);
      } else {
        setFriends([]);
      }

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
      
      if (pendingIds.length > 0) {
        const { data: pendingProfiles, error: pendingProfilesError } = await supabase
          .rpc('get_public_profiles_by_ids', { user_ids: pendingIds });

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

        setPendingRequests(pendingList);
      } else {
        setPendingRequests([]);
      }

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
      
      if (sentIds.length > 0) {
        const { data: sentProfiles, error: sentProfilesError } = await supabase
          .rpc('get_public_profiles_by_ids', { user_ids: sentIds });

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

        setSentRequests(sentList);
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (searchTerm: string): Promise<FriendProfile[]> => {
    if (!user || !searchTerm.trim()) return [];

    try {
      // Use the secure search function that only returns non-sensitive fields
      const { data, error } = await supabase
        .rpc('search_public_profiles', { 
          search_term: searchTerm,
          exclude_user_id: user.id 
        });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      // Map the result to FriendProfile format (experience_points defaults to 0 for search results)
      return (data || []).map(profile => ({
        ...profile,
        experience_points: 0
      })) as FriendProfile[];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Enviar pedido de amizade - usa função SECURITY DEFINER
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_user_id: user.id,
        p_friend_id: friendId
      });

      if (error) {
        console.error('Error sending friend request:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao enviar pedido de amizade.',
          variant: 'destructive',
        });
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: 'Pedido enviado!',
          description: result.message,
        });
        loadFriends();
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao enviar pedido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Responder pedido de amizade - usa função SECURITY DEFINER
  const respondToFriendRequest = async (friendshipId: string, accept: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('respond_to_friend_request', {
        p_user_id: user.id,
        p_friendship_id: friendshipId,
        p_accept: accept
      });

      if (error) {
        console.error('Error responding to friend request:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao responder pedido de amizade.',
          variant: 'destructive',
        });
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: accept ? 'Amizade aceita!' : 'Pedido recusado',
          description: result.message,
        });

        // If accepted, update launch event friends mission progress
        if (accept) {
          try {
            await supabase.rpc('check_friends_mission', { p_user_id: user.id });
            console.log('[LAUNCH_EVENT] Friends mission checked after accepting friend');
          } catch (err) {
            console.error('[LAUNCH_EVENT] Error checking friends mission:', err);
          }
        }

        loadFriends();
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao responder pedido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  // Remover amigo - usa função SECURITY DEFINER
  const removeFriend = async (friendshipId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('remove_friend', {
        p_user_id: user.id,
        p_friendship_id: friendshipId
      });

      if (error) {
        console.error('Error removing friend:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao remover amigo.',
          variant: 'destructive',
        });
        return;
      }

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: 'Amigo removido',
          description: result.message,
        });
        loadFriends();
      } else {
        toast({
          title: 'Erro',
          description: result?.message || 'Erro ao remover amigo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // OPTIMIZATION: Removed auto-load on mount
  // Friends data is loaded lazily when FriendsModal opens via loadFriends

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