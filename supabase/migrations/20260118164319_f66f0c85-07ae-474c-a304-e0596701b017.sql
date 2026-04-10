-- Update Essence Box icon to Moon Ball
UPDATE items SET icon_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-ball.png' WHERE id = 101;

-- Insert badge items (with specific IDs for consistency)
INSERT INTO items (id, name, description, type, price, icon_url) VALUES
(200, 'XP Badge', 'A badge that boosts XP gain in Collector Mode. Dropped by Stage 10 Boss.', 'badge', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/1.png'),
(201, 'Luck Badge', 'A badge that increases luck in Collector Mode. Dropped by Stage 20 Boss.', 'badge', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/2.png'),
(202, 'Shiny Badge', 'A badge that increases shiny chances in Collector Mode. Dropped by Stage 30 Boss.', 'badge', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/3.png'),
(203, 'Secret Badge', 'A mysterious badge with hidden powers. Dropped by Stage 40 Boss.', 'badge', 0, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/4.png')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  icon_url = EXCLUDED.icon_url;

-- Create RPC function to add items to user inventory (handles conflict by adding quantity)
CREATE OR REPLACE FUNCTION add_user_item(
  p_user_id UUID,
  p_item_id INTEGER,
  p_quantity INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_items (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = user_items.quantity + EXCLUDED.quantity,
    updated_at = now();
END;
$$;