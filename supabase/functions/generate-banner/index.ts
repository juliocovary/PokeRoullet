import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pokemon pools by star rating (only those that can appear in banner)
const POKEMON_POOLS = {
  1: [
    { id: 16, name: 'Pidgey', type: 'normal', secondaryType: 'flying', basePower: 100 },
    { id: 10, name: 'Caterpie', type: 'bug', basePower: 100 },
    { id: 69, name: 'Bellsprout', type: 'grass', secondaryType: 'poison', basePower: 100 },
    { id: 74, name: 'Geodude', type: 'rock', secondaryType: 'ground', basePower: 100 },
    { id: 66, name: 'Machop', type: 'fighting', basePower: 100 },
    { id: 13, name: 'Weedle', type: 'bug', secondaryType: 'poison', basePower: 100 },
    { id: 56, name: 'Mankey', type: 'fighting', basePower: 100 },
    { id: 60, name: 'Poliwag', type: 'water', basePower: 100 },
  ],
  2: [
    { id: 63, name: 'Abra', type: 'psychic', basePower: 180 },
    { id: 129, name: 'Magikarp', type: 'water', basePower: 180 },
    { id: 52, name: 'Meowth', type: 'normal', basePower: 180 },
    { id: 54, name: 'Psyduck', type: 'water', basePower: 180 },
    { id: 58, name: 'Growlithe', type: 'fire', basePower: 180 },
    { id: 92, name: 'Gastly', type: 'ghost', secondaryType: 'poison', basePower: 180 },
    { id: 133, name: 'Eevee', type: 'normal', basePower: 180 },
    { id: 77, name: 'Ponyta', type: 'fire', basePower: 180 },
    { id: 37, name: 'Vulpix', type: 'fire', basePower: 180 },
  ],
  3: [
    { id: 4, name: 'Charmander', type: 'fire', basePower: 320 },
    { id: 1, name: 'Bulbasaur', type: 'grass', secondaryType: 'poison', basePower: 320 },
    { id: 7, name: 'Squirtle', type: 'water', basePower: 320 },
    { id: 25, name: 'Pikachu', type: 'electric', basePower: 320 },
    { id: 147, name: 'Dratini', type: 'dragon', basePower: 320 },
    { id: 80, name: 'Slowbro', type: 'water', secondaryType: 'psychic', basePower: 320 },
    { id: 106, name: 'Hitmonlee', type: 'fighting', basePower: 320 },
    { id: 117, name: 'Seadra', type: 'water', basePower: 320 },
  ],
  4: [
    { id: 5, name: 'Charmeleon', type: 'fire', basePower: 550 },
    { id: 2, name: 'Ivysaur', type: 'grass', secondaryType: 'poison', basePower: 550 },
    { id: 8, name: 'Wartortle', type: 'water', basePower: 550 },
    { id: 148, name: 'Dragonair', type: 'dragon', basePower: 550 },
    { id: 143, name: 'Snorlax', type: 'normal', basePower: 550 },
    { id: 123, name: 'Scyther', type: 'bug', secondaryType: 'flying', basePower: 550 },
    { id: 131, name: 'Lapras', type: 'water', secondaryType: 'ice', basePower: 550 },
  ],
  5: [
    { id: 150, name: 'Mewtwo', type: 'psychic', basePower: 900 },
    { id: 145, name: 'Zapdos', type: 'electric', secondaryType: 'flying', basePower: 900 },
    { id: 144, name: 'Articuno', type: 'ice', secondaryType: 'flying', basePower: 900 },
    { id: 146, name: 'Moltres', type: 'fire', secondaryType: 'flying', basePower: 900 },
  ],
}

const BANNER_CHANCES = {
  1: 19.58, // ~19.58% each for 1-star (3 slots = 58.75%)
  2: 10,    // 10% each for 2-star (2 slots = 20%)
  3: 7,     // 7% each for 3-star (2 slots = 14%)
  4: 5,     // 5% for 4-star (1 slot)
  5: 2,     // 2% for 5-star (1 slot)
}

const BANNER_SLOTS = {
  1: 3, // 3 one-star slots
  2: 2, // 2 two-star slots
  3: 2, // 2 three-star slots
  4: 1, // 1 four-star slot
  5: 1, // 1 five-star slot
}

// Seeded random function for deterministic rotation
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const random = seededRandom(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateBannerPokemon(seed: number): Record<string, unknown>[] {
  const slots: Record<string, unknown>[] = []
  
  // Generate slots for each star rating
  for (let stars = 1; stars <= 5; stars++) {
    const pool = POKEMON_POOLS[stars as keyof typeof POKEMON_POOLS]
    const slotsNeeded = BANNER_SLOTS[stars as keyof typeof BANNER_SLOTS]
    const shuffled = shuffleWithSeed(pool, seed + stars)
    const selected = shuffled.slice(0, slotsNeeded)
    
    selected.forEach(pokemon => {
      slots.push({
        ...pokemon,
        starRating: stars,
        bannerChance: BANNER_CHANCES[stars as keyof typeof BANNER_CHANCES],
      })
    })
  }
  
  return slots
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const now = Date.now()
    const rotationMs = 30 * 60 * 1000 // 30 minutes
    const currentRotationStart = Math.floor(now / rotationMs) * rotationMs
    const seed = Math.floor(currentRotationStart / 1000) // Use rotation timestamp as seed
    
    // Check if we already have a valid banner
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banner_config')
      .select('*')
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }
    
    // Check if banner needs refresh
    const bannerStart = existingBanner?.current_rotation_start 
      ? new Date(existingBanner.current_rotation_start).getTime()
      : 0
    
    if (bannerStart >= currentRotationStart && existingBanner) {
      // Banner is still valid
      return new Response(JSON.stringify({
        success: true,
        banner: existingBanner,
        timeUntilRotation: Math.floor((currentRotationStart + rotationMs - now) / 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Generate new banner
    const bannerPokemon = generateBannerPokemon(seed)
    
    const bannerData = {
      current_rotation_start: new Date(currentRotationStart).toISOString(),
      rotation_interval_minutes: 30,
      slot_1_pokemon: bannerPokemon[0],
      slot_2_pokemon: bannerPokemon[1],
      slot_3_pokemon: bannerPokemon[2],
      slot_4_pokemon: bannerPokemon[3],
      slot_5_pokemon: bannerPokemon[4],
      slot_6_pokemon: bannerPokemon[5],
      slot_7_pokemon: bannerPokemon[6],
      slot_8_pokemon: bannerPokemon[7],
      slot_9_pokemon: bannerPokemon[8],
      updated_at: new Date().toISOString(),
    }
    
    let result
    if (existingBanner) {
      // Update existing banner
      const { data, error } = await supabase
        .from('banner_config')
        .update(bannerData)
        .eq('id', existingBanner.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Insert new banner
      const { data, error } = await supabase
        .from('banner_config')
        .insert(bannerData)
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    return new Response(JSON.stringify({
      success: true,
      banner: result,
      timeUntilRotation: Math.floor((currentRotationStart + rotationMs - now) / 1000)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error: unknown) {
    console.error('Error generating banner:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})