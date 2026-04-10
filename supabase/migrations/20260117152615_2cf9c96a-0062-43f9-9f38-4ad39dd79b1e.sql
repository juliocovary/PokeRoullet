-- Insert new items for Trainer Mode

-- Status Upgrade item (dropped by bosses)
INSERT INTO items (id, name, description, type, price, icon_url) VALUES
(100, 'Status Upgrade', 'Item usado para melhorar o status de um Pokémon no Modo Treinador', 'trainer_upgrade', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pp-up.png')
ON CONFLICT (id) DO NOTHING;

-- Essence Box item (dropped by challengers)
INSERT INTO items (id, name, description, type, price, icon_url) VALUES
(101, 'Essence Box', 'Contém 30-50 essências de uma tipagem aleatória', 'essence_box', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luxury-ball.png')
ON CONFLICT (id) DO NOTHING;

-- Essence items for each Pokemon type
INSERT INTO items (id, name, description, type, price, icon_url) VALUES
(110, 'Fire Essence', 'Essência do tipo Fogo', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-gem.png'),
(111, 'Water Essence', 'Essência do tipo Água', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-gem.png'),
(112, 'Grass Essence', 'Essência do tipo Planta', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/grass-gem.png'),
(113, 'Electric Essence', 'Essência do tipo Elétrico', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/electric-gem.png'),
(114, 'Ice Essence', 'Essência do tipo Gelo', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-gem.png'),
(115, 'Fighting Essence', 'Essência do tipo Lutador', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fighting-gem.png'),
(116, 'Poison Essence', 'Essência do tipo Veneno', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poison-gem.png'),
(117, 'Ground Essence', 'Essência do tipo Terra', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ground-gem.png'),
(118, 'Flying Essence', 'Essência do tipo Voador', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/flying-gem.png'),
(119, 'Psychic Essence', 'Essência do tipo Psíquico', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/psychic-gem.png'),
(120, 'Bug Essence', 'Essência do tipo Inseto', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bug-gem.png'),
(121, 'Rock Essence', 'Essência do tipo Pedra', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rock-gem.png'),
(122, 'Ghost Essence', 'Essência do tipo Fantasma', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ghost-gem.png'),
(123, 'Dragon Essence', 'Essência do tipo Dragão', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-gem.png'),
(124, 'Dark Essence', 'Essência do tipo Sombrio', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dark-gem.png'),
(125, 'Steel Essence', 'Essência do tipo Aço', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/steel-gem.png'),
(126, 'Fairy Essence', 'Essência do tipo Fada', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fairy-gem.png'),
(127, 'Normal Essence', 'Essência do tipo Normal', 'essence', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/normal-gem.png')
ON CONFLICT (id) DO NOTHING;