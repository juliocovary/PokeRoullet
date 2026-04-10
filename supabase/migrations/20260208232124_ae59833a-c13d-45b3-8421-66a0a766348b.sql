-- =============================================
-- CLAN SYSTEM - PHASE 1: FOUNDATION
-- =============================================

-- Table: clans (main clan information)
CREATE TABLE public.clans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emblem TEXT NOT NULL,
  leader_id UUID NOT NULL,
  min_level INTEGER NOT NULL DEFAULT 1,
  entry_type TEXT NOT NULL DEFAULT 'open', -- open, approval, invite_only
  max_members INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clans_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 20),
  CONSTRAINT clans_min_level_range CHECK (min_level >= 1 AND min_level <= 50),
  CONSTRAINT clans_max_members_range CHECK (max_members >= 10 AND max_members <= 50),
  CONSTRAINT clans_entry_type_valid CHECK (entry_type IN ('open', 'approval', 'invite_only'))
);

-- Table: clan_members
CREATE TABLE public.clan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- leader, vice_leader, member
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id),
  UNIQUE(user_id), -- A user can only be in one clan
  CONSTRAINT clan_members_role_valid CHECK (role IN ('leader', 'vice_leader', 'member'))
);

-- Table: clan_seasons
CREATE TABLE public.clan_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: clan_season_scores
CREATE TABLE public.clan_season_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.clan_seasons(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  active_members INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clan_id, season_id)
);

-- Table: clan_member_contributions
CREATE TABLE public.clan_member_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.clan_seasons(id) ON DELETE CASCADE,
  points_contributed INTEGER NOT NULL DEFAULT 0,
  last_contribution_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id, season_id)
);

-- Table: clan_messages (chat with 3-day expiry)
CREATE TABLE public.clan_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '3 days'),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT clan_messages_length CHECK (char_length(message) <= 500)
);

-- Table: clan_invites
CREATE TABLE public.clan_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT clan_invites_status_valid CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Table: clan_join_requests
CREATE TABLE public.clan_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT clan_join_requests_status_valid CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Table: clan_collective_missions
CREATE TABLE public.clan_collective_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal INTEGER NOT NULL,
  reward_clan_points INTEGER NOT NULL DEFAULT 0,
  reward_member_coins INTEGER NOT NULL DEFAULT 0,
  reward_member_shards INTEGER NOT NULL DEFAULT 0,
  reward_member_spins INTEGER NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL, -- weekly, monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clan_collective_missions_frequency_valid CHECK (frequency IN ('weekly', 'monthly'))
);

-- Table: clan_mission_progress
CREATE TABLE public.clan_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.clan_collective_missions(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.clan_seasons(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rewards_distributed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(clan_id, mission_id, season_id)
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_season_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_member_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_collective_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_mission_progress ENABLE ROW LEVEL SECURITY;

-- Clans: Public read for searchable clans
CREATE POLICY "Clans are viewable by everyone" ON public.clans
  FOR SELECT USING (true);

-- Clan members: Members can view their clan's members
CREATE POLICY "Users can view clan members" ON public.clan_members
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own membership" ON public.clan_members
  FOR SELECT USING (auth.uid() = user_id);

-- Seasons: Public read
CREATE POLICY "Seasons are viewable by everyone" ON public.clan_seasons
  FOR SELECT USING (true);

-- Season scores: Public read (for rankings)
CREATE POLICY "Season scores are viewable by everyone" ON public.clan_season_scores
  FOR SELECT USING (true);

-- Contributions: Members can view their clan's contributions
CREATE POLICY "Users can view their contributions" ON public.clan_member_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clan members can view clan contributions" ON public.clan_member_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clan_members 
      WHERE clan_members.clan_id = clan_member_contributions.clan_id 
      AND clan_members.user_id = auth.uid()
    )
  );

-- Messages: Only clan members can view
CREATE POLICY "Clan members can view messages" ON public.clan_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clan_members 
      WHERE clan_members.clan_id = clan_messages.clan_id 
      AND clan_members.user_id = auth.uid()
    )
    AND is_deleted = false
    AND expires_at > now()
  );

-- Invites: Inviter and invitee can view
CREATE POLICY "Users can view their invites" ON public.clan_invites
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Join requests: User can view their own, clan leaders can view clan's requests
CREATE POLICY "Users can view their join requests" ON public.clan_join_requests
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.clan_members 
      WHERE clan_members.clan_id = clan_join_requests.clan_id 
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'vice_leader')
    )
  );

