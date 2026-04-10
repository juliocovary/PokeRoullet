# Pokémon Rarity Analysis by Region

**Analysis Date:** April 4, 2026  
**Total Pokémon Analyzed:** 809

---

## Summary by Region

### KANTO (IDs 1-151)
- **Total:** 151 Pokémon
- Common: 55 | Uncommon: 48 | Rare: 33 | Starter: 9 | Pseudo: 1 | Legendary: 4 | Secret: 1

### JOHTO (IDs 152-251)
- **Total:** 100 Pokémon
- Common: 26 | Uncommon: 37 | Rare: 21 | Starter: 9 | Pseudo: 1 | Legendary: 5 | Secret: 1

### HOENN (IDs 252-386)
- **Total:** 135 Pokémon
- Common: 41 | Uncommon: 54 | Rare: 19 | Starter: 9 | Pseudo: 2 | Legendary: 9 | Secret: 1

### SINNOH (IDs 387-493)
- **Total:** 107 Pokémon
- Common: 25 | Uncommon: 29 | Rare: 29 | Starter: 9 | Pseudo: 1 | Legendary: 13 | Secret: 1

### UNOVA (IDs 494-649)
- **Total:** 156 Pokémon
- Common: 47 | Uncommon: 54 | Rare: 32 | Starter: 9 | Pseudo: 1 | Legendary: 9 | Secret: 4

### KALOS (IDs 650-721)
- **Total:** 72 Pokémon
- Common: 21 | Uncommon: 27 | Rare: 8 | Starter: 9 | Pseudo: 1 | Legendary: 3 | Secret: 3

### ALOLA (IDs 722-809)
- **Total:** 88 Pokémon
- Common: 18 | Uncommon: 22 | Rare: 13 | Starter: 9 | Pseudo: 1 | Legendary: 20 | Secret: 5

---

## Key Statistics

| Rarity | Kanto | Johto | Hoenn | Sinnoh | Unova | Kalos | Alola |
|--------|-------|-------|--------|--------|--------|--------|--------|
| Common | 55 | 26 | 41 | 25 | 47 | 21 | 18 |
| Uncommon | 48 | 37 | 54 | 29 | 54 | 27 | 22 |
| Rare | 33 | 21 | 19 | 29 | 32 | 8 | 13 |
| Starter | 9 | 9 | 9 | 9 | 9 | 9 | 9 |
| Pseudo | 1 | 1 | 2 | 1 | 1 | 1 | 1 |
| Legendary | 4 | 5 | 9 | 13 | 9 | 3 | 20 |
| Secret | 1 | 1 | 1 | 1 | 4 | 3 | 5 |

---

## Discrepancy Report

✅ **NO DISCREPANCIES FOUND**

All Pokémon have been verified to have **consistent rarities** across all region definitions. There are no instances of the same Pokémon having different rarity classifications in different regions.

---

## Files Generated

1. **rarity_analysis.json** - Complete analysis with full Pokémon lists
2. **rarity_summary.json** - Simplified summary with counts only
3. **RARITY_REPORT.md** - This report

---

## Analysis Methodology

1. Pokémon were extracted from:
   - `src/data/allPokemon.ts` (Kanto, Johto, Hoenn, Sinnoh: IDs 1-493)
   - `src/data/unovaPokemon.ts` (Unova: IDs 494-649)
   - `src/data/kalosPokemon.ts` (Kalos: IDs 650-721)
   - `src/data/alolaPokemon.ts` (Alola: IDs 722-809)

2. Rarity classifications verified against region boundaries

3. All 809 Pokémon successfully validated

---

**Status:** ✅ All systems operational. No data integrity issues detected.
