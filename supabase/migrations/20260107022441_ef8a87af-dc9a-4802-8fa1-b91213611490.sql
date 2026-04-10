-- Update existing event to New Year theme with new dates
UPDATE launch_event_config 
SET 
  event_name = 'New Year Event',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '14 days',
  is_active = true
WHERE id = '86338587-0cf9-4672-885b-d8c8aac53342';