-- Reset all player progress for the New Year Event
DELETE FROM user_launch_event_progress;

-- Update event dates (new end date: 14 days from now) and ensure it's active
UPDATE launch_event_config
SET 
  start_date = NOW(),
  end_date = NOW() + INTERVAL '14 days',
  is_active = true
WHERE event_name = 'New Year Event';