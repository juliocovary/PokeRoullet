-- Remove the old 4-argument version of spin_pokemon_roulette that causes ambiguity
DROP FUNCTION IF EXISTS public.spin_pokemon_roulette(uuid, text, jsonb, boolean);