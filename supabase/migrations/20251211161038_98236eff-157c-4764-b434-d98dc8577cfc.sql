-- Add new booster items to the items table
INSERT INTO items (id, name, description, type, price, icon_url) VALUES
  (50, 'Luck Potion', 'Doubles your luck for 12 hours', 'booster', 125, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png'),
  (51, 'Shiny Potion', 'Doubles your shiny chance for 12 hours', 'booster', 125, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pp-max.png'),
  (52, 'Mystery Box', 'Contains random rewards - open in your inventory!', 'mystery_box', 50, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-amber.png'),
  (53, 'Legendary Spin', 'Guarantees a random legendary Pokémon!', 'legendary_spin', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png');

-- Add boost expiration columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS luck_boost_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shiny_boost_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;