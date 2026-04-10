-- Insert news article about Kalos region launch
INSERT INTO public.news_articles (
  title,
  title_en,
  content,
  content_en,
  category,
  is_pinned,
  is_active,
  published_at
) VALUES (
  '🎉 Nova Região Desbloqueada: Kalos!',
  '🎉 New Region Unlocked: Kalos!',
  '**A aguardada região de Kalos finalmente chegou ao PokéRoulette!**

Explore a terra dos Pokémon da 6ª Geração e adicione 72 novos Pokémon à sua coleção!

**Novidades:**
- 69 novos Pokémon regulares (IDs 650-718)
- 3 Pokémon Secretos exclusivos: Diancie, Hoopa e Volcanion
- Novas recompensas na Pokédex por completar a coleção de Kalos
- Total de Pokémon agora é 721!

**Como desbloquear:**
- Desbloqueie primeiro a região de Unova
- Custo: 600 PokéShards

**Dicas:**
- Gire na roleta de Kalos para encontrar Pokémon como Greninja, Talonflame e Sylveon
- Complete os milestones da Pokédex para ganhar PokéCoins, XP e PokéShards extras
- Caçe os 3 novos Pokémon Secretos para completar sua coleção!

Boa sorte, Treinador! 🎮',
  '**The long-awaited Kalos region has finally arrived at PokéRoulette!**

Explore the land of 6th Generation Pokémon and add 72 new Pokémon to your collection!

**What''s New:**
- 69 new regular Pokémon (IDs 650-718)
- 3 exclusive Secret Pokémon: Diancie, Hoopa, and Volcanion
- New Pokédex rewards for completing the Kalos collection
- Total Pokémon count is now 721!

**How to unlock:**
- Unlock the Unova region first
- Cost: 600 PokéShards

**Tips:**
- Spin the Kalos roulette to find Pokémon like Greninja, Talonflame, and Sylveon
- Complete Pokédex milestones to earn extra PokéCoins, XP, and PokéShards
- Hunt the 3 new Secret Pokémon to complete your collection!

Good luck, Trainer! 🎮',
  'announcement',
  true,
  true,
  NOW()
);