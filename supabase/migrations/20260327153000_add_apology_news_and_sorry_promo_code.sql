-- Publish apology PokeNews (PT/EN) and create compensation promo code SORRY.
-- Idempotent approach to avoid duplicates if migration is re-run.

-- 1) Ensure promo code exists with the intended rewards.
UPDATE public.promo_codes
SET reward_spins = 50,
  reward_shards = 20,
  reward_coins = 125,
    reward_gems = COALESCE(reward_gems, 0),
    reward_luck_potions = COALESCE(reward_luck_potions, 0),
    reward_shiny_potions = COALESCE(reward_shiny_potions, 0),
    reward_status_upgrades = COALESCE(reward_status_upgrades, 0),
    is_active = true
WHERE upper(code) = 'SORRY';

INSERT INTO public.promo_codes (
  code,
  reward_spins,
  reward_shards,
  reward_coins,
  reward_gems,
  reward_luck_potions,
  reward_shiny_potions,
  reward_status_upgrades,
  is_active
)
SELECT
  'SORRY',
  50,
  20,
  125,
  0,
  0,
  0,
  0,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.promo_codes
  WHERE upper(code) = 'SORRY'
);

-- 2) Publish bilingual apology news with redeem instructions.
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
  'Comunicado Oficial: Correcoes de Bugs + Codigo de Compensacao',
  'Official Notice: Bug Fixes + Compensation Code',
  'Treinadores, pedimos sinceras desculpas pelos problemas recentes envolvendo venda de Pokemon, progresso de missoes, evolucao e outros comportamentos inconsistentes.\n\nNossa equipe concluiu uma rodada completa de correcoes e os sistemas principais ja foram estabilizados.\n\nComo pedido de desculpas, liberamos um codigo especial de compensacao:\n\n**CODIGO: SORRY**\n\nRecompensas do codigo:\n- 50 giros gratis\n- 20 Pokeshards\n- 125 Pokecoins\n\nPasso a passo para resgatar:\n- Entre no jogo com sua conta\n- Abra seu Perfil\n- Va ate a area de codigos promocionais\n- Digite `SORRY`\n- Clique em Resgatar e colete as recompensas\n\nObrigado pela paciencia e por continuarem jogando com a gente. Vamos seguir melhorando o jogo para voce.',
  'Trainers, we sincerely apologize for the recent issues involving Pokemon selling, mission progress, evolution, and other inconsistent behaviors.\n\nOur team has completed a full round of fixes and the core systems are now stabilized.\n\nAs an apology, we released a special compensation code:\n\n**CODE: SORRY**\n\nCode rewards:\n- 50 free spins\n- 20 Pokeshards\n- 125 Pokecoins\n\nHow to redeem it:\n- Log into the game with your account\n- Open your Profile\n- Go to the promo code section\n- Enter `SORRY`\n- Click Redeem and collect your rewards\n\nThank you for your patience and for continuing to play with us. We will keep improving the game for you.',
  'announcement',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.news_articles
  WHERE title = 'Comunicado Oficial: Correcoes de Bugs + Codigo de Compensacao'
);
