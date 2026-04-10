-- Update news articles with English translations
UPDATE public.news_articles 
SET 
  title_en = 'Welcome to PokéRoulette!',
  content_en = 'PokéRoulette is a Pokémon collection game where you can spin the roulette to win new Pokémon, complete your Pokédex, and compete with other trainers!

How to play:
Use your free spins to win Pokémon
Paste Pokémon in your Pokédex to complete the collection
Complete daily and weekly missions to earn rewards
Evolve your Pokémon using Evolution Stones
Participate in the launch event to earn exclusive rewards!

Good luck, trainer!'
WHERE title = 'Bem-vindo ao PokéRoulette!';

UPDATE public.news_articles 
SET 
  title_en = 'News System Launched!',
  content_en = 'Now you can follow all the game news right here! Stay tuned for updates, events, and tips.'
WHERE title = 'Sistema de Notícias Lançado!';