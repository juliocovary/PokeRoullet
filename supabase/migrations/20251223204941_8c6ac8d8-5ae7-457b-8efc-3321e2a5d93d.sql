-- =============================================
-- RESTRICT RLS POLICIES ON SENSITIVE TABLES
-- Remove direct client INSERT/UPDATE permissions
-- All modifications must go through SECURITY DEFINER functions
-- =============================================

-- 1. USER_SPINS TABLE
-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Users can manage their own spins" ON public.user_spins;

-- Keep only SELECT policy (already exists)
-- INSERT/UPDATE should only happen via RPC functions

-- 2. POKEMON_INVENTORY TABLE
-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.pokemon_inventory;

-- Keep only SELECT policy (already exists)
-- All inventory changes should go through RPC functions

-- 3. USER_ACHIEVEMENTS TABLE
-- Drop INSERT and UPDATE policies - should only be modified by RPC
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;

-- Keep only SELECT policy

-- 4. USER_MISSIONS TABLE
-- Drop INSERT and UPDATE policies - should only be modified by RPC
DROP POLICY IF EXISTS "Users can insert their own missions" ON public.user_missions;
DROP POLICY IF EXISTS "Users can update their own missions" ON public.user_missions;

-- Keep only SELECT policy

-- 5. USER_ITEMS TABLE
-- Drop INSERT/UPDATE/DELETE policies - should only be modified by RPC
DROP POLICY IF EXISTS "Users can insert their own items" ON public.user_items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.user_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.user_items;

-- Keep only SELECT policy

-- 6. PROFILES TABLE
-- Drop the UPDATE policy - should only be modified via update_profile_safe RPC
DROP POLICY IF EXISTS "Users can update their own profile safe fields" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more restrictive policy that only allows service role or triggers to insert
-- (profiles are created by the trigger on auth.users insert)

-- 7. POKEDEX_CARDS TABLE
-- Drop INSERT policy - should only be modified by place_pokemon_in_pokedex RPC
DROP POLICY IF EXISTS "Users can insert their own pokedex cards" ON public.pokedex_cards;

-- Keep only SELECT policy

-- 8. POKEDEX_REWARDS_CLAIMED TABLE
-- Drop INSERT policy - should only be modified by claim_pokedex_reward RPC
DROP POLICY IF EXISTS "Users can insert their own claimed rewards" ON public.pokedex_rewards_claimed;

-- Keep only SELECT policy

-- 9. USER_LAUNCH_EVENT_PROGRESS TABLE
-- Drop INSERT/UPDATE policies - should only be modified by RPC
DROP POLICY IF EXISTS "Users can insert their own event progress" ON public.user_launch_event_progress;
DROP POLICY IF EXISTS "Users can update their own event progress" ON public.user_launch_event_progress;

-- Keep only SELECT policy