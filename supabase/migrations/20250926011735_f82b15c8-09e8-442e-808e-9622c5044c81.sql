-- Create the Giro Eterno item in the items table
INSERT INTO public.items (id, name, description, type, price, icon_url)
VALUES (999, 'Giro Eterno', 'Adiciona +1 giro base permanentemente', 'upgrade', 25, '🎯')
ON CONFLICT (id) DO NOTHING;