-- Remove spin rewards from all achievements  
UPDATE public.achievements 
SET base_reward_spins = 0;