-- Collective missions: Public read
CREATE POLICY "Collective missions are viewable by everyone" ON public.clan_collective_missions
  FOR SELECT USING (true);

-- Mission progress: Clan members can view
CREATE POLICY "Clan members can view mission progress" ON public.clan_mission_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clan_members 
      WHERE clan_members.clan_id = clan_mission_progress.clan_id 
      AND clan_members.user_id = auth.uid()
    )
  );

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_clan_members_clan_id ON public.clan_members(clan_id);
CREATE INDEX idx_clan_members_user_id ON public.clan_members(user_id);
CREATE INDEX idx_clan_season_scores_season_id ON public.clan_season_scores(season_id);
CREATE INDEX idx_clan_season_scores_rank ON public.clan_season_scores(rank);
CREATE INDEX idx_clan_messages_clan_id ON public.clan_messages(clan_id);
CREATE INDEX idx_clan_messages_expires_at ON public.clan_messages(expires_at);
CREATE INDEX idx_clan_invites_invitee_id ON public.clan_invites(invitee_id);
CREATE INDEX idx_clan_join_requests_clan_id ON public.clan_join_requests(clan_id);

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Function: Create a new clan
CREATE OR REPLACE FUNCTION create_clan(
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_emblem TEXT,
  p_min_level INTEGER DEFAULT 1,
  p_entry_type TEXT DEFAULT 'open',
  p_max_members INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id UUID;
  v_user_level INTEGER;
  v_active_season_id UUID;
BEGIN
  -- Check if user is already in a clan
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você já está em um clã');
  END IF;

  -- Check if name is unique
  IF EXISTS (SELECT 1 FROM clans WHERE LOWER(name) = LOWER(p_name)) THEN
    RETURN json_build_object('success', false, 'message', 'Este nome de clã já existe');
  END IF;

  -- Get user level
  SELECT level INTO v_user_level FROM profiles WHERE user_id = p_user_id;
  
  IF v_user_level IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Perfil não encontrado');
  END IF;

  -- Create the clan
  INSERT INTO clans (name, description, emblem, leader_id, min_level, entry_type, max_members)
  VALUES (p_name, p_description, p_emblem, p_user_id, p_min_level, p_entry_type, p_max_members)
  RETURNING id INTO v_clan_id;

  -- Add creator as leader
  INSERT INTO clan_members (clan_id, user_id, role)
  VALUES (v_clan_id, p_user_id, 'leader');

  -- Get active season and create score entry
  SELECT id INTO v_active_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  
  IF v_active_season_id IS NOT NULL THEN
    INSERT INTO clan_season_scores (clan_id, season_id, total_points, active_members)
    VALUES (v_clan_id, v_active_season_id, 0, 1);
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Clã criado com sucesso!',
    'clan_id', v_clan_id
  );
END;
$$;

