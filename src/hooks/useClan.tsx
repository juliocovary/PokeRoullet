import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ClanInfo {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  leader_id: string;
  min_level: number;
  entry_type: 'open' | 'approval' | 'invite_only';
  max_members: number;
  created_at: string;
}

export interface SeasonInfo {
  total_points: number;
  rank: number | null;
  active_members: number;
  season_number: number;
  days_remaining: number;
}

export interface UserClanData {
  has_clan: boolean;
  clan?: ClanInfo;
  my_role?: 'leader' | 'vice_leader' | 'member';
  member_count?: number;
  season_info?: SeasonInfo;
  my_contribution?: number;
}

export interface ClanMember {
  user_id: string;
  role: 'leader' | 'vice_leader' | 'member';
  joined_at: string;
  nickname: string;
  avatar: string;
  level: number;
  contribution: number;
}

export interface ClanSearchResult {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  min_level: number;
  entry_type: string;
  max_members: number;
  member_count: number;
  total_points: number;
  rank: number | null;
  leader_nickname: string;
}

export interface ClanInvite {
  id: string;
  clan_id: string;
  clan_name: string;
  clan_emblem: string;
  inviter_nickname: string;
  created_at: string;
  expires_at: string;
}

export interface ClanRanking {
  rank: number;
  clan_id: string;
  name: string;
  emblem: string;
  total_points: number;
  member_count: number;
  leader_nickname: string;
}

export const useClan = () => {
  const { t } = useTranslation(['clan', 'toasts']);
  const { user } = useAuth();
  const [userClan, setUserClan] = useState<UserClanData | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ClanInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadUserClan = useCallback(async () => {
    if (!user) {
      setUserClan(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_clan', {
        p_user_id: user.id
      });

      if (error) throw error;
      setUserClan(data as unknown as UserClanData);
    } catch (error) {
      console.error('Error loading clan:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMembers = useCallback(async () => {
    if (!userClan?.clan?.id) return;

    setMembersLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_clan_members', {
        p_clan_id: userClan.clan.id
      });

      if (error) throw error;
      setMembers((data as unknown as ClanMember[]) || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [userClan?.clan?.id]);

  const loadPendingInvites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_pending_clan_invites', {
        p_user_id: user.id
      });

      if (error) throw error;
      setPendingInvites((data as unknown as ClanInvite[]) || []);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  }, [user]);

  const createClan = useCallback(async (
    name: string,
    description: string,
    emblem: string,
    minLevel: number = 5,
    entryType: string = 'open'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('create_clan', {
        p_user_id: user.id,
        p_name: name,
        p_description: description,
        p_emblem: emblem,
        p_min_level: minLevel,
        p_entry_type: entryType,
        p_max_members: 20
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success(result.message);
        await loadUserClan();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error creating clan:', error);
      toast.error(t('errors.createFailed'));
      return false;
    }
  }, [user, loadUserClan, t]);

  const joinClan = useCallback(async (clanId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('join_clan', {
        p_user_id: user.id,
        p_clan_id: clanId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success(result.message);
        await loadUserClan();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error joining clan:', error);
      toast.error(t('errors.joinFailed'));
      return false;
    }
  }, [user, loadUserClan, t]);

  const leaveClan = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('leave_clan', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success(result.message);
        setUserClan({ has_clan: false });
        setMembers([]);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error leaving clan:', error);
      toast.error(t('errors.leaveFailed'));
      return false;
    }
  }, [user, t]);

  const searchClans = useCallback(async (search?: string): Promise<ClanSearchResult[]> => {
    try {
      const { data, error } = await supabase.rpc('search_clans', {
        p_search: search || null,
        p_limit: 20,
        p_offset: 0
      });

      if (error) throw error;
      return (data as unknown as ClanSearchResult[]) || [];
    } catch (error) {
      console.error('Error searching clans:', error);
      return [];
    }
  }, []);

  const getRankings = useCallback(async (): Promise<ClanRanking[]> => {
    try {
      const { data, error } = await supabase.rpc('get_clan_rankings', {
        p_limit: 50
      });

      if (error) throw error;
      return (data as unknown as ClanRanking[]) || [];
    } catch (error) {
      console.error('Error getting rankings:', error);
      return [];
    }
  }, []);

  const updateSettings = useCallback(async (
    clanId: string,
    description: string,
    emblem: string,
    entryType: string,
    minLevel: number
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.rpc('update_clan_settings', {
        p_user_id: user.id,
        p_clan_id: clanId,
        p_description: description,
        p_emblem: emblem,
        p_entry_type: entryType,
        p_min_level: minLevel
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (result.success) {
        await loadUserClan();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating clan settings:', error);
      toast.error(t('toasts:clan.updateSettingsError'));
      return false;
    }
  }, [user, loadUserClan, t]);

  const manageMember = useCallback(async (
    targetUserId: string,
    clanId: string,
    action: string
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.rpc('manage_clan_member', {
        p_user_id: user.id,
        p_target_user_id: targetUserId,
        p_clan_id: clanId,
        p_action: action
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success(result.message);
        await loadMembers();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error managing member:', error);
      return false;
    }
  }, [user, loadMembers]);

  const respondToInvite = useCallback(async (inviteId: string, accept: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('respond_clan_invite', {
        p_user_id: user.id,
        p_invite_id: inviteId,
        p_accept: accept
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success(result.message);
        await loadPendingInvites();
        if (accept) await loadUserClan();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error responding to invite:', error);
      return false;
    }
  }, [user, loadPendingInvites, loadUserClan]);

  // OPTIMIZATION: Removed auto-load on mount
  // Clan data is loaded lazily when ClanModal opens via refreshClan
  // Only checkPendingRewards is called on mount from Index.tsx

  const checkPendingRewards = useCallback(async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase.rpc('get_pending_season_rewards', {
        p_user_id: user.id
      });
      if (error) throw error;
      return (data as unknown as any[]) || [];
    } catch (error) {
      console.error('Error checking pending rewards:', error);
      return [];
    }
  }, [user]);

  const claimSeasonRewards = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.rpc('claim_season_rewards', {
        p_user_id: user.id
      });
      if (error) throw error;
      const result = data as { success: boolean; message?: string };
      if (result.success) {
        toast.success(t('season.rewardsClaimed'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return false;
    }
  }, [user, t]);

  const getSeasonWinners = useCallback(async (clanId?: string) => {
    try {
      let query = supabase.from('clan_season_winners').select('*').order('season_number', { ascending: false });
      if (clanId) query = query.eq('clan_id', clanId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting season winners:', error);
      return [];
    }
  }, []);

  return {
    userClan,
    members,
    pendingInvites,
    loading,
    membersLoading,
    createClan,
    joinClan,
    leaveClan,
    searchClans,
    getRankings,
    respondToInvite,
    updateSettings,
    manageMember,
    checkPendingRewards,
    claimSeasonRewards,
    getSeasonWinners,
    refreshClan: loadUserClan,
    refreshMembers: loadMembers,
    refreshInvites: loadPendingInvites
  };
};
