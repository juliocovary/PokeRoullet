-- Criar tabela de itens
CREATE TABLE public.items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'evolution_stone', 'berry', 'pokeball', etc
  price INTEGER NOT NULL DEFAULT 0,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de inventário de itens do usuário
CREATE TABLE public.user_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id INTEGER NOT NULL REFERENCES public.items(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Habilitar RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;

-- Políticas para itens (somente leitura para todos)
CREATE POLICY "Items are viewable by everyone" 
ON public.items 
FOR SELECT 
USING (true);

-- Políticas para inventário de itens do usuário
CREATE POLICY "Users can view their own items" 
ON public.user_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" 
ON public.user_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.user_items 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_items_updated_at
BEFORE UPDATE ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir Evolution Stones iniciais
INSERT INTO public.items (name, description, type, price, icon_url) VALUES
('Fire Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '🔥'),
('Water Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '💧'),
('Thunder Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '⚡'),
('Leaf Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '🍃'),
('Moon Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '🌙'),
('Sun Stone', 'Uma pedra que faz alguns Pokémon evoluírem.', 'evolution_stone', 50, '☀️');

-- Função para comprar item
CREATE OR REPLACE FUNCTION public.buy_item(p_user_id UUID, p_item_id INTEGER, p_quantity INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, message TEXT, new_pokecoins INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  item_price INTEGER;
  current_pokecoins INTEGER;
  total_cost INTEGER;
BEGIN
  -- Buscar preço do item
  SELECT price INTO item_price
  FROM public.items
  WHERE id = p_item_id;
  
  IF item_price IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Item não encontrado'::TEXT, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Calcular custo total
  total_cost := item_price * p_quantity;
  
  -- Buscar pokécoins atuais do usuário
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Verificar se tem pokécoins suficientes
  IF current_pokecoins < total_cost THEN
    RETURN QUERY SELECT FALSE, 'Pokécoins insuficientes'::TEXT, current_pokecoins;
    RETURN;
  END IF;
  
  -- Deduzir pokécoins
  UPDATE public.profiles 
  SET pokecoins = pokecoins - total_cost,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Adicionar item ao inventário (ou incrementar quantidade)
  INSERT INTO public.user_items (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = user_items.quantity + p_quantity,
    updated_at = now();
  
  -- Retornar sucesso
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Item comprado com sucesso!'::TEXT, current_pokecoins;
END;
$function$;