-- Function: Join a clan
CREATE OR REPLACE FUNCTION join_clan(
  p_user_id UUID,
  p_clan_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan RECORD;
  v_user_level INTEGER;
  v_member_count INTEGER;
  v_active_season_id UUID;
BEGIN
  -- Check if user is already in a clan
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você já está em um clã');
  END IF;

  -- Get clan info
  SELECT * INTO v_clan FROM clans WHERE id = p_clan_id;
  
  IF v_clan IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Clã não encontrado');
  END IF;

  -- Get user level
  SELECT level INTO v_user_level FROM profiles WHERE user_id = p_user_id;
  
  IF v_user_level < v_clan.min_level THEN
    RETURN json_build_object('success', false, 'message', 'Seu nível é muito baixo para este clã');
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count FROM clan_members WHERE clan_id = p_clan_id;
  
  IF v_member_count >= v_clan.max_members THEN
    RETURN json_build_object('success', false, 'message', 'Este clã está cheio');
  END IF;

  -- Handle based on entry type
  IF v_clan.entry_type = 'invite_only' THEN
    RETURN json_build_object('success', false, 'message', 'Este clã aceita apenas convites');
  ELSIF v_clan.entry_type = 'approval' THEN
    -- Create join request
    INSERT INTO clan_join_requests (clan_id, user_id)
    VALUES (p_clan_id, p_user_id)
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object('success', true, 'message', 'Solicitação enviada! Aguarde aprovação.');
  ELSE
    -- Open clan - join directly
    INSERT INTO clan_members (clan_id, user_id, role)
    VALUES (p_clan_id, p_user_id, 'member');

    -- Update active members count
    SELECT id INTO v_active_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
    IF v_active_season_id IS NOT NULL THEN
      UPDATE clan_season_scores 
      SET active_members = active_members + 1, updated_at = now()
      WHERE clan_id = p_clan_id AND season_id = v_active_season_id;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Você entrou no clã!');
  END IF;
END;
$$;

-- Function: Leave clan
CREATE OR REPLACE FUNCTION leave_clan(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_vice_leader_id UUID;
  v_clan_id UUID;
BEGIN
  -- Get member info
  SELECT cm.*, c.id as the_clan_id INTO v_member 
  FROM clan_members cm
  JOIN clans c ON c.id = cm.clan_id
  WHERE cm.user_id = p_user_id;
  
  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Você não está em um clã');
  END IF;

  v_clan_id := v_member.clan_id;

  IF v_member.role = 'leader' THEN
    -- Try to find a vice leader to promote
    SELECT user_id INTO v_vice_leader_id 
    FROM clan_members 
    WHERE clan_id = v_clan_id AND role = 'vice_leader' 
    LIMIT 1;

    IF v_vice_leader_id IS NOT NULL THEN
      -- Promote vice leader
      UPDATE clan_members SET role = 'leader', updated_at = now() 
      WHERE clan_id = v_clan_id AND user_id = v_vice_leader_id;
      
      UPDATE clans SET leader_id = v_vice_leader_id, updated_at = now() 
      WHERE id = v_clan_id;
    ELSE
      -- Check if there are other members
      IF EXISTS (SELECT 1 FROM clan_members WHERE clan_id = v_clan_id AND user_id != p_user_id) THEN
        -- Promote oldest member
        SELECT user_id INTO v_vice_leader_id 
        FROM clan_members 
        WHERE clan_id = v_clan_id AND user_id != p_user_id 
        ORDER BY joined_at ASC 
        LIMIT 1;

        UPDATE clan_members SET role = 'leader', updated_at = now() 
        WHERE clan_id = v_clan_id AND user_id = v_vice_leader_id;
        
        UPDATE clans SET leader_id = v_vice_leader_id, updated_at = now() 
        WHERE id = v_clan_id;
      ELSE
        -- Delete clan if no other members
        DELETE FROM clans WHERE id = v_clan_id;
        RETURN json_build_object('success', true, 'message', 'Você saiu e o clã foi deletado');
      END IF;
    END IF;
  END IF;

  -- Remove member
  DELETE FROM clan_members WHERE user_id = p_user_id AND clan_id = v_clan_id;

  RETURN json_build_object('success', true, 'message', 'Você saiu do clã');
END;
$$;

-- Function: Get user's clan info
CREATE OR REPLACE FUNCTION get_user_clan(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_clan_id UUID;
  v_member_role TEXT;
BEGIN
  -- Get user's clan membership
  SELECT clan_id, role INTO v_clan_id, v_member_role
  FROM clan_members WHERE user_id = p_user_id;

  IF v_clan_id IS NULL THEN
    RETURN json_build_object('has_clan', false);
  END IF;

  -- Get full clan info
  SELECT json_build_object(
    'has_clan', true,
    'clan', json_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'emblem', c.emblem,
      'leader_id', c.leader_id,
      'min_level', c.min_level,
      'entry_type', c.entry_type,
      'max_members', c.max_members,
      'created_at', c.created_at
    ),
    'my_role', v_member_role,
    'member_count', (SELECT COUNT(*) FROM clan_members WHERE clan_id = v_clan_id),
    'season_info', (
      SELECT json_build_object(
        'total_points', css.total_points,
        'rank', css.rank,
        'active_members', css.active_members,
        'season_number', cs.season_number,
        'days_remaining', EXTRACT(DAY FROM cs.end_date - now())::INTEGER
      )
      FROM clan_season_scores css
      JOIN clan_seasons cs ON cs.id = css.season_id
      WHERE css.clan_id = v_clan_id AND cs.is_active = true
    ),
    'my_contribution', (
      SELECT COALESCE(points_contributed, 0)
      FROM clan_member_contributions cmc
      JOIN clan_seasons cs ON cs.id = cmc.season_id
      WHERE cmc.clan_id = v_clan_id 
      AND cmc.user_id = p_user_id 
      AND cs.is_active = true
    )
  ) INTO v_result
  FROM clans c
  WHERE c.id = v_clan_id;

  RETURN v_result;
END;
$$;

-- Function: Get clan members list
CREATE OR REPLACE FUNCTION get_clan_members(p_clan_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'user_id', cm.user_id,
        'role', cm.role,
        'joined_at', cm.joined_at,
        'nickname', p.nickname,
        'avatar', p.avatar,
        'level', p.level,
        'contribution', COALESCE(
          (SELECT points_contributed FROM clan_member_contributions cmc
           JOIN clan_seasons cs ON cs.id = cmc.season_id
           WHERE cmc.clan_id = p_clan_id AND cmc.user_id = cm.user_id AND cs.is_active = true),
          0
        )
      )
      ORDER BY 
        CASE cm.role 
          WHEN 'leader' THEN 1 
          WHEN 'vice_leader' THEN 2 
          ELSE 3 
        END,
        cm.joined_at ASC
    )
    FROM clan_members cm
    JOIN profiles p ON p.user_id = cm.user_id
    WHERE cm.clan_id = p_clan_id
  );
