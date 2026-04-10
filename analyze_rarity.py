import re
import json
from collections import defaultdict

# Define region ranges
regions = {
    "kanto": (1, 151),
    "johto": (152, 251),
    "hoenn": (252, 386),
    "sinnoh": (387, 493),
    "unova": (494, 649),
    "kalos": (650, 721),
    "alola": (722, 809),
}

# Store all Pokemon with their ID and rarity
all_pokemon = {}

# Read allPokemon.ts for Kanto, Johto, Hoenn, Sinnoh (1-493)
with open("src/data/allPokemon.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Extract Pokemon entries using regex
pokemon_pattern = r"\{ id: (\d+), name: '([^']+)', sprite: '[^']*', rarity: '([^']+)'"
for match in re.finditer(pokemon_pattern, content):
    id_num = int(match.group(1))
    name = match.group(2)
    rarity = match.group(3)
    all_pokemon[id_num] = {"name": name, "rarity": rarity}

# Read unovaPokemon.ts for Unova (494-649)
with open("src/data/unovaPokemon.ts", "r", encoding="utf-8") as f:
    content = f.read()

for match in re.finditer(pokemon_pattern, content):
    id_num = int(match.group(1))
    name = match.group(2)
    rarity = match.group(3)
    all_pokemon[id_num] = {"name": name, "rarity": rarity}

# Read kalosPokemon.ts for Kalos (650-721)
with open("src/data/kalosPokemon.ts", "r", encoding="utf-8") as f:
    content = f.read()

for match in re.finditer(pokemon_pattern, content):
    id_num = int(match.group(1))
    name = match.group(2)
    rarity = match.group(3)
    all_pokemon[id_num] = {"name": name, "rarity": rarity}

# Read alolaPokemon.ts for Alola (722-809)
with open("src/data/alolaPokemon.ts", "r", encoding="utf-8") as f:
    content = f.read()

for match in re.finditer(pokemon_pattern, content):
    id_num = int(match.group(1))
    name = match.group(2)
    rarity = match.group(3)
    all_pokemon[id_num] = {"name": name, "rarity": rarity}

print(f"Total Pokemon loaded: {len(all_pokemon)}")
print(f"ID range: {min(all_pokemon.keys())} to {max(all_pokemon.keys())}\n")

# Create result structure
result = {}
duplicates_with_different_rarity = []

for region_name, (start_id, end_id) in regions.items():
    region_rarity = defaultdict(list)
    rarity_counts = defaultdict(int)
    missing_pokemon = []
    
    for poke_id in range(start_id, end_id + 1):
        if poke_id in all_pokemon:
            rarity = all_pokemon[poke_id]["rarity"]
            name = all_pokemon[poke_id]["name"]
            region_rarity[rarity].append({"id": poke_id, "name": name})
            rarity_counts[rarity] += 1
        else:
            missing_pokemon.append(poke_id)
    
    # Create region data with counts only (concise format)
    region_data = {
        "total": sum(rarity_counts.values()),
    }
    
    # Add rarity counts
    for rarity in ["common", "uncommon", "rare", "starter", "pseudo", "legendary", "secret"]:
        count = rarity_counts.get(rarity, 0)
        region_data[rarity] = count
        if count > 0:
            region_data[f"{rarity}_list"] = [p["name"] for p in region_rarity.get(rarity, [])]
    
    result[region_name] = region_data
    
    # Print summary
    print(f"\n=== {region_name.upper()} (IDs {start_id}-{end_id}) ===")
    print(f"Total: {region_data['total']}")
    for rarity in ["common", "uncommon", "rare", "starter", "pseudo", "legendary", "secret"]:
        count = region_data.get(rarity, 0)
        if count > 0:
            print(f"  {rarity}: {count}")
    if missing_pokemon:
        print(f"  Missing: {len(missing_pokemon)} Pokemon")

# Check for Pokemon appearing in multiple regions with different rarities
print("\n\n=== CHECKING FOR POKEMON IN MULTIPLE REGIONS ===")
pokemon_regions = defaultdict(list)

for poke_id in sorted(all_pokemon.keys()):
    for region_name, (start_id, end_id) in regions.items():
        if start_id <= poke_id <= end_id:
            pokemon_regions[poke_id].append({
                "region": region_name,
                "rarity": all_pokemon[poke_id]["rarity"],
                "name": all_pokemon[poke_id]["name"]
            })

# Find discrepancies
discrepancies = []
for poke_id, locations in pokemon_regions.items():
    if len(locations) > 1:
        rarities = set(loc["rarity"] for loc in locations)
        if len(rarities) > 1:
            discrepancies.append({
                "id": poke_id,
                "name": all_pokemon[poke_id]["name"],
                "locations": locations
            })

if discrepancies:
    print(f"\nFound {len(discrepancies)} Pokemon with DIFFERENT rarities across regions:")
    for disc in discrepancies:
        print(f"\n  ID #{disc['id']}: {disc['name']}")
        for loc in disc['locations']:
            print(f"    - {loc['region']}: {loc['rarity']}")
else:
    print("\n✓ No Pokemon found with different rarities across regions!")

# Save JSON output
output = {
    "summary": result,
    "discrepancies": discrepancies,
    "total_pokemon": len(all_pokemon)
}

with open("rarity_analysis.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\n\nJSON saved to rarity_analysis.json")
