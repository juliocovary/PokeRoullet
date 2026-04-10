-- Publish Johto update PokeNews and create promo code UPDTJOHTO.
-- Idempotent approach to avoid duplicates if the migration is re-run.

-- 1) Ensure promo code exists with the intended rewards.
UPDATE public.promo_codes
SET reward_spins = 0,
    reward_shards = 0,
    reward_coins = 0,
    reward_gems = 250,
    reward_luck_potions = COALESCE(reward_luck_potions, 0),
    reward_shiny_potions = COALESCE(reward_shiny_potions, 0),
    reward_status_upgrades = COALESCE(reward_status_upgrades, 0),
    is_active = true
WHERE upper(code) = 'UPDTJOHTO';

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
  'UPDTJOHTO',
  0,
  0,
  0,
  250,
  0,
  0,
  0,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.promo_codes
  WHERE upper(code) = 'UPDTJOHTO'
);

-- 2) Publish bilingual Johto update announcement.
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
  'Atualizacao Johto: novo banner, novas unidades e melhorias gerais',
  'Johto Update: new banner, new units, and overall improvements',
  'Treinadores, a proxima grande atualizacao de Johto chega nesta sexta-feira, as 20:00 no horario de Brasilia (BRT, GMT-3).

Para os jogadores dos Estados Unidos, o horario de referencia sera 19:00 na Eastern Time (ET) do mesmo dia, que corresponde a 23:00 GMT/UTC.

O que vem no update:
- Novo banner de Johto com rotação propia e novas regras regionais.
- Novas unidades de Johto adicionadas ao jogo.
- Unidades de Johto com poder base 20% maior do que as unidades equivalentes de Kanto.
- Melhorias de interface no modo Treinador, com ajustes de banners, inventario, selecao de equipe e telas de evolucao.
- Ajustes de equilibrio, evolucao e experiencia de uso para deixar a progressao mais fluida.
- Melhorias de estabilidade e polimento visual em varios pontos do modo treinador.

Detalhes importantes:
- O banner de Johto usa Pokegems.
- A roleta de Johto foi pensada para oferecer uma progressao mais agressiva e recompensadora.
- Algumas unidades de Johto foram distribuidas com foco em evolucao, mantendo a identidade da regiao.
- Tyranitar continua sendo uma unidade de evolucao e nao aparece diretamente no banner.

Codigo de recompensa:
- **UPDTJOHTO**
- Recompensa: 250 Pokegems
- Intencao: garantir 2 giros gratis na roleta de Johto.

Ativem seus alertas e preparem seus times. A nova fase de Johto vai trazer mais poder, mais estrategia e mais recompensas.',
  'Trainers, the next major Johto update arrives this Friday at 8:00 PM Brasília time (BRT, GMT-3).

For players in the United States, the reference time will be 7:00 PM Eastern Time (ET) on the same day, which corresponds to 11:00 PM GMT/UTC.

What is coming in the update:
- A new Johto banner with its own rotation and region-specific rules.
- New Johto units added to the game.
- Johto units with 20% higher base power than their Kanto counterparts.
- Interface improvements across Trainer Mode, including banner, inventory, team selection, and evolution screens.
- Balance, evolution, and progression tuning to make the flow smoother.
- Stability and visual polish improvements across several trainer-mode screens.

Important details:
- The Johto banner uses Pokegems.
- The Johto roulette was designed to feel more aggressive and rewarding.
- Some Johto units were added with evolution-first design to match the region identity.
- Tyranitar remains an evolution-only unit and does not appear directly in the banner.

Reward code:
- **UPDTJOHTO**
- Reward: 250 Pokegems
- Intent: enough value for 2 free spins in the Johto roulette.

Turn on your notifications and prepare your squads. Johto''s new phase is bringing more power, more strategy, and more rewards.',
  'announcement',
  true,
  true,
  '2026-04-10 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.news_articles
  WHERE title = 'Atualizacao Johto: novo banner, novas unidades e melhorias gerais'
);
