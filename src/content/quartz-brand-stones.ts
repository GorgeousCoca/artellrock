import type { StoneSample } from "@/types/content";

import { decorImageAsciiStem } from "@/lib/stone/decor-image-ascii-stem";

/** Каталог кварца: все бренды с явными ценами (₽/м²) */

const STONE_DESCRIPTION = (brand: string) =>
  `Кварцевый агломерат ${brand} для кухонь, ванных и коммерческих пространств.`;

type TitleListGroup = {
  manufacturer: string;
  items: string[];
};

type QuartzCatalogRow = {
  manufacturer: string;
  title: string;
  price: number;
  featured?: boolean;
};

const IMAGE_FOLDER_MAP: Record<string, string> = {
  "Avant Quartz": "Avant_Quartz",
  Avarus: "Avarus",
  "Smart Quartz": "Smart_Quartz",
  "Noblle Quartz": "Noblle_Quartz",
  "Etna Quartz": "Etna_Quartz",
  Caesarstone: "Caesarstone",
  Technistone: "Technistone",
  Belenco: "Belenco",
  Asterum: "Asterum",
  Radianz: "Radianz_Quartz",
  Vicostone: "Vicostone",
  "Quantra Quartz": "Quantra_Quartz",
  Primax: "Primax"
};

/**
 * Имя файла без `.webp`, если на диске оно отличается от `title` в каталоге.
 * Ключ: `${manufacturer}::${title}` (тот же формат, что читает `scripts/check-stone-images.ts`).
 */
const STONE_IMAGE_FILENAME_OVERRIDES: Record<string, string> = {};