END;
$$;

-- Function: Search clans
CREATE OR REPLACE FUNCTION search_clans(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(clan_data)
    FROM (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'emblem', c.emblem,
        'min_level', c.min_level,
        'entry_type', c.entry_type,
        'max_members', c.max_members,
        'member_count', (SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id),
        'total_points', COALESCE(css.total_points, 0),
        'rank', css.rank,
        'leader_nickname', (SELECT nickname FROM profiles WHERE user_id = c.leader_id)
      ) as clan_data
      FROM clans c
      LEFT JOIN clan_season_scores css ON css.clan_id = c.id
      LEFT JOIN clan_seasons cs ON cs.id = css.season_id AND cs.is_active = true
      WHERE c.entry_type != 'invite_only'
      AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%')
      ORDER BY COALESCE(css.total_points, 0) DESC
      LIMIT p_limit OFFSET p_offset
    ) sub
  );
END;
$$;

-- Function: Add clan points (called from other actions)
CREATE OR REPLACE FUNCTION add_clan_points(
  p_user_id UUID,
  p_points INTEGER,
  p_activity_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id UUID;
  v_season_id UUID;
  v_bonus_multiplier NUMERIC := 1.0;
  v_active_members INTEGER;
  v_final_points INTEGER;
BEGIN
  -- Get user's clan
  SELECT clan_id INTO v_clan_id FROM clan_members WHERE user_id = p_user_id;
  
  IF v_clan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get active season
  SELECT id INTO v_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  
  IF v_season_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get active members for bonus calculation
  SELECT active_members INTO v_active_members 
  FROM clan_season_scores 
  WHERE clan_id = v_clan_id AND season_id = v_season_id;

  -- Apply participation bonus
  IF v_active_members >= 20 THEN
    v_bonus_multiplier := 1.2;
  ELSIF v_active_members >= 10 THEN
    v_bonus_multiplier := 1.1;
  END IF;

  v_final_points := FLOOR(p_points * v_bonus_multiplier);

  -- Update clan total points
  INSERT INTO clan_season_scores (clan_id, season_id, total_points, active_members)
  VALUES (v_clan_id, v_season_id, v_final_points, 1)
  ON CONFLICT (clan_id, season_id) 
  DO UPDATE SET 
    total_points = clan_season_scores.total_points + v_final_points,
    updated_at = now();

  -- Update member contribution
  INSERT INTO clan_member_contributions (clan_id, user_id, season_id, points_contributed, last_contribution_at)
  VALUES (v_clan_id, p_user_id, v_season_id, v_final_points, now())
  ON CONFLICT (clan_id, user_id, season_id)
  DO UPDATE SET 
    points_contributed = clan_member_contributions.points_contributed + v_final_points,
    last_contribution_at = now(),
    updated_at = now();

  RETURN true;
END;
$$;

-- Function: Send clan message
CREATE OR REPLACE FUNCTION send_clan_message(
  p_user_id UUID,
  p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id UUID;
  v_last_message_at TIMESTAMP;
BEGIN
  -- Get user's clan
  SELECT clan_id INTO v_clan_id FROM clan_members WHERE user_id = p_user_id;
  
  IF v_clan_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Você não está em um clã');
  END IF;

  -- Check cooldown (5 seconds)
  SELECT created_at INTO v_last_message_at 
  FROM clan_messages 
  WHERE clan_id = v_clan_id AND user_id = p_user_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_last_message_at IS NOT NULL AND v_last_message_at > now() - interval '5 seconds' THEN
    RETURN json_build_object('success', false, 'message', 'Aguarde alguns segundos antes de enviar outra mensagem');
  END IF;

  -- Insert message
  INSERT INTO clan_messages (clan_id, user_id, message)
  VALUES (v_clan_id, p_user_id, p_message);

  RETURN json_build_object('success', true);
END;
$$;

-- Function: Get clan messages
CREATE OR REPLACE FUNCTION get_clan_messages(p_clan_id UUID, p_limit INTEGER DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(msg_data ORDER BY created_at ASC)
    FROM (
      SELECT json_build_object(
        'id', cm.id,
        'user_id', cm.user_id,
        'message', cm.message,
        'created_at', cm.created_at,
        'nickname', p.nickname,
        'avatar', p.avatar
      ) as msg_data,
      cm.created_at
      FROM clan_messages cm
      JOIN profiles p ON p.user_id = cm.user_id
      WHERE cm.clan_id = p_clan_id 
      AND cm.is_deleted = false 
      AND cm.expires_at > now()
      ORDER BY cm.created_at DESC
      LIMIT p_limit
    ) sub
  );
END;
$$;

-- Function: Get clan rankings
CREATE OR REPLACE FUNCTION get_clan_rankings(p_limit INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(ranking_data)
    FROM (
      SELECT json_build_object(
        'rank', ROW_NUMBER() OVER (ORDER BY css.total_points DESC),
        'clan_id', c.id,
        'name', c.name,
        'emblem', c.emblem,
        'total_points', css.total_points,
        'member_count', (SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id),
        'leader_nickname', (SELECT nickname FROM profiles WHERE user_id = c.leader_id)
      ) as ranking_data
      FROM clans c
      JOIN clan_season_scores css ON css.clan_id = c.id
      JOIN clan_seasons cs ON cs.id = css.season_id AND cs.is_active = true
      ORDER BY css.total_points DESC
      LIMIT p_limit
    ) sub
  );
END;
$$;

-- Function: Get pending invites for user
CREATE OR REPLACE FUNCTION get_pending_clan_invites(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(invite_data)
    FROM (
      SELECT json_build_object(
        'id', ci.id,
        'clan_id', ci.clan_id,
        'clan_name', c.name,
        'clan_emblem', c.emblem,
        'inviter_nickname', (SELECT nickname FROM profiles WHERE user_id = ci.inviter_id),
        'created_at', ci.created_at,
        'expires_at', ci.expires_at
      ) as invite_data
      FROM clan_invites ci
      JOIN clans c ON c.id = ci.clan_id
      WHERE ci.invitee_id = p_user_id 
      AND ci.status = 'pending'
      AND ci.expires_at > now()
      ORDER BY ci.created_at DESC
    ) sub
  );
END;
$$;

-- Function: Respond to clan invite
CREATE OR REPLACE FUNCTION respond_clan_invite(
  p_user_id UUID,
  p_invite_id UUID,
  p_accept BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_clan RECORD;
  v_member_count INTEGER;
BEGIN
  -- Get invite
  SELECT * INTO v_invite FROM clan_invites 
  WHERE id = p_invite_id AND invitee_id = p_user_id AND status = 'pending';
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Convite não encontrado');
  END IF;

  IF NOT p_accept THEN
    UPDATE clan_invites SET status = 'declined' WHERE id = p_invite_id;
    RETURN json_build_object('success', true, 'message', 'Convite recusado');
  END IF;

  -- Check if already in a clan
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você já está em um clã');
  END IF;

  -- Get clan and check capacity
  SELECT * INTO v_clan FROM clans WHERE id = v_invite.clan_id;
  SELECT COUNT(*) INTO v_member_count FROM clan_members WHERE clan_id = v_invite.clan_id;
  
  IF v_member_count >= v_clan.max_members THEN
    RETURN json_build_object('success', false, 'message', 'O clã está cheio');
  END IF;

  -- Accept invite and join clan
  UPDATE clan_invites SET status = 'accepted' WHERE id = p_invite_id;
  
  INSERT INTO clan_members (clan_id, user_id, role)
  VALUES (v_invite.clan_id, p_user_id, 'member');

  RETURN json_build_object('success', true, 'message', 'Você entrou no clã!');
END;
$$;

-- Create initial season
INSERT INTO clan_seasons (season_number, start_date, end_date, is_active)
VALUES (1, now(), now() + interval '30 days', true);