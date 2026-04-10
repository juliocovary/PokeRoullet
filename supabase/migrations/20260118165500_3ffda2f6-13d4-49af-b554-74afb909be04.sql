-- Fix Status Upgrade icon to use correct asset path
UPDATE items 
SET icon_url = '/src/assets/status-upgrade.png'
WHERE id = 100;