/* Все бренды с явными ценами */
const STONE_PRICES_BY_BRAND: Record<string, Record<string, number>> = {
  "Avant Quartz": {
    "1000 Дижон": 15500, "1012 Амьен": 15250, "1220 Клермон": 16500,
    "1111 Авалон": 20000, "2060 Грей Тур": 21500, "9023 Лотарингия": 21500,
    "9133 Авиньон Грис": 21500, "9603 Сен-Мало": 21500,
    "9005 Бурбонне": 22250, "9006 Лимузен": 22250, "9010 Корсика": 22250,
    "9212 Сен-Тропе": 22250, "9510 Ванилла Анси": 22250, "9050 Грис Фонсе": 22250,
    "9172 Блаве": 22250, "9173 Вилен": 22250, "8044 Эври (Матовый)": 22250,
    "8011 Нант (Матовый)": 24250, "8033 Каркассон (Матовый)": 24250,
    "8059 Лаваль (Матовый)": 24250, "8100 Мулен (Матовый)": 24250,
    "8800 Кассис (Матовый)": 24250, "8810 Ренн Тэмпл (Матовый)": 24250,
    "8811 Резе (Матовый)": 24250, "8046 Эсон (Матовый)": 24250,
    "8580 Тарн (Матовый)": 24250,
    "7000 Калакатта Эно": 23750, "7030 Калакатта Шенонсо": 23750,
    "7040 Калакатта Бомениль": 23750, "7060 Калакатта Мон Сен-Мишель": 23750,
    "7070 Калакатта Версаль": 23750, "7080 Калакатта Пьерфон": 23750,
    "7090 Калакатта Рона-Альпы": 22250, "7100 Статуарио Лилль": 23750,
    "7200 Аквитания Бланка": 23750, "7400 Калакатта Дофине": 23750,
    "7470 Калакатта Берн": 23750, "7500 Калакатта Аррас": 23750,
    "7550 Калакатта Канны Голд (Мат)": 23750, "7560 Калакатта Альби (Мат)": 23750,
    "7570 Калакатта Таланс": 23750, "7630 Калакатта Венсен": 22250,
    "7670 Калакатта Кассель": 22250, "7700 Калакатта Марсель": 23750,
    "7888 Калакатта Динан": 23750, "7970 Калакатта Труа": 23750,
    "7980 Ницца Бланк": 23750, "7985 Ницца Ноир (Мат)": 23750,
    "7810 Калакатта Модан": 23750,
    "5751 Калакатта Бессон (Print)": 23750, "5752 Калакатта Креспен (Print)": 23750,
    "5753 Калакатта Аверон (Print)": 23750, "5754 Калакатта Вивье (Print)": 23750,
    "5700 Калакатта Амели (Print)": 23750, "5750 Калакатта Шери (Print)": 23750,
    "5800 Травертин Супп (Print)": 23750
  },
  Radianz: {
    "CG910 Columbia Gray": 18250, "UG950 Ural Gray": 19250, "KI992 Kunlun Ink": 19250,
    "MS141 Mont Blanc Snow": 19250, "GG900 Gentle Gray": 19250,
    "AW130 Aleutian White": 19500, "EW120 Everest White": 19500,
    "IG910 Imperial Gray": 20000, "MI780 Mirama Bronze": 21000,
    "GG950 Gold Canyon Gray": 21500, "MU410 Mariposa Buff": 20250,
    "SH145 St.Helens White": 21500, "DW105 Diamond White": 20750,
    "PG722 Pergamon": 18750, "AZ752 Aizano": 20250, "MM211 Mocca Mousse": 20250,
    "BN178 Belluno": 20250, "VE150 Vega": 20750, "AD151 Alinda": 20750,
    "PR710 Parma": 20750, "BL260 Boletus": 20750, "GN290 Granada": 20750,
    "MG780 Metropol Grey": 20750, "CV110 Calacatta Venatino": 21250,
    "LL712 La Luna": 21500, "CR157 Carola": 21500, "AM174 Amalfi": 21500,
    "MI150 Minta": 21500, "PL187 Perla": 21500,
    "CV130 Calacatta Veneto": 24500, "CV152 Calacatta Valencia": 24500,
    "CV199 Calacatta Victory": 24500, "ML950 Marquina Lavagna": 24500,
    "AF953 Ashford Fog": 19250, "LL195 Lucern Lake": 22250,
    "DC155 Denali Cloud": 22250, "CO925 Ceres": 24000, "PL722 Pluto": 24000,
    "CO811 Contrail": 24000, "SE155 Sequoia": 22500, "AC711 Acacia": 22500,
    "CH949 Charocal": 24000, "AS955 Aster": 22750, "IB989 Impala Black": 22750,
    "NB278 Napoli Beige": 22750, "KR217 Kiani Cream": 22750,
    "WA389 Wilshire Amber": 22750, "VV254 Verona Verde": 22750,
    "RI177 Rio": 23000, "AL450 Alluring": 24000, "SP850 Splendor": 24000,
    "NW124 Nantucket Whale": 25750, "JU155 Juniper": 25750
  },
  "Noblle Quartz": {
    "Q117 Jade White": 16500, "Q131 Black Sand": 16500,
    "Q716 Carrara Sun": 19000, "Q718 Carrara Moon": 19000,
    "Q719 Carrara Black": 19000, "Q717 Bianco Giogia": 19750,
    "Q735 Bianco Venato": 19750, "Q740 Calacatta Venato": 19750,
    "Q744 Calacatta Bianco": 19750, "Q765 Nero Marquina": 19750,
    "Q785 Calacatta Gold": 19750, "Q810 Grey Glow": 21750,
    "Q811 Beton White (мат)": 21750, "Q859 Beton Brass (мат)": 21750,
    "Q880 Beton Grey (мат)": 21750, "Q703 Calacatta Borghini": 21000,
    "Q707 Sahara Noir": 21000, "Q757 Calacatta Aurum": 21000,
    "Q798 Calacatta Elegant": 21000, "Q840 White Misterio": 21000,
    "Q850 Urban Grigio": 21000, "Q795 Calacatta Magic Dark": 22500,
    "Q796 Calacatta Magic White": 22500, "Q797 Calacatta True Light": 22500,
    "Q901 Patagonia Gold": 22500, "Q902 Patagonia Platinum": 22500,
    "Q921 Arabescato Black": 22500, "Q922 Arabescato White": 22500,
    "Q923 Arabescato Corchia": 22500, "Q650 Pietra Grigia": 18250,
    "Q750 Statuario Classic": 18250, "Q790 Venato Royal": 18250
  },
  "Smart Quartz": {
    "White Sand": 17500, "Silver Night": 17500, "Sunshine": 18500,
    "Linen": 18500, "White Marble": 19500, "Super White": 19750,
    "Negro Imperial": 20250, "Illusion": 21750, "Bianco Venatino": 22750,
    "Calacatta Sun": 23250, "Calacatta Tree": 25750, "Gold Arabescato": 26250,
    "Statuario Gold": 28750, "Rockland (матовый)": 24750,
    "Coral (матовый)": 24750, "Slate (матовый)": 24750, "Antracite": 25250,
    "Marquina": 24750, "Black Jasper (матовый)": 28750, "Titanium": 32250,
    "Patagonia": 32250, "Jasmine": 29750, "Taj Mahal (матовый)": 24750,
    "Crema Marfil (Матовый)": 23500, "Coffee Brown (Матовый)": 23500,
    "Giallo": 24000, "Munsell": 24500, "Russet": 23500,
    "Moon White (Матовый)": 22750, "Moon Grey (Матовый)": 24750,
    "Bianco Lasa": 22750, "Calacatta Moon": 22250
  },
  Avarus: {
    "R112 Соль Каспия": 18000, "R122 Алмазы Якутии": 18000,
    "R104 Белая Тайга": 19000, "R515 Вулканы Камчатки": 19000,
    "R403 Скалы Карелии": 20000, "R444 Ай-Петри": 20000,
    "R500 Жемчуг Приморья": 20000, "R503 Уральские Горы": 20000,
    "R510 Черное Море": 19750, "R511 Лёд Байкала": 19750,
    "R520 Астраханские Пески": 20000, "R522 Золотое Кольцо": 20000,
    "R531 Донская Степь": 20000, "R538 Горы Кавказа": 20000,
    "R541 Снега Сибири": 19750, "R543 Пик Эльбруса": 19750,
    "R555 Балтийский Берег": 20000, "R558 Просторы Поволжья": 20000,
    "R575 Красная Поляна": 20000, "R590 Северное Сияние": 20750,
    "R677 Московская ночь": 21750,
    "RM104 Белая Тайга Мат": 22250, "RM403 Скалы Карелии Мат": 22250,
    "RM444 Ай-Петри Мат": 22250, "RM500 Жемчуг Приморья Мат": 22250,
    "RM510 Черное Море Мат": 22250, "RM511 Лёд Байкала Мат": 22250,
    "RM520 Астраханские Пески Мат": 22250, "RM543 Пик Эльбруса Мат": 22250,
    "RM560 Золотые Ворота Мат": 22250
  },
  Asterum: {
    "0001 Perfecta": 21500, "1001 Coliseum": 22750, "1101 Megapolis": 19000,
    "1104 Macedonia": 23750, "1105 Trufaldino": 23750, "3000 Jakarta": 21500,
    "3002 Cappucino": 23500, "3003 Cleopatra": 21500, "3004 Buckingham": 23500,
    "3101 Alaska": 20000, "3102 Palladium": 20500, "3103 Leonardo": 23000,
    "3104 Tundra": 21000, "3200 Arabica": 21500, "3402 Palladium Matt": 21750,
    "4002 Derbent": 22250, "4101 Safary": 26000, "4102 Husky": 23500,
    "4103 Niagara": 22750, "4104 Bionica": 22750, "5001 Albion": 24250,
    "5002 Caracum": 23000, "5003 Michelangelo": 23000, "5101 Everest": 24500,
    "5108 Vanessa": 24000, "5109 Picanto": 25500, "5110 Charaur": 24250,
    "5400 Himalayas Matt": 26000, "5401 Aurelia Matt": 24000,
    "6101 Archeolog": 23500, "6106 Bagira": 24250, "7401 Hippy Matt": 24500
  },
  Technistone: {
    "Brilliant Arabesco": 25250, "Crystal Absolute White": 29500,
    "Crystal Polar White": 26250, "Crystal Royal": 24250,
    "Gobi Black": 23000, "Gobi Grey": 23000,
    "Morning Daisy (мат)": 26250, "Noble Arco": 27750,
    "Noble Arco (мат)": 28500, "Noble Areti Bianco": 28500,
    "Noble Athos Brown": 24750, "Noble Botticino": 27250,
    "Noble Carrara": 27500, "Noble Concrete Grey": 23750,
    "Noble Concrete Grey (мат)": 24500, "Noble Imperial Grey": 27000,
    "Noble Ivory White": 24500, "Noble Linea": 28000,
    "Noble Olympos Mist": 28000, "Noble Pietra Grey": 24500,
    "Noble Portland Grey": 23750, "Noble Portland Grey (мат)": 24500,
    "Noble Pro Cloud": 24000, "Noble Pro Frost": 24750,
    "Noble Pro Storm": 25000, "Noble Quartzite": 27000,
    "Noble Quartzite (мат)": 27750, "Noble Supreme White": 28000,
    "Noble Troya": 24000, "Noble Vintage": 23750,
    "Noble Vintage (мат)": 24500, "Pearl Delta": 26000,
    "Taurus Black": 22500, "Taurus Terazzo Dark": 24250,
    "Taurus Terazzo Dark (мат)": 24000, "Taurus Terazzo Grey": 21750,
    "Taurus Terazzo White": 24500, "Wedding Lily (мат)": 27750,
    "Wild Yucca": 26500
  },
  Primax: {
    "100 Ivory White": 18500, "111 Snow White": 18750,
    "111 Snow White (Мат)": 21500, "112 Crystal White": 17250,
    "120 Light Grey (Мат)": 17000, "130 Beige Sand (Мат)": 21500,
    "150 Black Satin (Мат)": 27500, "312 Patagonia": 27500,
    "313 White Arctic (Мат)": 27500, "331 Panda White": 27500,
    "335 Tiffani Blue": 27500, "340 Taj Mahal": 27500,
    "345 Black Sea": 27500, "702 Light Calacatta": 24500,
    "703 Rich Calacatta": 21750, "704 Arabescata White": 27500,
    "706 Calacatta Grey (Мат)": 21750, "719 Earthquake (Мат)": 24500,
    "722 Calacatta Warm Venatto (Мат)": 24500, "723 Calacatta Gold": 24500,
    "726 Virtrum Crystal": 27500, "740 Rainbow Calacatta": 24500,
    "770 Sahara Noir": 24500, "786 Calacatta Back Gold": 27500,
    "796 Noir Satin (Мат)": 27500, "812 Black Rock (Мат)": 24500,
    "826 Concrete Grey (Мат)": 24500, "833 TerraCotta (Мат)": 24500,
    "848 White Oxid (Мат)": 24500, "884 Dark Concrete (Мат)": 24500,
    "892 Grey Oxid (Мат)": 24500, "912 White Carrara": 19500,
    "913 Golden Sunset": 21500, "915 Dark Mist": 19500,
    "916 Emperador": 19500, "920 White Marble": 19500,
    "931 Sunny Carrara": 19500, "942 Ivory Grey": 19500,
    "961 Ice Storm": 21500, "971 Ice Grey (Мат)": 17000
  },
  "Etna Quartz": {
    "EQHM 001 Perlino Bianco": 24250, "EQHM 002 Calacatta Venato": 24250,
    "EQHM 003 Canvas": 24750, "EQHG 004 Canvas": 25250,
    "EQHG 004 Canvas (матовый)": 25250, "EQHM 005 Mandala": 23250,
    "EQHM 006 Negro Marquina": 24250, "EQHM 007 Grey Marquina": 24250,
    "EQHM 007 Grey Marquina (мат)": 24250, "EQPM 008 Calacatta Santorini": 23250,
    "EQT 017 Bianco Extra": 20000, "EQT 017 Bianco Extra (мат)": 20000,
    "EQTM 018 Calacatta Borghini": 25250, "EQPM 020 Sofita Beige": 24250,
    "EQPG 022 Bianco Antico": 23750, "EQPM 023 White Ice": 24250,
    "EQPM 025 Azul Imperiale": 24250, "EQPM 026 Brown Perlino": 22000,
    "EQPM 027 Ambra": 22000, "EQPM 028 Black Perlino": 22000,
    "EQHM 029 Sahara Noir": 25250, "EQAC 036 Antica Grey": 24750,
    "EQAM 042 Volakas Extra": 22000, "EQAM 043 Bianco Crystallo": 25250,
    "EQAM 046 Arabescato Corcia": 25250, "EQJC 052 Black Mirror": 24750,
    "EQJC 054 Antica Dark Bronze (Мат)": 24750, "EQCM 059 Canvas Gold": 24000,
    "EQCC 061 Antico Classic (Мат)": 24000, "EQC 067 Pure White": 24000,
    "EQPM 068 Panda White": 24750, "EQJO 069 Onyx Bianco": 26250,
    "EQMM 070 Calacatta Star": 25250, "EQMM 071 Golden Silk": 27000,
    "EQMM 072 Moon Valley": 27000, "EQJM 073 Calacatta Etna": 27000,
    "EQJQ 077 Patagonia Extra": 27000, "EQMO 079 Aquamarine": 27000,
    "EQAG 099 Titanium Leather (Мат)": 27000, "EQMM 101 Carrara": 20000,
    "EQMM 102 Cream Beige": 20000, "EQMO 103 Ice Onyx": 20000,
    "EQMM 104 Etna Delicato": 20000
  },
  Caesarstone: {
    "3141 Osprey": 22000, "3142 While Shimmer": 22000,
    "6141 Ocean Foam": 22000, "9141 Ice Snow": 22000,
    "1141 Pure White": 22000, "2040 Urban": 22000,
    "2141 Snow": 22000, "2230 Linen": 22000,
    "7110 Burnt Cordite": 22000, "4030 Oyster": 22000,
    "4120 Raven": 22000, "4600 Organic White": 22000,
    "3100 Jet Black": 25500, "4130 Clamshell": 28500,
    "4230 Shitake": 28500, "4350 Mink": 31000,
    "5000 London Grey": 33000, "5003 Piatra Grey": 27500,
    "5100 Vanilla Noir": 27500, "5110 Alpine Mist": 27500,
    "5133 Symphony Grey": 27500, "5141 Frosty Carina": 26000,
    "5143 White Attica": 27500, "5212 Taj Royale": 27500,
    "6003 Coastal Grey": 27500, "6046 Moorland Fog": 27500,
    "6131 Bianco Drift": 27500, "6134 Georgian Bluffs": 33500,
    "6313 Turbine Grey": 33500, "6338 Woodlands": 27500,
    "4003 Sleek Concrete (мат)": 28500, "4011 Cloudbust Concrete (мат)": 26000,
    "4023 Topus Concrete (мат)": 26000, "4033 Rugged Concrete (мат)": 26000,
    "4043 Primordia (мат)": 34000, "4044 Airy Concrete (мат)": 26000,
    "4735 Oxidian (мат)": 32000, "5810 Black Tempal (мат)": 26000,
    "5031 Statuario Maximus": 32000, "5111 Statuario Nuvo": 32000,
    "5131 Calacatta Nuvo": 32000
  },
  Belenco: {
    "1010 Premium White": 22750, "1010 Premium White Seta": 23500,
    "3110 Polaris": 21500, "3110 Polaris Seta": 22000,
    "3727 Just Black": 22750, "4110 Diamond White": 21500,
    "4262 Kristella White": 19500, "5050 Forza Fume": 18500,
    "5139 Juliet White": 20000, "5250 Elexir White": 18500,
    "5250 Elexir White Seta": 19750, "5751 Gala Black": 20000,
    "6139 Everst White": 19500, "8250 Columbia Gray": 18000,
    "8262 Mont Blanc Snow": 18000, "8765 Volcano Black": 18500,
    "8765 Volcano Black Seta": 19750, "9242 Arena": 20500,
    "9242 Arena Seta": 22250, "1110 Iceberg": 22750,
    "1123 Perla White": 22000, "1124 Amalfi": 22750,
    "1227 Pixie Wings": 21500, "2214 Teos": 22750,
    "2254 Aurora": 21500, "2543 Ashen": 21750,
    "2543 Ashen Seta": 22750, "2555 Artesia": 21750,
    "3113 Daphne Crack": 22750, "3333 Boletus": 21500,
    "3333 Boletus Seta": 22500, "3555 Parma": 21500,
    "3555 Parma Seta": 22000, "3618 Olympos": 21750,
    "4043 Aizano": 20500, "4043 Aizano Seta": 22750,
    "4123 Kashmera White": 22750, "4217 Rapture": 22750,
    "4227 Fairy White": 20500, "4444 Sahara Beige": 20500,
    "4456 Cadiz": 21750, "4458 Chakra Beige": 21500,
    "4524 La Luna": 22750, "4535 Terre Grey": 21500,
    "4558 Babilon": 21500, "4558 Babilon Seta": 22000,
    "5113 Minta": 22750, "5114 Carola": 22750,
    "5224 Elegance": 22000, "5329 Mocca Mousse": 21000,
    "6114 Belluno": 21000, "6114 Belluno Honed": 22500,
    "7123 Carrara Bela": 22500, "7227 Armilla": 22750,
    "7353 Pergamon": 21500, "7458 Granada": 21750,
    "7537 Metropol Grey": 21500, "7537 Metropol Grey Seta": 22500,
    "7543 Montana": 20500, "8113 Anemon": 21500,
    "8123 Carrara Luca": 22750, "8727 Spa Black": 22000,
    "8727 Spa Black Seta": 24000, "9113 Alinda": 21500,
    "1189 Calacatta Garda": 24750, "1219 Calacatta Victory": 24750,
    "1220 Calacatta Paletino": 25000, "1221 Calacatta Valencia": 24750,
    "2219 Calacatta Venezia": 25000, "2229 Calacatta Venus": 24750,
    "3516 Hypnose": 25000, "4120 Calacatta Alya": 25000,
    "4242 Statuario Volga": 25000, "5219 Statuario Crux": 25000,
    "6214 Stardust": 24750, "6229 Aspendos": 23500,
    "7119 Calacatta Venatino": 25000, "7220 Pantheon": 24750,
    "8119 Calacatta Verona": 24750, "9119 Calacatta Veneto": 24750,
    "9219 Marquina Tierra": 24000, "9219 Marquina Tierra Seta": 26500,
    "9719 Marquina Lavanga": 25000
  },
  Vicostone: {
    "BQ 5260 Beton (5мм) (Мат)": 20750, "BQ 5261 Materica (5мм) (Мат)": 20750,
    "BQ 5290 Nube (5мм) (Мат)": 20750, "BQ 5291 Rusty (5мм) (Мат)": 20750,
    "BQ 5860 Corazon (5мм) (Мат)": 18500, "BQ 5862 Oceanid (5мм) (Мат)": 19000,
    "BS 124 Satined": 22500, "BQ 2101 Pure Black": 24750,
    "BQ 8220 Carrara": 23000, "BQ 8590 Dolce Vita": 25250,
    "BQ 8815 Misterio": 27000, "BQ 8740 Nero Marquina": 30000,
    "BQ 2605 Denali (Мат)": 22500, "BQ 3603 Galilea (Мат)": 22750,
    "BQ 6800 Grey Monet (Мат)": 29250, "BQ 8730 Cemento (Мат)": 29250,
    "BQ 8860 Concreto (Мат)": 26000, "BQ 8863 Tartufo (Мат)": 26000,
    "BQ 8864 Naxos (Мат)": 26000, "BQ 8870 Olympus White (Мат)": 26000,
    "BQ 8891 Madreperola (Мат)": 25250, "BQ 8926 Calacatta Caldia (Мат)": 29250,
    "BQ 200 Artic Snow": 22750, "BQ 2600 Valley White": 22750,
    "BQ 2607 Serizzo Monterosa": 22500, "BQ 100 Quasar Light": 24250,
    "BQ 7702 Moonglade": 32500, "BQ 8402 Delta": 25250,
    "BQ 8430 Botticino Classic": 23250, "BQ 8440 Bianco Venato": 22500,
    "BQ 8560 Dark Emperador": 24750, "BQ 8614 Altissimo": 24750,
    "BQ 8668 Ice Lake": 24250, "BQ 8786 Thunder Blue": 27000,
    "BQ 8812 Java Noir": 26000, "BQ 8820 Misterio Gold": 26000,
    "BQ 9310 Silver Sea": 24500, "BQ 9453 Taj Mahal": 24750,
    "BQ 9470 Azul Aran": 26250, "BQ 6700 Covelani": 29250,
    "BQ 6701 Camarina": 27500, "BQ 6702 Costa Nova": 27500,
    "BQ 8583 Akoya": 25750, "BQ 8628 Statuario": 29500,
    "BQ 8660 Venatino": 28500, "BQ 8738 Greylac": 26000,
    "BQ 8780 Argento": 29250, "BQ 8788 Diamante": 29250,
    "BQ 8800 Bettoglio": 26000, "BQ 8881 Gan Eden": 34000,
    "BQ 8887 Amadeus": 34000, "BQ 8918 Vivalioro": 34000,
    "BQ 8920 Forza": 29500, "BQ 9700 Sahara Noir": 36750
  },
  "Quantra Quartz": {
    "2442 Semolina": 24000, "2456 Brown Leaf": 24000,
    "1673 New Carrara": 24000, "2455 Ancient Beige": 25500,
    "6589 Classic Ivory": 25500, "7172 Arctic Breeze": 25500,
    "2430 Artisan Wool": 27000, "7111 Agnolo Matt": 27000,
    "7447 Bianco Venatino": 27000, "7448 Bellini Matt": 27000,
    "7500 Masaccio": 27000, "7511 Botticelli": 27000,
    "7522 Raphael": 27000, "7700 Antonio": 27000,
    "7982 Rogier": 27000, "9334 Calacatta Capri": 28250,
    "9333 Calacatta Oro": 28250, "9010 Calacatta Luca": 28250,
    "9444 Calacatta Borghini": 28250, "8058 Hermes Grey Matt": 28250,
    "9510 Cygnus Divine": 29750, "9965 Golden Gate": 32500,
    "9953 Sevilia": 32500, "9976 Pirouette": 31000,
    "9996 Leonardo": 31000, "9972 San Marco": 31000,
    "9987 Champs-Elysees": 31000, "9986 Fontainebleau": 31000,
    "9960 Pantheon": 32500, "9962 La Dolce Vita": 32500,
    "2048 Snow White": 22750
  }
};

