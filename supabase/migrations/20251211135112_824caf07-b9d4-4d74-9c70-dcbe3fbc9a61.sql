-- Atualizar preço de todos os itens de evolução para 20 pokecoins
UPDATE public.items 
SET price = 20 
WHERE type IN ('evolution_stone', 'evolution_item');