import json

with open("rarity_analysis.json", "r") as f:
    data = json.load(f)

# Create a cleaner summary without the full lists
summary_only = {}

for region, region_data in data["summary"].items():
    summary_only[region] = {
        "total": region_data["total"],
        "common": region_data.get("common", 0),
        "uncommon": region_data.get("uncommon", 0),
        "rare": region_data.get("rare", 0),
        "starter": region_data.get("starter", 0),
        "pseudo": region_data.get("pseudo", 0),
        "legendary": region_data.get("legendary", 0),
        "secret": region_data.get("secret", 0),
    }

# Save simplified version
final_output = {
    "regions": summary_only,
    "discrepancies": data["discrepancies"],
    "total_pokemon": data["total_pokemon"],
    "analysis_date": "2026-04-04",
}

with open("rarity_summary.json", "w") as f:
    json.dump(final_output, f, indent=2)

print(json.dumps(summary_only, indent=2))