const CATALOG_BRAND_ORDER = [
  "Avant Quartz", "Avarus", "Smart Quartz", "Noblle Quartz",
  "Etna Quartz", "Caesarstone", "Technistone",
  "Belenco", "Asterum", "Radianz", "Vicostone",
  "Quantra Quartz", "Primax"
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(мат\)/gi, "mat")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function manufacturerSlug(manufacturer: string): string {
  return slugify(manufacturer.replace(/quartz/gi, "").trim());
}

function inferFinish(title: string): string {
  return /(мат|mat|матовый|honed|seta)/i.test(title) ? "Матовая" : "Полированная";
}

function inferColor(title: string): string {
  const source = title.toLowerCase();
  if (/(black|nero|noir|темн|черн)/i.test(source)) return "Черный";
  if (/(white|bianco|blanc|snow|ice|polar|снег|бел)/i.test(source)) return "Белый";
  if (/(grey|gray|grigio|gris|бетон|concrete|silver)/i.test(source)) return "Серый";
  if (/(beige|ivory|sand|taj|cream|gold|aurelia|terracotta)/i.test(source)) return "Бежевый";
  if (/(brown|mocca|coffee|emperador|chocolate)/i.test(source)) return "Коричневый";
  if (/(blue|azul|ocean|aquamarine)/i.test(source)) return "Синий";
  return "Микс";
}

