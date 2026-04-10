-- Primeiro remover referências na user_items
DELETE FROM public.user_items WHERE item_id IN (1, 2, 3, 4, 5, 6);

-- Agora remover itens antigos com emojis
DELETE FROM public.items WHERE id IN (1, 2, 3, 4, 5, 6);