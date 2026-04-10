import json

with open("rarity_analysis.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("\n" + "="*80)
print("POKÉMON RARITY ANALYSIS BY REGION")
print("="*80)

regions_display = {
    "kanto": "KANTO (IDs 1-151)",
    "johto": "JOHTO (IDs 152-251)",
    "hoenn": "HOENN (IDs 252-386)",
    "sinnoh": "SINNOH (IDs 387-493)",
    "unova": "UNOVA (IDs 494-649)",
    "kalos": "KALOS (IDs 650-721)",
    "alola": "ALOLA (IDs 722-809)",
}

for region_key, region_label in regions_display.items():
    data_region = data["summary"][region_key]
    print(f"\n{'='*80}")
    print(f"{region_label:^80}")
    print(f"{'='*80}")
    print(f"Total Pokémon in region: {data_region['total']}")
    print(f"\nRarity Distribution:")
    print(f"  Common:     {data_region.get('common', 0):3d} Pokémon")
    print(f"  Uncommon:   {data_region.get('uncommon', 0):3d} Pokémon")
    print(f"  Rare:       {data_region.get('rare', 0):3d} Pokémon")
    print(f"  Starter:    {data_region.get('starter', 0):3d} Pokémon")
    print(f"  Pseudo:     {data_region.get('pseudo', 0):3d} Pokémon")
    print(f"  Legendary:  {data_region.get('legendary', 0):3d} Pokémon")
    print(f"  Secret:     {data_region.get('secret', 0):3d} Pokémon")

print(f"\n\n{'='*80}")
print("DISCREPANCY CHECK: Pokémon in Multiple Regions with Different Rarities")
print(f"{'='*80}")

if data["discrepancies"]:
    print(f"\nFound {len(data['discrepancies'])} discrepancies:")
    for disc in data["discrepancies"]:
        print(f"\n  ID #{disc['id']}: {disc['name'].upper()}")
        for loc in disc['locations']:
            print(f"    - {loc['region']:6s}: {loc['rarity']}")
else:
    print("\n✓ NO DISCREPANCIES FOUND!")
    print("  All Pokémon have consistent rarities across regions.")

print(f"\n\n{'='*80}")
print(f"TOTAL POKÉMON ANALYZED: {data['total_pokemon']}")
print(f"{'='*80}\n")
