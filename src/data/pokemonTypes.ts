// Complete Pokemon Type Mapping for all 649 Pokemon (Gen 1-5)
import { PokemonType } from './typeAdvantages';

export interface PokemonTypeInfo {
  primary: PokemonType;
  secondary?: PokemonType;
}

export const POKEMON_TYPES: Record<number, PokemonTypeInfo> = {
  // ===== KANTO (1-151) =====
  // Bulbasaur line
  1: { primary: 'grass', secondary: 'poison' },
  2: { primary: 'grass', secondary: 'poison' },
  3: { primary: 'grass', secondary: 'poison' },
  // Charmander line
  4: { primary: 'fire' },
  5: { primary: 'fire' },
  6: { primary: 'fire', secondary: 'flying' },
  // Squirtle line
  7: { primary: 'water' },
  8: { primary: 'water' },
  9: { primary: 'water' },
  // Caterpie line
  10: { primary: 'bug' },
  11: { primary: 'bug' },
  12: { primary: 'bug', secondary: 'flying' },
  // Weedle line
  13: { primary: 'bug', secondary: 'poison' },
  14: { primary: 'bug', secondary: 'poison' },
  15: { primary: 'bug', secondary: 'poison' },
  // Pidgey line
  16: { primary: 'normal', secondary: 'flying' },
  17: { primary: 'normal', secondary: 'flying' },
  18: { primary: 'normal', secondary: 'flying' },
  // Rattata line
  19: { primary: 'normal' },
  20: { primary: 'normal' },
  // Spearow line
  21: { primary: 'normal', secondary: 'flying' },
  22: { primary: 'normal', secondary: 'flying' },
  // Ekans line
  23: { primary: 'poison' },
  24: { primary: 'poison' },
  // Pikachu line
  25: { primary: 'electric' },
  26: { primary: 'electric' },
  // Sandshrew line
  27: { primary: 'ground' },
  28: { primary: 'ground' },
  // Nidoran♀ line
  29: { primary: 'poison' },
  30: { primary: 'poison' },
  31: { primary: 'poison', secondary: 'ground' },
  // Nidoran♂ line
  32: { primary: 'poison' },
  33: { primary: 'poison' },
  34: { primary: 'poison', secondary: 'ground' },
  // Clefairy line
  35: { primary: 'fairy' },
  36: { primary: 'fairy' },
  // Vulpix line
  37: { primary: 'fire' },
  38: { primary: 'fire' },
  // Jigglypuff line
  39: { primary: 'normal', secondary: 'fairy' },
  40: { primary: 'normal', secondary: 'fairy' },
  // Zubat line
  41: { primary: 'poison', secondary: 'flying' },
  42: { primary: 'poison', secondary: 'flying' },
  // Oddish line
  43: { primary: 'grass', secondary: 'poison' },
  44: { primary: 'grass', secondary: 'poison' },
  45: { primary: 'grass', secondary: 'poison' },
  // Paras line
  46: { primary: 'bug', secondary: 'grass' },
  47: { primary: 'bug', secondary: 'grass' },
  // Venonat line
  48: { primary: 'bug', secondary: 'poison' },
  49: { primary: 'bug', secondary: 'poison' },
  // Diglett line
  50: { primary: 'ground' },
  51: { primary: 'ground' },
  // Meowth line
  52: { primary: 'normal' },
  53: { primary: 'normal' },
  // Psyduck line
  54: { primary: 'water' },
  55: { primary: 'water' },
  // Mankey line
  56: { primary: 'fighting' },
  57: { primary: 'fighting' },
  // Growlithe line
  58: { primary: 'fire' },
  59: { primary: 'fire' },
  // Poliwag line
  60: { primary: 'water' },
  61: { primary: 'water' },
  62: { primary: 'water', secondary: 'fighting' },
  // Abra line
  63: { primary: 'psychic' },
  64: { primary: 'psychic' },
  65: { primary: 'psychic' },
  // Machop line
  66: { primary: 'fighting' },
  67: { primary: 'fighting' },
  68: { primary: 'fighting' },
  // Bellsprout line
  69: { primary: 'grass', secondary: 'poison' },
  70: { primary: 'grass', secondary: 'poison' },
  71: { primary: 'grass', secondary: 'poison' },
  // Tentacool line
  72: { primary: 'water', secondary: 'poison' },
  73: { primary: 'water', secondary: 'poison' },
  // Geodude line
  74: { primary: 'rock', secondary: 'ground' },
  75: { primary: 'rock', secondary: 'ground' },
  76: { primary: 'rock', secondary: 'ground' },
  // Ponyta line
  77: { primary: 'fire' },
  78: { primary: 'fire' },
  // Slowpoke line
  79: { primary: 'water', secondary: 'psychic' },
  80: { primary: 'water', secondary: 'psychic' },
  // Magnemite line
  81: { primary: 'electric', secondary: 'steel' },
  82: { primary: 'electric', secondary: 'steel' },
  // Farfetch'd
  83: { primary: 'normal', secondary: 'flying' },
  // Doduo line
  84: { primary: 'normal', secondary: 'flying' },
  85: { primary: 'normal', secondary: 'flying' },
  // Seel line
  86: { primary: 'water' },
  87: { primary: 'water', secondary: 'ice' },
  // Grimer line
  88: { primary: 'poison' },
  89: { primary: 'poison' },
  // Shellder line
  90: { primary: 'water' },
  91: { primary: 'water', secondary: 'ice' },
  // Gastly line
  92: { primary: 'ghost', secondary: 'poison' },
  93: { primary: 'ghost', secondary: 'poison' },
  94: { primary: 'ghost', secondary: 'poison' },
  // Onix
  95: { primary: 'rock', secondary: 'ground' },
  // Drowzee line
  96: { primary: 'psychic' },
  97: { primary: 'psychic' },
  // Krabby line
  98: { primary: 'water' },
  99: { primary: 'water' },
  // Voltorb line
  100: { primary: 'electric' },
  101: { primary: 'electric' },
  // Exeggcute line
  102: { primary: 'grass', secondary: 'psychic' },
  103: { primary: 'grass', secondary: 'psychic' },
  // Cubone line
  104: { primary: 'ground' },
  105: { primary: 'ground' },
  // Hitmonlee, Hitmonchan, Tyrogue
  106: { primary: 'fighting' },
  107: { primary: 'fighting' },
  // Lickitung
  108: { primary: 'normal' },
  // Koffing line
  109: { primary: 'poison' },
  110: { primary: 'poison' },
  // Rhyhorn line
  111: { primary: 'ground', secondary: 'rock' },
  112: { primary: 'ground', secondary: 'rock' },
  // Chansey
  113: { primary: 'normal' },
  // Tangela
  114: { primary: 'grass' },
  // Kangaskhan
  115: { primary: 'normal' },
  // Horsea line
  116: { primary: 'water' },
  117: { primary: 'water' },
  // Goldeen line
  118: { primary: 'water' },
  119: { primary: 'water' },
  // Staryu line
  120: { primary: 'water' },
  121: { primary: 'water', secondary: 'psychic' },
  // Mr. Mime
  122: { primary: 'psychic', secondary: 'fairy' },
  // Scyther
  123: { primary: 'bug', secondary: 'flying' },
  // Jynx
  124: { primary: 'ice', secondary: 'psychic' },
  // Electabuzz
  125: { primary: 'electric' },
  // Magmar
  126: { primary: 'fire' },
  // Pinsir
  127: { primary: 'bug' },
  // Tauros
  128: { primary: 'normal' },
  // Magikarp line
  129: { primary: 'water' },
  130: { primary: 'water', secondary: 'flying' },
  // Lapras
  131: { primary: 'water', secondary: 'ice' },
  // Ditto
  132: { primary: 'normal' },
  // Eevee line
  133: { primary: 'normal' },
  134: { primary: 'water' },
  135: { primary: 'electric' },
  136: { primary: 'fire' },
  // Porygon
  137: { primary: 'normal' },
  // Omanyte line
  138: { primary: 'rock', secondary: 'water' },
  139: { primary: 'rock', secondary: 'water' },
  // Kabuto line
  140: { primary: 'rock', secondary: 'water' },
  141: { primary: 'rock', secondary: 'water' },
  // Aerodactyl
  142: { primary: 'rock', secondary: 'flying' },
  // Snorlax
  143: { primary: 'normal' },
  // Legendary Birds
  144: { primary: 'ice', secondary: 'flying' },
  145: { primary: 'electric', secondary: 'flying' },
  146: { primary: 'fire', secondary: 'flying' },
  // Dratini line
  147: { primary: 'dragon' },
  148: { primary: 'dragon' },
  149: { primary: 'dragon', secondary: 'flying' },
  // Mewtwo & Mew
  150: { primary: 'psychic' },
  151: { primary: 'psychic' },

  // ===== JOHTO (152-251) =====
  // Chikorita line
  152: { primary: 'grass' },
  153: { primary: 'grass' },
  154: { primary: 'grass' },
  // Cyndaquil line
  155: { primary: 'fire' },
  156: { primary: 'fire' },
  157: { primary: 'fire' },
  // Totodile line
  158: { primary: 'water' },
  159: { primary: 'water' },
  160: { primary: 'water' },
  // Sentret line
  161: { primary: 'normal' },
  162: { primary: 'normal' },
  // Hoothoot line
  163: { primary: 'normal', secondary: 'flying' },
  164: { primary: 'normal', secondary: 'flying' },
  // Ledyba line
  165: { primary: 'bug', secondary: 'flying' },
  166: { primary: 'bug', secondary: 'flying' },
  // Spinarak line
  167: { primary: 'bug', secondary: 'poison' },
  168: { primary: 'bug', secondary: 'poison' },
  // Crobat
  169: { primary: 'poison', secondary: 'flying' },
  // Chinchou line
  170: { primary: 'water', secondary: 'electric' },
  171: { primary: 'water', secondary: 'electric' },
  // Pichu
  172: { primary: 'electric' },
  // Cleffa
  173: { primary: 'fairy' },
  // Igglybuff
  174: { primary: 'normal', secondary: 'fairy' },
  // Togepi line
  175: { primary: 'fairy' },
  176: { primary: 'fairy', secondary: 'flying' },
  // Natu line
  177: { primary: 'psychic', secondary: 'flying' },
  178: { primary: 'psychic', secondary: 'flying' },
  // Mareep line
  179: { primary: 'electric' },
  180: { primary: 'electric' },
  181: { primary: 'electric' },
  // Bellossom
  182: { primary: 'grass' },
  // Marill line
  183: { primary: 'water', secondary: 'fairy' },
  184: { primary: 'water', secondary: 'fairy' },
  // Sudowoodo
  185: { primary: 'rock' },
  // Politoed
  186: { primary: 'water' },
  // Hoppip line
  187: { primary: 'grass', secondary: 'flying' },
  188: { primary: 'grass', secondary: 'flying' },
  189: { primary: 'grass', secondary: 'flying' },
  // Aipom
  190: { primary: 'normal' },
  // Sunkern line
  191: { primary: 'grass' },
  192: { primary: 'grass' },
  // Yanma
  193: { primary: 'bug', secondary: 'flying' },
  // Wooper line
  194: { primary: 'water', secondary: 'ground' },
  195: { primary: 'water', secondary: 'ground' },
  // Espeon
  196: { primary: 'psychic' },
  // Umbreon
  197: { primary: 'dark' },
  // Murkrow
  198: { primary: 'dark', secondary: 'flying' },
  // Slowking
  199: { primary: 'water', secondary: 'psychic' },
  // Misdreavus
  200: { primary: 'ghost' },
  // Unown
  201: { primary: 'psychic' },
  // Wobbuffet
  202: { primary: 'psychic' },
  // Girafarig
  203: { primary: 'normal', secondary: 'psychic' },
  // Pineco line
  204: { primary: 'bug' },
  205: { primary: 'bug', secondary: 'steel' },
  // Dunsparce
  206: { primary: 'normal' },
  // Gligar
  207: { primary: 'ground', secondary: 'flying' },
  // Steelix
  208: { primary: 'steel', secondary: 'ground' },
  // Snubbull line
  209: { primary: 'fairy' },
  210: { primary: 'fairy' },
  // Qwilfish
  211: { primary: 'water', secondary: 'poison' },
  // Scizor
  212: { primary: 'bug', secondary: 'steel' },
  // Shuckle
  213: { primary: 'bug', secondary: 'rock' },
  // Heracross
  214: { primary: 'bug', secondary: 'fighting' },
  // Sneasel
  215: { primary: 'dark', secondary: 'ice' },
  // Teddiursa line
  216: { primary: 'normal' },
  217: { primary: 'normal' },
  // Slugma line
  218: { primary: 'fire' },
  219: { primary: 'fire', secondary: 'rock' },
  // Swinub line
  220: { primary: 'ice', secondary: 'ground' },
  221: { primary: 'ice', secondary: 'ground' },
  // Corsola
  222: { primary: 'water', secondary: 'rock' },
  // Remoraid line
  223: { primary: 'water' },
  224: { primary: 'water' },
  // Delibird
  225: { primary: 'ice', secondary: 'flying' },
  // Mantine
  226: { primary: 'water', secondary: 'flying' },
  // Skarmory
  227: { primary: 'steel', secondary: 'flying' },
  // Houndour line
  228: { primary: 'dark', secondary: 'fire' },
  229: { primary: 'dark', secondary: 'fire' },
  // Kingdra
  230: { primary: 'water', secondary: 'dragon' },
  // Phanpy line
  231: { primary: 'ground' },
  232: { primary: 'ground' },
  // Porygon2
  233: { primary: 'normal' },
  // Stantler
  234: { primary: 'normal' },
  // Smeargle
  235: { primary: 'normal' },
  // Tyrogue
  236: { primary: 'fighting' },
  // Hitmontop
  237: { primary: 'fighting' },
  // Smoochum
  238: { primary: 'ice', secondary: 'psychic' },
  // Elekid
  239: { primary: 'electric' },
  // Magby
  240: { primary: 'fire' },
  // Miltank
  241: { primary: 'normal' },
  // Blissey
  242: { primary: 'normal' },
  // Legendary Beasts
  243: { primary: 'electric' },
  244: { primary: 'fire' },
  245: { primary: 'water' },
  // Larvitar line
  246: { primary: 'rock', secondary: 'ground' },
  247: { primary: 'rock', secondary: 'ground' },
  248: { primary: 'rock', secondary: 'dark' },
  // Lugia
  249: { primary: 'psychic', secondary: 'flying' },
  // Ho-Oh
  250: { primary: 'fire', secondary: 'flying' },
  // Celebi
  251: { primary: 'psychic', secondary: 'grass' },

  // ===== HOENN (252-386) =====
  // Treecko line
  252: { primary: 'grass' },
  253: { primary: 'grass' },
  254: { primary: 'grass' },
  // Torchic line
  255: { primary: 'fire' },
  256: { primary: 'fire', secondary: 'fighting' },
  257: { primary: 'fire', secondary: 'fighting' },
  // Mudkip line
  258: { primary: 'water' },
  259: { primary: 'water', secondary: 'ground' },
  260: { primary: 'water', secondary: 'ground' },
  // Poochyena line
  261: { primary: 'dark' },
  262: { primary: 'dark' },
  // Zigzagoon line
  263: { primary: 'normal' },
  264: { primary: 'normal' },
  // Wurmple line
  265: { primary: 'bug' },
  266: { primary: 'bug' },
  267: { primary: 'bug', secondary: 'flying' },
  268: { primary: 'bug' },
  269: { primary: 'bug', secondary: 'poison' },
  // Lotad line
  270: { primary: 'water', secondary: 'grass' },
  271: { primary: 'water', secondary: 'grass' },
  272: { primary: 'water', secondary: 'grass' },
  // Seedot line
  273: { primary: 'grass' },
  274: { primary: 'grass', secondary: 'dark' },
  275: { primary: 'grass', secondary: 'dark' },
  // Taillow line
  276: { primary: 'normal', secondary: 'flying' },
  277: { primary: 'normal', secondary: 'flying' },
  // Wingull line
  278: { primary: 'water', secondary: 'flying' },
  279: { primary: 'water', secondary: 'flying' },
  // Ralts line
  280: { primary: 'psychic', secondary: 'fairy' },
  281: { primary: 'psychic', secondary: 'fairy' },
  282: { primary: 'psychic', secondary: 'fairy' },
  // Surskit line
  283: { primary: 'bug', secondary: 'water' },
  284: { primary: 'bug', secondary: 'flying' },
  // Shroomish line
  285: { primary: 'grass' },
  286: { primary: 'grass', secondary: 'fighting' },
  // Slakoth line
  287: { primary: 'normal' },
  288: { primary: 'normal' },
  289: { primary: 'normal' },
  // Nincada line
  290: { primary: 'bug', secondary: 'ground' },
  291: { primary: 'bug', secondary: 'flying' },
  292: { primary: 'bug', secondary: 'ghost' },
  // Whismur line
  293: { primary: 'normal' },
  294: { primary: 'normal' },
  295: { primary: 'normal' },
  // Makuhita line
  296: { primary: 'fighting' },
  297: { primary: 'fighting' },
  // Azurill
  298: { primary: 'normal', secondary: 'fairy' },
  // Nosepass
  299: { primary: 'rock' },
  // Skitty line
  300: { primary: 'normal' },
  301: { primary: 'normal' },
  // Sableye
  302: { primary: 'dark', secondary: 'ghost' },
  // Mawile
  303: { primary: 'steel', secondary: 'fairy' },
  // Aron line
  304: { primary: 'steel', secondary: 'rock' },
  305: { primary: 'steel', secondary: 'rock' },
  306: { primary: 'steel', secondary: 'rock' },
  // Meditite line
  307: { primary: 'fighting', secondary: 'psychic' },
  308: { primary: 'fighting', secondary: 'psychic' },
  // Electrike line
  309: { primary: 'electric' },
  310: { primary: 'electric' },
  // Plusle & Minun
  311: { primary: 'electric' },
  312: { primary: 'electric' },
  // Volbeat & Illumise
  313: { primary: 'bug' },
  314: { primary: 'bug' },
  // Roselia
  315: { primary: 'grass', secondary: 'poison' },
  // Gulpin line
  316: { primary: 'poison' },
  317: { primary: 'poison' },
  // Carvanha line
  318: { primary: 'water', secondary: 'dark' },
  319: { primary: 'water', secondary: 'dark' },
  // Wailmer line
  320: { primary: 'water' },
  321: { primary: 'water' },
  // Numel line
  322: { primary: 'fire', secondary: 'ground' },
  323: { primary: 'fire', secondary: 'ground' },
  // Torkoal
  324: { primary: 'fire' },
  // Spoink line
  325: { primary: 'psychic' },
  326: { primary: 'psychic' },
  // Spinda
  327: { primary: 'normal' },
  // Trapinch line
  328: { primary: 'ground' },
  329: { primary: 'ground', secondary: 'dragon' },
  330: { primary: 'ground', secondary: 'dragon' },
  // Cacnea line
  331: { primary: 'grass' },
  332: { primary: 'grass', secondary: 'dark' },
  // Swablu line
  333: { primary: 'normal', secondary: 'flying' },
  334: { primary: 'dragon', secondary: 'flying' },
  // Zangoose
  335: { primary: 'normal' },
  // Seviper
  336: { primary: 'poison' },
  // Lunatone
  337: { primary: 'rock', secondary: 'psychic' },
  // Solrock
  338: { primary: 'rock', secondary: 'psychic' },
  // Barboach line
  339: { primary: 'water', secondary: 'ground' },
  340: { primary: 'water', secondary: 'ground' },
  // Corphish line
  341: { primary: 'water' },
  342: { primary: 'water', secondary: 'dark' },
  // Baltoy line
  343: { primary: 'ground', secondary: 'psychic' },
  344: { primary: 'ground', secondary: 'psychic' },
  // Lileep line
  345: { primary: 'rock', secondary: 'grass' },
  346: { primary: 'rock', secondary: 'grass' },
  // Anorith line
  347: { primary: 'rock', secondary: 'bug' },
  348: { primary: 'rock', secondary: 'bug' },
  // Feebas line
  349: { primary: 'water' },
  350: { primary: 'water' },
  // Castform
  351: { primary: 'normal' },
  // Kecleon
  352: { primary: 'normal' },
  // Shuppet line
  353: { primary: 'ghost' },
  354: { primary: 'ghost' },
  // Duskull line
  355: { primary: 'ghost' },
  356: { primary: 'ghost' },
  // Tropius
  357: { primary: 'grass', secondary: 'flying' },
  // Chimecho
  358: { primary: 'psychic' },
  // Absol
  359: { primary: 'dark' },
  // Wynaut
  360: { primary: 'psychic' },
  // Snorunt line
  361: { primary: 'ice' },
  362: { primary: 'ice' },
  // Spheal line
  363: { primary: 'ice', secondary: 'water' },
  364: { primary: 'ice', secondary: 'water' },
  365: { primary: 'ice', secondary: 'water' },
  // Clamperl line
  366: { primary: 'water' },
  367: { primary: 'water' },
  368: { primary: 'water' },
  // Relicanth
  369: { primary: 'water', secondary: 'rock' },
  // Luvdisc
  370: { primary: 'water' },
  // Bagon line
  371: { primary: 'dragon' },
  372: { primary: 'dragon' },
  373: { primary: 'dragon', secondary: 'flying' },
  // Beldum line
  374: { primary: 'steel', secondary: 'psychic' },
  375: { primary: 'steel', secondary: 'psychic' },
  376: { primary: 'steel', secondary: 'psychic' },
  // Regis
  377: { primary: 'rock' },
  378: { primary: 'ice' },
  379: { primary: 'steel' },
  // Latias & Latios
  380: { primary: 'dragon', secondary: 'psychic' },
  381: { primary: 'dragon', secondary: 'psychic' },
  // Kyogre
  382: { primary: 'water' },
  // Groudon
  383: { primary: 'ground' },
  // Rayquaza
  384: { primary: 'dragon', secondary: 'flying' },
  // Jirachi
  385: { primary: 'steel', secondary: 'psychic' },
  // Deoxys
  386: { primary: 'psychic' },

  // ===== SINNOH (387-493) =====
  // Turtwig line
  387: { primary: 'grass' },
  388: { primary: 'grass' },
  389: { primary: 'grass', secondary: 'ground' },
  // Chimchar line
  390: { primary: 'fire' },
  391: { primary: 'fire', secondary: 'fighting' },
  392: { primary: 'fire', secondary: 'fighting' },
  // Piplup line
  393: { primary: 'water' },
  394: { primary: 'water' },
  395: { primary: 'water', secondary: 'steel' },
  // Starly line
  396: { primary: 'normal', secondary: 'flying' },
  397: { primary: 'normal', secondary: 'flying' },
  398: { primary: 'normal', secondary: 'flying' },
  // Bidoof line
  399: { primary: 'normal' },
  400: { primary: 'normal', secondary: 'water' },
  // Kricketot line
  401: { primary: 'bug' },
  402: { primary: 'bug' },
  // Shinx line
  403: { primary: 'electric' },
  404: { primary: 'electric' },
  405: { primary: 'electric' },
  // Budew
  406: { primary: 'grass', secondary: 'poison' },
  // Roserade
  407: { primary: 'grass', secondary: 'poison' },
  // Cranidos line
  408: { primary: 'rock' },
  409: { primary: 'rock' },
  // Shieldon line
  410: { primary: 'rock', secondary: 'steel' },
  411: { primary: 'rock', secondary: 'steel' },
  // Burmy line
  412: { primary: 'bug' },
  413: { primary: 'bug', secondary: 'grass' },
  414: { primary: 'bug', secondary: 'flying' },
  // Combee line
  415: { primary: 'bug', secondary: 'flying' },
  416: { primary: 'bug', secondary: 'flying' },
  // Pachirisu
  417: { primary: 'electric' },
  // Buizel line
  418: { primary: 'water' },
  419: { primary: 'water' },
  // Cherubi line
  420: { primary: 'grass' },
  421: { primary: 'grass' },
  // Shellos line
  422: { primary: 'water' },
  423: { primary: 'water', secondary: 'ground' },
  // Ambipom
  424: { primary: 'normal' },
  // Drifloon line
  425: { primary: 'ghost', secondary: 'flying' },
  426: { primary: 'ghost', secondary: 'flying' },
  // Buneary line
  427: { primary: 'normal' },
  428: { primary: 'normal' },
  // Mismagius
  429: { primary: 'ghost' },
  // Honchkrow
  430: { primary: 'dark', secondary: 'flying' },
  // Glameow line
  431: { primary: 'normal' },
  432: { primary: 'normal' },
  // Chingling
  433: { primary: 'psychic' },
  // Stunky line
  434: { primary: 'poison', secondary: 'dark' },
  435: { primary: 'poison', secondary: 'dark' },
  // Bronzor line
  436: { primary: 'steel', secondary: 'psychic' },
  437: { primary: 'steel', secondary: 'psychic' },
  // Bonsly
  438: { primary: 'rock' },
  // Mime Jr.
  439: { primary: 'psychic', secondary: 'fairy' },
  // Happiny
  440: { primary: 'normal' },
  // Chatot
  441: { primary: 'normal', secondary: 'flying' },
  // Spiritomb
  442: { primary: 'ghost', secondary: 'dark' },
  // Gible line
  443: { primary: 'dragon', secondary: 'ground' },
  444: { primary: 'dragon', secondary: 'ground' },
  445: { primary: 'dragon', secondary: 'ground' },
  // Munchlax
  446: { primary: 'normal' },
  // Riolu line
  447: { primary: 'fighting' },
  448: { primary: 'fighting', secondary: 'steel' },
  // Hippopotas line
  449: { primary: 'ground' },
  450: { primary: 'ground' },
  // Skorupi line
  451: { primary: 'poison', secondary: 'bug' },
  452: { primary: 'poison', secondary: 'dark' },
  // Croagunk line
  453: { primary: 'poison', secondary: 'fighting' },
  454: { primary: 'poison', secondary: 'fighting' },
  // Carnivine
  455: { primary: 'grass' },
  // Finneon line
  456: { primary: 'water' },
  457: { primary: 'water' },
  // Mantyke
  458: { primary: 'water', secondary: 'flying' },
  // Snover line
  459: { primary: 'grass', secondary: 'ice' },
  460: { primary: 'grass', secondary: 'ice' },
  // Weavile
  461: { primary: 'dark', secondary: 'ice' },
  // Magnezone
  462: { primary: 'electric', secondary: 'steel' },
  // Lickilicky
  463: { primary: 'normal' },
  // Rhyperior
  464: { primary: 'ground', secondary: 'rock' },
  // Tangrowth
  465: { primary: 'grass' },
  // Electivire
  466: { primary: 'electric' },
  // Magmortar
  467: { primary: 'fire' },
  // Togekiss
  468: { primary: 'fairy', secondary: 'flying' },
  // Yanmega
  469: { primary: 'bug', secondary: 'flying' },
  // Leafeon
  470: { primary: 'grass' },
  // Glaceon
  471: { primary: 'ice' },
  // Gliscor
  472: { primary: 'ground', secondary: 'flying' },
  // Mamoswine
  473: { primary: 'ice', secondary: 'ground' },
  // Porygon-Z
  474: { primary: 'normal' },
  // Gallade
  475: { primary: 'psychic', secondary: 'fighting' },
  // Probopass
  476: { primary: 'rock', secondary: 'steel' },
  // Dusknoir
  477: { primary: 'ghost' },
  // Froslass
  478: { primary: 'ice', secondary: 'ghost' },
  // Rotom
  479: { primary: 'electric', secondary: 'ghost' },
  // Uxie
  480: { primary: 'psychic' },
  // Mesprit
  481: { primary: 'psychic' },
  // Azelf
  482: { primary: 'psychic' },
  // Dialga
  483: { primary: 'steel', secondary: 'dragon' },
  // Palkia
  484: { primary: 'water', secondary: 'dragon' },
  // Heatran
  485: { primary: 'fire', secondary: 'steel' },
  // Regigigas
  486: { primary: 'normal' },
  // Giratina
  487: { primary: 'ghost', secondary: 'dragon' },
  // Cresselia
  488: { primary: 'psychic' },
  // Phione
  489: { primary: 'water' },
  // Manaphy
  490: { primary: 'water' },
  // Darkrai
  491: { primary: 'dark' },
  // Shaymin
  492: { primary: 'grass' },
  // Arceus
  493: { primary: 'normal' },

  // ===== UNOVA (494-649) =====
  // Victini
  494: { primary: 'psychic', secondary: 'fire' },
  // Snivy line
  495: { primary: 'grass' },
  496: { primary: 'grass' },
  497: { primary: 'grass' },
  // Tepig line
  498: { primary: 'fire' },
  499: { primary: 'fire', secondary: 'fighting' },
  500: { primary: 'fire', secondary: 'fighting' },
  // Oshawott line
  501: { primary: 'water' },
  502: { primary: 'water' },
  503: { primary: 'water' },
  // Patrat line
  504: { primary: 'normal' },
  505: { primary: 'normal' },
  // Lillipup line
  506: { primary: 'normal' },
  507: { primary: 'normal' },
  508: { primary: 'normal' },
  // Purrloin line
  509: { primary: 'dark' },
  510: { primary: 'dark' },
  // Pansage line
  511: { primary: 'grass' },
  512: { primary: 'grass' },
  // Pansear line
  513: { primary: 'fire' },
  514: { primary: 'fire' },
  // Panpour line
  515: { primary: 'water' },
  516: { primary: 'water' },
  // Munna line
  517: { primary: 'psychic' },
  518: { primary: 'psychic' },
  // Pidove line
  519: { primary: 'normal', secondary: 'flying' },
  520: { primary: 'normal', secondary: 'flying' },
  521: { primary: 'normal', secondary: 'flying' },
  // Blitzle line
  522: { primary: 'electric' },
  523: { primary: 'electric' },
  // Roggenrola line
  524: { primary: 'rock' },
  525: { primary: 'rock' },
  526: { primary: 'rock' },
  // Woobat line
  527: { primary: 'psychic', secondary: 'flying' },
  528: { primary: 'psychic', secondary: 'flying' },
  // Drilbur line
  529: { primary: 'ground' },
  530: { primary: 'ground', secondary: 'steel' },
  // Audino
  531: { primary: 'normal' },
  // Timburr line
  532: { primary: 'fighting' },
  533: { primary: 'fighting' },
  534: { primary: 'fighting' },
  // Tympole line
  535: { primary: 'water' },
  536: { primary: 'water', secondary: 'ground' },
  537: { primary: 'water', secondary: 'ground' },
  // Throh
  538: { primary: 'fighting' },
  // Sawk
  539: { primary: 'fighting' },
  // Sewaddle line
  540: { primary: 'bug', secondary: 'grass' },
  541: { primary: 'bug', secondary: 'grass' },
  542: { primary: 'bug', secondary: 'grass' },
  // Venipede line
  543: { primary: 'bug', secondary: 'poison' },
  544: { primary: 'bug', secondary: 'poison' },
  545: { primary: 'bug', secondary: 'poison' },
  // Cottonee line
  546: { primary: 'grass', secondary: 'fairy' },
  547: { primary: 'grass', secondary: 'fairy' },
  // Petilil line
  548: { primary: 'grass' },
  549: { primary: 'grass' },
  // Basculin
  550: { primary: 'water' },
  // Sandile line
  551: { primary: 'ground', secondary: 'dark' },
  552: { primary: 'ground', secondary: 'dark' },
  553: { primary: 'ground', secondary: 'dark' },
  // Darumaka line
  554: { primary: 'fire' },
  555: { primary: 'fire' },
  // Maractus
  556: { primary: 'grass' },
  // Dwebble line
  557: { primary: 'bug', secondary: 'rock' },
  558: { primary: 'bug', secondary: 'rock' },
  // Scraggy line
  559: { primary: 'dark', secondary: 'fighting' },
  560: { primary: 'dark', secondary: 'fighting' },
  // Sigilyph
  561: { primary: 'psychic', secondary: 'flying' },
  // Yamask line
  562: { primary: 'ghost' },
  563: { primary: 'ghost' },
  // Tirtouga line
  564: { primary: 'water', secondary: 'rock' },
  565: { primary: 'water', secondary: 'rock' },
  // Archen line
  566: { primary: 'rock', secondary: 'flying' },
  567: { primary: 'rock', secondary: 'flying' },
  // Trubbish line
  568: { primary: 'poison' },
  569: { primary: 'poison' },
  // Zorua line
  570: { primary: 'dark' },
  571: { primary: 'dark' },
  // Minccino line
  572: { primary: 'normal' },
  573: { primary: 'normal' },
  // Gothita line
  574: { primary: 'psychic' },
  575: { primary: 'psychic' },
  576: { primary: 'psychic' },
  // Solosis line
  577: { primary: 'psychic' },
  578: { primary: 'psychic' },
  579: { primary: 'psychic' },
  // Ducklett line
  580: { primary: 'water', secondary: 'flying' },
  581: { primary: 'water', secondary: 'flying' },
  // Vanillite line
  582: { primary: 'ice' },
  583: { primary: 'ice' },
  584: { primary: 'ice' },
  // Deerling line
  585: { primary: 'normal', secondary: 'grass' },
  586: { primary: 'normal', secondary: 'grass' },
  // Emolga
  587: { primary: 'electric', secondary: 'flying' },
  // Karrablast line
  588: { primary: 'bug' },
  589: { primary: 'bug', secondary: 'steel' },
  // Foongus line
  590: { primary: 'grass', secondary: 'poison' },
  591: { primary: 'grass', secondary: 'poison' },
  // Frillish line
  592: { primary: 'water', secondary: 'ghost' },
  593: { primary: 'water', secondary: 'ghost' },
  // Alomomola
  594: { primary: 'water' },
  // Joltik line
  595: { primary: 'bug', secondary: 'electric' },
  596: { primary: 'bug', secondary: 'electric' },
  // Ferroseed line
  597: { primary: 'grass', secondary: 'steel' },
  598: { primary: 'grass', secondary: 'steel' },
  // Klink line
  599: { primary: 'steel' },
  600: { primary: 'steel' },
  601: { primary: 'steel' },
  // Tynamo line
  602: { primary: 'electric' },
  603: { primary: 'electric' },
  604: { primary: 'electric' },
  // Elgyem line
  605: { primary: 'psychic' },
  606: { primary: 'psychic' },
  // Litwick line
  607: { primary: 'ghost', secondary: 'fire' },
  608: { primary: 'ghost', secondary: 'fire' },
  609: { primary: 'ghost', secondary: 'fire' },
  // Axew line
  610: { primary: 'dragon' },
  611: { primary: 'dragon' },
  612: { primary: 'dragon' },
  // Cubchoo line
  613: { primary: 'ice' },
  614: { primary: 'ice' },
  // Cryogonal
  615: { primary: 'ice' },
  // Shelmet line
  616: { primary: 'bug' },
  617: { primary: 'bug' },
  // Stunfisk
  618: { primary: 'ground', secondary: 'electric' },
  // Mienfoo line
  619: { primary: 'fighting' },
  620: { primary: 'fighting' },
  // Druddigon
  621: { primary: 'dragon' },
  // Golett line
  622: { primary: 'ground', secondary: 'ghost' },
  623: { primary: 'ground', secondary: 'ghost' },
  // Pawniard line
  624: { primary: 'dark', secondary: 'steel' },
  625: { primary: 'dark', secondary: 'steel' },
  // Bouffalant
  626: { primary: 'normal' },
  // Rufflet line
  627: { primary: 'normal', secondary: 'flying' },
  628: { primary: 'normal', secondary: 'flying' },
  // Vullaby line
  629: { primary: 'dark', secondary: 'flying' },
  630: { primary: 'dark', secondary: 'flying' },
  // Heatmor
  631: { primary: 'fire' },
  // Durant
  632: { primary: 'bug', secondary: 'steel' },
  // Deino line
  633: { primary: 'dark', secondary: 'dragon' },
  634: { primary: 'dark', secondary: 'dragon' },
  635: { primary: 'dark', secondary: 'dragon' },
  // Larvesta line
  636: { primary: 'bug', secondary: 'fire' },
  637: { primary: 'bug', secondary: 'fire' },
  // Cobalion
  638: { primary: 'steel', secondary: 'fighting' },
  // Terrakion
  639: { primary: 'rock', secondary: 'fighting' },
  // Virizion
  640: { primary: 'grass', secondary: 'fighting' },
  // Tornadus
  641: { primary: 'flying' },
  // Thundurus
  642: { primary: 'electric', secondary: 'flying' },
  // Reshiram
  643: { primary: 'dragon', secondary: 'fire' },
  // Zekrom
  644: { primary: 'dragon', secondary: 'electric' },
  // Landorus
  645: { primary: 'ground', secondary: 'flying' },
  // Kyurem
  646: { primary: 'dragon', secondary: 'ice' },
  // Keldeo
  647: { primary: 'water', secondary: 'fighting' },
  // Meloetta
  648: { primary: 'normal', secondary: 'psychic' },
  // Genesect
  649: { primary: 'bug', secondary: 'steel' },
  
  // ==========================================
  // KALOS POKEMON (650-721)
  // ==========================================
  
  // Starters
  650: { primary: 'grass' },                      // Chespin
  651: { primary: 'grass' },                      // Quilladin
  652: { primary: 'grass', secondary: 'fighting' }, // Chesnaught
  653: { primary: 'fire' },                       // Fennekin
  654: { primary: 'fire' },                       // Braixen
  655: { primary: 'fire', secondary: 'psychic' }, // Delphox
  656: { primary: 'water' },                      // Froakie
  657: { primary: 'water' },                      // Frogadier
  658: { primary: 'water', secondary: 'dark' },   // Greninja
  
  // Early routes
  659: { primary: 'normal' },                     // Bunnelby
  660: { primary: 'normal', secondary: 'ground' }, // Diggersby
  661: { primary: 'normal', secondary: 'flying' }, // Fletchling
  662: { primary: 'fire', secondary: 'flying' },  // Fletchinder
  663: { primary: 'fire', secondary: 'flying' },  // Talonflame
  664: { primary: 'bug' },                        // Scatterbug
  665: { primary: 'bug' },                        // Spewpa
  666: { primary: 'bug', secondary: 'flying' },   // Vivillon
  667: { primary: 'fire', secondary: 'normal' },  // Litleo
  668: { primary: 'fire', secondary: 'normal' },  // Pyroar
  
  // Fairy Pokemon
  669: { primary: 'fairy' },                      // Flabébé
  670: { primary: 'fairy' },                      // Floette
  671: { primary: 'fairy' },                      // Florges
  
  // Various Pokemon
  672: { primary: 'grass' },                      // Skiddo
  673: { primary: 'grass' },                      // Gogoat
  674: { primary: 'fighting' },                   // Pancham
  675: { primary: 'fighting', secondary: 'dark' }, // Pangoro
  676: { primary: 'normal' },                     // Furfrou
  677: { primary: 'psychic' },                    // Espurr
  678: { primary: 'psychic' },                    // Meowstic
  
  // Honedge line (Steel/Ghost)
  679: { primary: 'steel', secondary: 'ghost' },  // Honedge
  680: { primary: 'steel', secondary: 'ghost' },  // Doublade
  681: { primary: 'steel', secondary: 'ghost' },  // Aegislash
  
  // More Fairy Pokemon
  682: { primary: 'fairy' },                      // Spritzee
  683: { primary: 'fairy' },                      // Aromatisse
  684: { primary: 'fairy' },                      // Swirlix
  685: { primary: 'fairy' },                      // Slurpuff
  
  // Dark/Psychic squids
  686: { primary: 'dark', secondary: 'psychic' }, // Inkay
  687: { primary: 'dark', secondary: 'psychic' }, // Malamar
  
  // Rock/Water barnacles
  688: { primary: 'rock', secondary: 'water' },   // Binacle
  689: { primary: 'rock', secondary: 'water' },   // Barbaracle
  
  // Poison/Water and Dragon
  690: { primary: 'poison', secondary: 'water' }, // Skrelp
  691: { primary: 'poison', secondary: 'dragon' }, // Dragalge
  
  // Water Pokemon
  692: { primary: 'water' },                      // Clauncher
  693: { primary: 'water' },                      // Clawitzer
  
  // Electric/Normal
  694: { primary: 'electric', secondary: 'normal' }, // Helioptile
  695: { primary: 'electric', secondary: 'normal' }, // Heliolisk
  
  // Fossil Pokemon
  696: { primary: 'rock', secondary: 'dragon' },  // Tyrunt
  697: { primary: 'rock', secondary: 'dragon' },  // Tyrantrum
  698: { primary: 'rock', secondary: 'ice' },     // Amaura
  699: { primary: 'rock', secondary: 'ice' },     // Aurorus
  
  // Sylveon (Eevee evolution)
  700: { primary: 'fairy' },                      // Sylveon
  
  // Various Pokemon
  701: { primary: 'fighting', secondary: 'flying' }, // Hawlucha
  702: { primary: 'electric', secondary: 'fairy' }, // Dedenne
  703: { primary: 'rock', secondary: 'fairy' },   // Carbink
  
  // Pseudo-legendary line (Goomy)
  704: { primary: 'dragon' },                     // Goomy
  705: { primary: 'dragon' },                     // Sliggoo
  706: { primary: 'dragon' },                     // Goodra
  
  // Steel/Fairy
  707: { primary: 'steel', secondary: 'fairy' },  // Klefki
  
  // Ghost/Grass trees
  708: { primary: 'ghost', secondary: 'grass' },  // Phantump
  709: { primary: 'ghost', secondary: 'grass' },  // Trevenant
  710: { primary: 'ghost', secondary: 'grass' },  // Pumpkaboo
  711: { primary: 'ghost', secondary: 'grass' },  // Gourgeist
  
  // Ice Pokemon
  712: { primary: 'ice' },                        // Bergmite
  713: { primary: 'ice' },                        // Avalugg
  
  // Noibat line (Flying/Dragon) - FIXED
  714: { primary: 'flying', secondary: 'dragon' }, // Noibat
  715: { primary: 'flying', secondary: 'dragon' }, // Noivern
  
  // Legendaries
  716: { primary: 'fairy' },                      // Xerneas
  717: { primary: 'dark', secondary: 'flying' },  // Yveltal
  718: { primary: 'dragon', secondary: 'ground' }, // Zygarde
  
  // Mythical/Secret Pokemon
  719: { primary: 'rock', secondary: 'fairy' },   // Diancie
  720: { primary: 'psychic', secondary: 'ghost' }, // Hoopa
  721: { primary: 'fire', secondary: 'water' },   // Volcanion

  // ==========================================
  // ALOLA POKEMON (722-809)
  // ==========================================
  722: { primary: 'grass', secondary: 'flying' },    // Rowlet
  723: { primary: 'grass', secondary: 'flying' },    // Dartrix
  724: { primary: 'grass', secondary: 'ghost' },     // Decidueye
  725: { primary: 'fire' },                          // Litten
  726: { primary: 'fire' },                          // Torracat
  727: { primary: 'fire', secondary: 'dark' },       // Incineroar
  728: { primary: 'water' },                         // Popplio
  729: { primary: 'water' },                         // Brionne
  730: { primary: 'water', secondary: 'fairy' },     // Primarina
  731: { primary: 'normal', secondary: 'flying' },   // Pikipek
  732: { primary: 'normal', secondary: 'flying' },   // Trumbeak
  733: { primary: 'normal', secondary: 'flying' },   // Toucannon
  734: { primary: 'normal' },                        // Yungoos
  735: { primary: 'normal' },                        // Gumshoos
  736: { primary: 'bug' },                           // Grubbin
  737: { primary: 'bug', secondary: 'electric' },    // Charjabug
  738: { primary: 'bug', secondary: 'electric' },    // Vikavolt
  739: { primary: 'fighting' },                      // Crabrawler
  740: { primary: 'fighting', secondary: 'ice' },    // Crabominable
  741: { primary: 'fire', secondary: 'flying' },     // Oricorio
  742: { primary: 'bug', secondary: 'fairy' },       // Cutiefly
  743: { primary: 'bug', secondary: 'fairy' },       // Ribombee
  744: { primary: 'rock' },                          // Rockruff
  745: { primary: 'rock' },                          // Lycanroc
  746: { primary: 'water' },                         // Wishiwashi
  747: { primary: 'poison', secondary: 'water' },    // Mareanie
  748: { primary: 'poison', secondary: 'water' },    // Toxapex
  749: { primary: 'ground' },                        // Mudbray
  750: { primary: 'ground' },                        // Mudsdale
  751: { primary: 'water', secondary: 'bug' },       // Dewpider
  752: { primary: 'water', secondary: 'bug' },       // Araquanid
  753: { primary: 'grass' },                         // Fomantis
  754: { primary: 'grass' },                         // Lurantis
  755: { primary: 'grass', secondary: 'fairy' },     // Morelull
  756: { primary: 'grass', secondary: 'fairy' },     // Shiinotic
  757: { primary: 'poison', secondary: 'fire' },     // Salandit
  758: { primary: 'poison', secondary: 'fire' },     // Salazzle
  759: { primary: 'normal', secondary: 'fighting' }, // Stufful
  760: { primary: 'normal', secondary: 'fighting' }, // Bewear
  761: { primary: 'grass' },                         // Bounsweet
  762: { primary: 'grass' },                         // Steenee
  763: { primary: 'grass' },                         // Tsareena
  764: { primary: 'fairy' },                         // Comfey
  765: { primary: 'normal', secondary: 'psychic' },  // Oranguru
  766: { primary: 'fighting' },                      // Passimian
  767: { primary: 'bug', secondary: 'water' },       // Wimpod
  768: { primary: 'bug', secondary: 'water' },       // Golisopod
  769: { primary: 'ghost', secondary: 'ground' },    // Sandygast
  770: { primary: 'ghost', secondary: 'ground' },    // Palossand
  771: { primary: 'water' },                         // Pyukumuku
  772: { primary: 'normal' },                        // Type: Null
  773: { primary: 'normal' },                        // Silvally
  774: { primary: 'rock', secondary: 'flying' },     // Minior
  775: { primary: 'normal' },                        // Komala
  776: { primary: 'fire', secondary: 'dragon' },     // Turtonator
  777: { primary: 'electric', secondary: 'steel' },  // Togedemaru
  778: { primary: 'ghost', secondary: 'fairy' },     // Mimikyu
  779: { primary: 'water', secondary: 'psychic' },   // Bruxish
  780: { primary: 'normal', secondary: 'dragon' },   // Drampa
  781: { primary: 'ghost', secondary: 'grass' },     // Dhelmise
  782: { primary: 'dragon' },                        // Jangmo-o
  783: { primary: 'dragon', secondary: 'fighting' }, // Hakamo-o
  784: { primary: 'dragon', secondary: 'fighting' }, // Kommo-o
  785: { primary: 'electric', secondary: 'fairy' },  // Tapu Koko
  786: { primary: 'psychic', secondary: 'fairy' },   // Tapu Lele
  787: { primary: 'grass', secondary: 'fairy' },     // Tapu Bulu
  788: { primary: 'water', secondary: 'fairy' },     // Tapu Fini
  789: { primary: 'psychic' },                       // Cosmog
  790: { primary: 'psychic' },                       // Cosmoem
  791: { primary: 'psychic', secondary: 'steel' },   // Solgaleo
  792: { primary: 'psychic', secondary: 'ghost' },   // Lunala
  793: { primary: 'rock', secondary: 'poison' },     // Nihilego
  794: { primary: 'bug', secondary: 'fighting' },    // Buzzwole
  795: { primary: 'bug', secondary: 'fighting' },    // Pheromosa
  796: { primary: 'electric' },                      // Xurkitree
  797: { primary: 'steel', secondary: 'flying' },    // Celesteela
  798: { primary: 'grass', secondary: 'steel' },     // Kartana
  799: { primary: 'dark', secondary: 'dragon' },     // Guzzlord
  800: { primary: 'psychic' },                       // Necrozma
  801: { primary: 'steel', secondary: 'fairy' },     // Magearna
  802: { primary: 'fighting', secondary: 'ghost' },  // Marshadow
  803: { primary: 'poison' },                        // Poipole
  804: { primary: 'poison', secondary: 'dragon' },   // Naganadel
  805: { primary: 'rock', secondary: 'steel' },      // Stakataka
  806: { primary: 'fire', secondary: 'ghost' },      // Blacephalon
  807: { primary: 'electric' },                      // Zeraora
  808: { primary: 'steel' },                         // Meltan
  809: { primary: 'steel' },                         // Melmetal
};

/**
 * Get the types for a Pokemon by ID
 */
export const getPokemonTypes = (pokemonId: number): PokemonTypeInfo | null => {
  return POKEMON_TYPES[pokemonId] || null;
};
