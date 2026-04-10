-- Adicionar itens faltantes que são usados nas recompensas do evento
INSERT INTO items (id, name, type, price, description, icon_url) VALUES
(1, 'Luck Potion', 'booster', 500, 'Aumenta a chance de encontrar Pokémon raros por 1 hora', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-attack.png'),
(2, 'Shiny Potion', 'booster', 1000, 'Aumenta a chance de encontrar Pokémon shiny por 1 hora', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png'),
(4, 'Mystery Box', 'consumable', 300, 'Caixa misteriosa que contém recompensas aleatórias', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-module.png'),
(5, 'Legendary Spin', 'consumable', 2000, 'Giro especial que garante encontrar um Pokémon lendário', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png')
ON CONFLICT (id) DO NOTHING;