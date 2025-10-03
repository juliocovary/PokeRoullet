-- Create table to track Pokemon cards placed in the Pokedex
CREATE TABLE public.pokedex_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  placed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pokemon_id)
);

-- Enable RLS
ALTER TABLE public.pokedex_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pokedex cards" 
ON public.pokedex_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pokedex cards" 
ON public.pokedex_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to place card in pokedex
CREATE OR REPLACE FUNCTION public.place_pokemon_in_pokedex(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_pokemon_name TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_quantity INTEGER;
BEGIN
  -- Check if user has this pokemon in inventory
  SELECT quantity INTO current_quantity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  
  IF current_quantity IS NULL OR current_quantity = 0 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no seu inventário'::TEXT;
    RETURN;
  END IF;
  
  -- Check if pokemon is already placed in pokedex
  IF EXISTS(SELECT 1 FROM public.pokedex_cards WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id) THEN
    RETURN QUERY SELECT FALSE, 'Este Pokémon já está colado na Pokédex'::TEXT;
    RETURN;
  END IF;
  
  -- Place pokemon in pokedex
  INSERT INTO public.pokedex_cards (user_id, pokemon_id, pokemon_name)
  VALUES (p_user_id, p_pokemon_id, p_pokemon_name);
  
  -- Remove one card from inventory
  IF current_quantity = 1 THEN
    -- Remove completely if it's the last one
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  ELSE
    -- Reduce quantity by 1
    UPDATE public.pokemon_inventory
    SET quantity = quantity - 1
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Pokémon colado na Pokédex com sucesso!'::TEXT;
END;
$$;