function inferTexture(title: string): string {
  const source = title.toLowerCase();
  if (/(calacatta|statuario|carrara|arabesc|marquina|patagonia|onyx|taj|travertin|venato)/i.test(source)) {
    return "Мраморная";
  }
  if (/(concrete|beton|urban|cemento|oxid|materica|rusty)/i.test(source)) {
    return "Бетонная";
  }
  return "Каменная";
}

function inferThicknesses(title: string): string[] {
  if (/\b5 ?мм|\(5мм\)/i.test(title)) return ["5 мм"];
  if (/\b8 ?мм/i.test(title)) return ["8 мм", "20 мм"];
  return ["20 мм", "30 мм"];
}

function stoneImageStem(manufacturer: string, title: string): string {
  const key = `${manufacturer}::${title}`;
  return STONE_IMAGE_FILENAME_OVERRIDES[key] ?? decorImageAsciiStem(title);
}

function toStoneImage(manufacturer: string, title: string): string {
  const folder = IMAGE_FOLDER_MAP[manufacturer];
  if (!folder) return "/images/quartz-surface-light.svg";
  return `/images/${folder}/${stoneImageStem(manufacturer, title)}.webp`;
}

function catalogTitlesForManufacturer(manufacturer: string): string[] {
  return Object.keys(STONE_PRICES_BY_BRAND[manufacturer] ?? {});
}

