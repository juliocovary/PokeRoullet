-- Publish bilingual PokeNews about the new Packs system.
-- Idempotent insert to avoid duplicates on re-run.

INSERT INTO public.news_articles (
  title,
  title_en,
  content,
  content_en,
  category,
  is_pinned,
  is_active,
  published_at
)
SELECT
  'Atualizacao Grande: Sistema de Packs Completo no PokeRoullet',
  'Major Update: Full Pack System Now Live in PokeRoullet',
  'Treinadores, o sistema de Packs chegou em versao completa e agora e uma parte central da progressao do jogo.\n\n'
  || '**Como funciona o Starter Pack por regiao**\n'
  || '- Sempre que uma nova regiao for liberada para sua conta, voce tera um Starter Pack daquela regiao para abrir.\n'
  || '- Cada Starter Pack entrega 1 Pokemon inicial aleatorio da regiao correspondente.\n'
  || '- O Starter Pack de cada regiao pode ser aberto apenas 1 vez por conta/regiao.\n'
  || '- Em resumo: nova regiao desbloqueada = novo Starter Pack disponivel.\n\n'
  || '**Como funcionam os drops de Packs no Modo Treinador**\n'
  || '- Ao derrotar inimigos no Modo Treinador, o jogo faz rolagens de drop para packs.\n'
  || '- Os packs acumulados durante a run aparecem na interface e entram no seu inventario.\n'
  || '- Quanto mais voce joga e derrota inimigos, maior a chance pratica de acumular packs raros ao longo do tempo.\n\n'
  || '**Packs disponiveis atualmente e suas chances base de drop**\n'
  || '- Pack Brasa Comum: 0.70%\n'
  || '- Pack Aurora Incomum: 0.45%\n'
  || '- Pack Prisma Raro: 0.20%\n'
  || '- Pack Eclipse Epico: 0.065%\n'
  || '- Pack Reliquia Lendaria: 0.010%\n'
  || '- Pack Secreto Ruina Ancestral: 0.0020%\n\n'
  || '**O que cada pack entrega**\n'
  || '- Brasa, Aurora, Prisma, Eclipse e Reliquia: 5 cartas por abertura.\n'
  || '- Secreto Ruina Ancestral: 1 carta por abertura, com foco maximo em recompensa de elite.\n'
  || '- O pack secreto foi desenhado para ser extremamente raro e especial.\n\n'
  || '**Raridades e qualidade das cartas**\n'
  || '- Os packs usam pesos de raridade diferentes para common, uncommon, rare, pseudo, starter, legendary e secret.\n'
  || '- Packs mais raros tendem a aumentar a probabilidade de resultados de alta qualidade.\n'
  || '- O Pack Secreto Ruina Ancestral garante rolagem na faixa secret.\n\n'
  || '**Regioes desbloqueadas importam**\n'
  || '- A abertura de packs considera o conjunto de regioes desbloqueadas no seu perfil.\n'
  || '- Isso significa que sua progressao regional influencia o pool de Pokemon que pode aparecer.\n\n'
  || '**Dica de progressao**\n'
  || '- Priorize consistencia no Modo Treinador para farmar packs continuamente.\n'
  || '- Abra os packs em sequencia para aproveitar melhor a evolucao da sua colecao.\n'
  || '- Use o TradeHub para comprar e vender packs quando quiser acelerar estrategias especificas.\n\n'
  || 'Boa sorte nas aberturas e nos vemos no topo do PokeRoullet.',
  'Trainers, the Pack system is now fully live and has become a core part of game progression.\n\n'
  || '**How regional Starter Packs work**\n'
  || '- Whenever a new region is unlocked for your account, you get that region''s Starter Pack to open.\n'
  || '- Each Starter Pack gives 1 random starter Pokemon from its corresponding region.\n'
  || '- Each regional Starter Pack can only be opened once per account/region.\n'
  || '- In short: new unlocked region = new Starter Pack available.\n\n'
  || '**How Pack drops work in Trainer Mode**\n'
  || '- Defeating enemies in Trainer Mode triggers pack drop rolls.\n'
  || '- Packs earned during a run are shown in the run UI and added to your inventory.\n'
  || '- The more you play and defeat enemies, the better your practical odds of stacking rarer packs over time.\n\n'
  || '**Current packs and base drop chances**\n'
  || '- Ember Common Pack: 0.70%\n'
  || '- Aurora Uncommon Pack: 0.45%\n'
  || '- Prism Rare Pack: 0.20%\n'
  || '- Eclipse Epic Pack: 0.065%\n'
  || '- Relic Legendary Pack: 0.010%\n'
  || '- Secret Ancestral Ruin Pack: 0.0020%\n\n'
  || '**What each pack gives**\n'
  || '- Ember, Aurora, Prism, Eclipse, and Relic: 5 cards per opening.\n'
  || '- Secret Ancestral Ruin: 1 card per opening, focused on top-tier rewards.\n'
  || '- The secret pack is intentionally ultra-rare and premium.\n\n'
  || '**Rarity layers and card quality**\n'
  || '- Packs use different rarity weights for common, uncommon, rare, pseudo, starter, legendary, and secret.\n'
  || '- Rarer packs generally increase your chance of high-end outcomes.\n'
  || '- The Secret Ancestral Ruin pack guarantees a secret-tier roll.\n\n'
  || '**Unlocked regions matter**\n'
  || '- Pack openings use the set of regions unlocked in your profile.\n'
  || '- This means your regional progression directly affects the Pokemon pool available in openings.\n\n'
  || '**Progression tip**\n'
  || '- Stay consistent in Trainer Mode to farm packs steadily.\n'
  || '- Open packs in batches to improve collection momentum.\n'
  || '- Use TradeHub to buy/sell packs when you want to accelerate specific strategies.\n\n'
  || 'Good luck on your openings, and we will see you at the top of PokeRoullet.',
  'update',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.news_articles
  WHERE title = 'Atualizacao Grande: Sistema de Packs Completo no PokeRoullet'
);
