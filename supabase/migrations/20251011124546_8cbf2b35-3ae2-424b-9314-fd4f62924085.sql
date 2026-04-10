-- Insert Luck Upgrade and XP Upgrade items into items table
INSERT INTO public.items (id, name, description, type, price, icon_url)
VALUES 
  (1000, 'Amuleto da Sorte', 'Aumenta suas chances de raridades altas', 'upgrade', 10, NULL),
  (1001, 'Ovo da Sorte', 'Aumenta o ganho de XP', 'upgrade', 15, NULL)
ON CONFLICT (id) DO NOTHING;