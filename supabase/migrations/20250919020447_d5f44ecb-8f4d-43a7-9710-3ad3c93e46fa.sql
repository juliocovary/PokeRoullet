-- Create function to increment pokemon quantity
CREATE OR REPLACE FUNCTION increment_pokemon_quantity(p_user_id UUID, p_pokemon_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.pokemon_inventory 
  SET quantity = quantity + 1,
      created_at = now()
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
END;
$$ LANGUAGE plpgsql SECURITY definer SET search_path = public;