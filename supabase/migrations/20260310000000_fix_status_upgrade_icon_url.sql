-- Fix Status Upgrade icon_url to use external URL that works in production
-- The previous migration used /src/assets/ which only works in development
-- In production, we need either an external URL or null (frontend handles it)

UPDATE items 
SET icon_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pp-up.png'
WHERE id = 100;
