# Spin Regression Checklist

Use this checklist after any migration/update touching spin or roulette boosts.

## Preconditions
- User is authenticated.
- User has at least 4 free spins.
- User is level 5+ (required for multi-spin).
- Browser DevTools open on Network tab (filter: `rpc`).

## 1) Single Spin Smoke Test
1. Trigger one normal spin.
2. Confirm no error toast appears.
3. In Network, inspect `spin_pokemon_roulette` response.
4. Validate response contains:
   - `success = true`
   - `pokemon` object with `id`, `name`, `rarity`, `isShiny`
   - `xp_earned` > 0
   - `spins_remaining` changed consistently

Expected result: spin completes, result modal opens, inventory/profile refresh works.

## 2) Multi-Spin Smoke Test
1. Trigger one multi-spin.
2. Confirm no error toast appears.
3. In Network, inspect:
   - one call to `deduct_multi_spins`
   - N calls to `add_pokemon_without_spin` (N = spins deducted)
4. Validate each `add_pokemon_without_spin` response has `success = true` and `pokemon` payload.

Expected result: all captures show in result modal and inventory updates after batch.

## 3) Boost Behavior Sanity
1. If user has active roulette boosts, inspect responses for:
   - `spin_refunded` (may be true/false)
   - `shiny_chance_applied` (number)
   - `xp_earned` reflecting `xp_bonus` when applicable
2. If spin refund triggers, ensure total spins are consistent after operation.

Expected result: no RPC errors and boost effects appear in payload/behavior.

## 4) Regression Guard Queries
Run SQL from `supabase/sql/healthcheck_spin_rpcs.sql` in Supabase SQL Editor.

Expected result:
- No duplicate overloads for spin RPCs.
- Canonical signatures exist exactly once.
- Required roulette boost types are present.

## 5) Failure Signals
If something fails, capture:
- Exact frontend toast/error text.
- Full RPC error body from Network.
- Output of health-check SQL.
