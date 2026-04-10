-- Remover constraint antiga e criar nova incluindo is_shiny
ALTER TABLE pokemon_inventory DROP CONSTRAINT IF EXISTS pokemon_inventory_user_id_pokemon_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS pokemon_inventory_user_pokemon_shiny_idx 
ON pokemon_inventory (user_id, pokemon_id, is_shiny);