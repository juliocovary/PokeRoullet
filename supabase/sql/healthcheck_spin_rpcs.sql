-- Spin RPC health-check
-- Run in Supabase SQL Editor after migrations.

-- 1) Show all signatures for target RPCs (manual inspection)
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('spin_pokemon_roulette', 'add_pokemon_without_spin')
order by p.proname, args;

-- 2) Detect duplicate/legacy overloads (should return 0 rows)
select
  p.proname as function_name,
  count(*) as overload_count,
  string_agg(pg_get_function_identity_arguments(p.oid), ' | ' order by pg_get_function_identity_arguments(p.oid)) as signatures
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('spin_pokemon_roulette', 'add_pokemon_without_spin')
group by p.proname
having count(*) > 1;

-- 3) Assert canonical signatures exist exactly once
with expected as (
  select 'spin_pokemon_roulette'::text as function_name, 'p_user_id uuid, p_region text, p_pokemon_data jsonb'::text as args
  union all
  select 'add_pokemon_without_spin'::text, 'p_user_id uuid, p_region text, p_pokemon_data jsonb'::text
), actual as (
  select p.proname as function_name,
         pg_get_function_identity_arguments(p.oid) as args,
         count(*) over (partition by p.proname, pg_get_function_identity_arguments(p.oid)) as cnt
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('spin_pokemon_roulette', 'add_pokemon_without_spin')
)
select
  e.function_name,
  e.args as expected_args,
  coalesce(a.cnt, 0) as found_count,
  case when coalesce(a.cnt, 0) = 1 then 'OK' else 'MISMATCH' end as status
from expected e
left join actual a
  on a.function_name = e.function_name
 and a.args = e.args;

-- 4) Ensure required roulette boost types exist
select
  boost_type,
  count(*) as records
from roulette_boosts
where boost_type in ('shiny_chance', 'xp_bonus', 'spin_refund', 'luck_bonus', 'secret_chance')
group by boost_type
order by boost_type;

-- 5) Confirm boost-aware keys are present in function definitions
-- This is a lightweight guard that searches function source text.
select
  p.proname as function_name,
  (pg_get_functiondef(p.oid) ilike '%shiny_chance%') as has_shiny_chance_logic,
  (pg_get_functiondef(p.oid) ilike '%xp_bonus%') as has_xp_bonus_logic,
  (pg_get_functiondef(p.oid) ilike '%spin_refund%') as has_spin_refund_logic
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('spin_pokemon_roulette', 'add_pokemon_without_spin')
order by p.proname;
