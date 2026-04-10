-- Fix RPC overload ambiguity introduced by spin boost update.
-- Keep only canonical signatures used by the client:
--   spin_pokemon_roulette(p_user_id uuid, p_region text, p_pokemon_data jsonb)
--   add_pokemon_without_spin(p_user_id uuid, p_region text, p_pokemon_data jsonb)

-- Legacy overload from older migration: (uuid, jsonb, text DEFAULT ...)
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, jsonb, text);

-- Legacy overload from older migration: (uuid, text, jsonb, boolean DEFAULT false)
DROP FUNCTION IF EXISTS public.add_pokemon_without_spin(uuid, text, jsonb, boolean);
