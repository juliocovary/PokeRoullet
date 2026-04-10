ALTER TABLE public.trainer_teams 
  ADD COLUMN pet_pokemon_id INTEGER,
  ADD COLUMN pet_pokemon_name TEXT,
  ADD COLUMN pet_rarity TEXT,
  ADD COLUMN pet_is_shiny BOOLEAN DEFAULT false;