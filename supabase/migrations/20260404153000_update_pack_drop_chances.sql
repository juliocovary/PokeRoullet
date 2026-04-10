-- Update Trainer Mode pack drop chances.
-- Uses pack type IDs to ensure deterministic updates.

UPDATE public.pack_types
SET drop_chance = 0.70
WHERE id = 'brasa_comum';

UPDATE public.pack_types
SET drop_chance = 0.45
WHERE id = 'aurora_incomum';

UPDATE public.pack_types
SET drop_chance = 0.20
WHERE id = 'prisma_raro';

UPDATE public.pack_types
SET drop_chance = 0.065
WHERE id = 'eclipse_epico';

UPDATE public.pack_types
SET drop_chance = 0.010
WHERE id = 'reliquia_lendaria';

UPDATE public.pack_types
SET drop_chance = 0.0020
WHERE id = 'secreto_ruina';