function buildCatalogRows(groups: TitleListGroup[]): QuartzCatalogRow[] {
  const rows: QuartzCatalogRow[] = [];
  for (const g of groups) {
    g.items.forEach((title, index) => {
      rows.push({
        manufacturer: g.manufacturer,
        title,
        price: STONE_PRICES_BY_BRAND[g.manufacturer]?.[title] ?? 0,
        featured: index < 4
      });
    });
  }
  return rows;
}

function catalogRowToSample(row: QuartzCatalogRow, ord: Map<string, number>): StoneSample {
  const mfrSlug = manufacturerSlug(row.manufacturer);
  const next = (ord.get(row.manufacturer) ?? 0) + 1;
  ord.set(row.manufacturer, next);
  const id = `stone_${mfrSlug}_${next}`;
  const slug = `${mfrSlug}-${slugify(row.title)}`;
  return {
    id,
    slug,
    title: row.title,
    stoneType: "quartz",
    manufacturer: row.manufacturer,
    color: inferColor(row.title),
    texture: inferTexture(row.title),
    thicknesses: inferThicknesses(row.title),
    finish: inferFinish(row.title),
    description: STONE_DESCRIPTION(row.manufacturer),
    image: toStoneImage(row.manufacturer, row.title),
    isFeatured: row.featured ?? false,
    priceFrom: row.price > 0 ? row.price : null
  };
}

const catalogTitleGroups: TitleListGroup[] = CATALOG_BRAND_ORDER.map((manufacturer) => ({
  manufacturer,
  items: catalogTitlesForManufacturer(manufacturer)
}));

const catalogOrdinalByBrand = new Map<string, number>();
export const quartzBrandStones: StoneSample[] = buildCatalogRows(catalogTitleGroups).map((row) =>
  catalogRowToSample(row, catalogOrdinalByBrand)
);