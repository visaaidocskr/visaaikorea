// AI itinerary engine. Pure + deterministic: a stable seed rotates through
// per-city area clusters so different applicants get different (but
// realistic) plans, while the same application reproduces the same
// itinerary. Embassy tone: simple, factual, not exaggerated. No Math.random
// (keeps output reproducible).
//
// Geography-aware by design: POIs are grouped into real neighborhood/area
// clusters (e.g. Shibuya & Harajuku, Asakusa & Ueno). Each day of the trip
// stays within ONE cluster, so morning → afternoon → evening never jumps
// across the city — the evening spot is always a short walk/ride from the
// afternoon one. Areas rotate across the trip (by seed, so different
// applicants see different area orders) and, within an area, the most
// famous highlights are listed first and picked first.

export type ItineraryDay = {
  date: string; // YYYY-MM-DD
  city: string;
  morning: string;
  afternoon: string;
  evening: string;
};

// One walkable/nearby neighborhood. `blocks` are ordered most-famous-first
// (always at least 3, so a full day never has to repeat a block); some blocks
// already combine two adjacent highlights (e.g. "Senso-ji Temple and Nakamise
// shopping street") so a single day-part reads as a fuller, still-realistic
// plan rather than one isolated landmark. `dayTrip: true` marks an
// out-of-city excursion — these are never scheduled on the arrival day, since
// the applicant has just landed and needs to check in first.
type AreaCluster = { area: string; blocks: string[]; dayTrip?: boolean };

// --- Area clusters, by "Country:City" -------------------------------------
const AREA_CLUSTERS: Record<string, AreaCluster[]> = {
  // ------------------------------------------------------------ Japan ------
  "Japan:Tokyo": [
    {
      area: "Shibuya & Harajuku",
      blocks: [
        "Shibuya Crossing and Hachiko Statue",
        "Shibuya Sky observation deck",
        "Meiji Shrine and Yoyogi Park",
        "Harajuku Takeshita Street and Omotesando",
        "Daikanyama and Nakameguro riverside area",
        "Shimokitazawa vintage shopping district",
      ],
    },
    {
      area: "Asakusa & Ueno",
      blocks: [
        "Senso-ji Temple and Nakamise shopping street, Asakusa",
        "Tokyo Skytree and Sumida River walk",
        "Ueno Park and Ueno Zoo",
        "Tokyo National Museum, Ueno",
        "Ameyoko Market, Ueno",
        "Yanaka old town district",
      ],
    },
    {
      area: "Shinjuku",
      blocks: [
        "Tokyo Metropolitan Government Building observation deck (free city view)",
        "Shinjuku Gyoen National Garden",
        "Kabukicho and Omoide Yokocho (Memory Lane)",
        "Golden Gai bar alley",
        "Shinjuku Central Park",
      ],
    },
    {
      area: "Ginza, Tsukiji & Odaiba",
      blocks: [
        "Ginza shopping district",
        "Tsukiji Outer Market food stalls",
        "Hamarikyu Gardens",
        "Odaiba seaside area and teamLab Planets",
        "Rainbow Bridge and Odaiba beach",
      ],
    },
    {
      area: "Akihabara & Marunouchi",
      blocks: [
        "Akihabara electronics and anime district",
        "Tokyo Station and Marunouchi area",
        "Kanda Myojin Shrine",
        "Jimbocho second-hand book town",
      ],
    },
    {
      area: "Roppongi & Tokyo Tower",
      blocks: [
        "Tokyo Tower",
        "Roppongi Hills and Mori Art Museum",
        "Tokyo Midtown and National Art Center",
        "Zojo-ji Temple, near Tokyo Tower",
      ],
    },
    {
      area: "Ikebukuro & Northern Tokyo",
      blocks: [
        "Ikebukuro Sunshine City",
        "Rikugien Garden",
        "Nezu Shrine",
        "Kagurazaka district",
      ],
    },
    {
      area: "Day trips",
      dayTrip: true,
      blocks: [
        "Kamakura day trip — Great Buddha and Hase-dera Temple",
        "Yokohama Minato Mirai day trip",
        "Nikko day trip — Toshogu Shrine",
        "Kawagoe “Little Edo” day trip",
      ],
    },
  ],

  "Japan:Osaka": [
    {
      area: "Dotonbori & Namba",
      blocks: [
        "Dotonbori canal and Glico Running Man sign",
        "Shinsaibashi shopping street",
        "Kuromon Ichiba Market food street",
        "Namba Yasaka Shrine (lion-head stage)",
        "Amerikamura (America Town) fashion district",
      ],
    },
    {
      area: "Osaka Castle",
      blocks: [
        "Osaka Castle and park grounds",
        "Osaka Museum of History, next to the castle",
        "Osaka Castle Nishinomaru Garden",
      ],
    },
    {
      area: "Umeda & Kita",
      blocks: [
        "Umeda Sky Building floating garden observatory",
        "Grand Front Osaka and Umeda shopping",
        "Osaka Tenmangu Shrine",
      ],
    },
    {
      area: "Kyoto day trip",
      dayTrip: true,
      blocks: [
        "Kyoto day trip — Fushimi Inari Taisha thousand torii gates",
        "Kyoto day trip — Kiyomizu-dera Temple and Higashiyama district",
        "Kyoto day trip — Arashiyama Bamboo Grove and Togetsukyo Bridge",
        "Kyoto day trip — Gion geisha district",
        "Kyoto day trip — Kinkaku-ji Golden Pavilion",
      ],
    },
    {
      area: "Nara day trip",
      dayTrip: true,
      blocks: [
        "Nara day trip — Nara Park and its friendly deer",
        "Nara day trip — Todai-ji Temple Great Buddha Hall",
        "Nara day trip — Kasuga Taisha Shrine",
      ],
    },
    {
      area: "Kobe day trip",
      dayTrip: true,
      blocks: [
        "Kobe day trip — Kobe Harborland and Meriken Park",
        "Kobe day trip — Kitano foreign settlement district",
        "Kobe day trip — Nunobiki Herb Garden and ropeway",
      ],
    },
  ],

  "Japan:Fukuoka": [
    {
      area: "Tenjin & Canal City",
      blocks: [
        "Canal City Hakata shopping and fountain shows",
        "Tenjin shopping area and underground mall",
        "Tenjin yatai food-stall alley",
      ],
    },
    {
      area: "Hakata & Nakasu",
      blocks: [
        "Kushida Shrine, Hakata",
        "Nakasu riverside yatai food stalls at night",
        "Hakata Machiya Folk Museum",
      ],
    },
    {
      area: "Dazaifu day trip",
      dayTrip: true,
      blocks: [
        "Dazaifu Tenmangu Shrine day trip",
        "Kyushu National Museum, near Dazaifu",
        "Dazaifu old town approach street",
      ],
    },
    {
      area: "Ohori & Fukuoka Castle",
      blocks: [
        "Ohori Park lake walk",
        "Fukuoka Castle Ruins (Maizuru Park)",
        "Fukuoka City Museum",
      ],
    },
    {
      area: "Momochi seaside",
      blocks: [
        "Momochi Seaside Park",
        "Fukuoka Tower",
        "Fukuoka City Science Museum",
      ],
    },
  ],

  // ----------------------------------------------------------- Taiwan ------
  "Taiwan:Taipei": [
    {
      area: "Xinyi",
      blocks: [
        "Taipei 101 observation deck",
        "Elephant Mountain (Xiangshan) viewpoint hike",
        "Xinyi shopping and dining district",
      ],
    },
    {
      area: "Ximending & Longshan",
      blocks: [
        "Ximending youth shopping district",
        "Longshan Temple, Wanhua",
        "Bopiliao Historic Block",
      ],
    },
    {
      area: "CKS Memorial & Zhongzheng",
      blocks: [
        "Chiang Kai-shek Memorial Hall and Liberty Square",
        "National Taiwan Museum, Zhongzheng",
        "Presidential Office Building (exterior)",
      ],
    },
    {
      area: "Shilin",
      blocks: [
        "National Palace Museum",
        "Shilin Night Market",
        "Shilin Official Residence and gardens",
      ],
    },
    {
      area: "Beitou",
      blocks: [
        "Beitou Hot Springs and Thermal Valley",
        "Beitou Library and Hot Spring Museum",
        "Xinbeitou Historic Station",
      ],
    },
    {
      area: "Jiufen & Shifen day trip",
      dayTrip: true,
      blocks: [
        "Jiufen Old Street day trip",
        "Shifen sky lantern release day trip",
        "Shifen Waterfall",
      ],
    },
    {
      area: "Danshui day trip",
      dayTrip: true,
      blocks: [
        "Danshui Old Street and riverside promenade day trip",
        "Fort San Domingo, Danshui",
        "Fisherman's Wharf and Lovers Bridge, Danshui",
      ],
    },
  ],
  "Taiwan:*": [
    {
      area: "City center",
      blocks: [
        "City center and main temple",
        "Local old street and night market",
        "Central shopping district",
      ],
    },
    {
      area: "Waterfront",
      blocks: [
        "Riverside or harbor park",
        "Nearby scenic viewpoint or hot spring",
        "Waterfront promenade",
      ],
    },
    {
      area: "Culture",
      blocks: ["Regional museum", "Historic district walk", "Local craft market"],
    },
  ],

  // --------------------------------------------------------- Singapore -----
  "Singapore:Singapore": [
    {
      area: "Marina Bay",
      blocks: [
        "Marina Bay Sands and Merlion Park",
        "Gardens by the Bay — Supertree Grove and Cloud Forest",
        "Marina Bay waterfront promenade evening light show",
      ],
    },
    {
      area: "Chinatown & Riverside",
      blocks: [
        "Chinatown street market and Buddha Tooth Relic Temple",
        "Clarke Quay riverside dining",
        "Boat Quay riverside walk",
      ],
    },
    {
      area: "Little India & Kampong Glam",
      blocks: [
        "Little India street market and Sri Veeramakaliamman Temple",
        "Kampong Glam and Sultan Mosque",
        "Haji Lane boutique shopping",
      ],
    },
    {
      area: "Orchard Road",
      blocks: [
        "Orchard Road shopping district",
        "Emerald Hill heritage shophouses",
        "Istana Park",
      ],
    },
    {
      area: "Sentosa Island",
      blocks: [
        "Sentosa Island beaches and cable car",
        "S.E.A. Aquarium, Sentosa",
        "Universal Studios Singapore",
      ],
    },
    {
      area: "Botanic Gardens & Holland Village",
      blocks: [
        "Singapore Botanic Gardens and National Orchid Garden",
        "Holland Village cafes and shops",
        "Tiong Bahru heritage neighborhood",
      ],
    },
  ],

  // -------------------------------------------------------------- Spain ----
  "Spain:Madrid": [
    {
      area: "Centro",
      blocks: [
        "Puerta del Sol and Plaza Mayor",
        "Gran Via shopping avenue",
        "Mercado de San Miguel food market",
      ],
    },
    {
      area: "Museum triangle",
      blocks: [
        "Prado Museum",
        "Retiro Park and Crystal Palace",
        "Reina Sofia Museum (home of Guernica)",
        "Thyssen-Bornemisza Museum",
      ],
    },
    {
      area: "Royal Palace",
      blocks: [
        "Royal Palace of Madrid",
        "Almudena Cathedral, next to the Royal Palace",
        "Plaza de Oriente",
      ],
    },
    {
      area: "Malasana & Chueca",
      blocks: [
        "Malasana bohemian district",
        "Chueca nightlife and shopping streets",
        "Conde Duque cultural quarter",
      ],
    },
    {
      area: "Salamanca",
      blocks: [
        "Salamanca district boutique shopping",
        "Santiago Bernabeu Stadium (exterior/tour)",
        "Plaza de Colon",
      ],
    },
  ],
  "Spain:Barcelona": [
    {
      area: "Sagrada Familia & Eixample",
      blocks: [
        "Sagrada Familia",
        "Casa Batllo and Casa Mila (La Pedrera), Passeig de Gracia",
        "Eixample district architecture walk",
      ],
    },
    {
      area: "Gothic Quarter & La Rambla",
      blocks: [
        "La Rambla and Boqueria Market",
        "Gothic Quarter (Barri Gotic) and Barcelona Cathedral",
        "Placa Reial",
      ],
    },
    {
      area: "Park Guell & Gracia",
      blocks: [
        "Park Guell",
        "Gracia neighborhood cafes and plazas",
        "Bunkers del Carmel viewpoint",
      ],
    },
    {
      area: "Barceloneta & Port",
      blocks: [
        "Barceloneta Beach",
        "Port Vell waterfront",
        "W Barcelona and Port Olimpic",
      ],
    },
    {
      area: "Montjuic",
      blocks: [
        "Montjuic hill, castle and cable car",
        "Magic Fountain of Montjuic",
        "Poble Espanyol open-air museum",
      ],
    },
  ],
  "Spain:Valencia": [
    {
      area: "City of Arts & Sciences",
      blocks: [
        "City of Arts and Sciences (Ciudad de las Artes y las Ciencias)",
        "Oceanografic aquarium",
        "Hemisferic planetarium",
      ],
    },
    {
      area: "Old Town",
      blocks: [
        "Valencia Cathedral and Plaza de la Virgen",
        "Central Market (Mercado Central)",
        "Lonja de la Seda (Silk Exchange)",
      ],
    },
    {
      area: "Turia & Beach",
      blocks: [
        "Turia Gardens park walk",
        "Malvarrosa Beach",
        "Malvarrosa seafront promenade",
      ],
    },
  ],
  "Spain:Seville": [
    {
      area: "Historic core",
      blocks: [
        "Seville Cathedral and Giralda Tower",
        "Real Alcazar of Seville",
        "Archivo de Indias, next to the Cathedral",
      ],
    },
    {
      area: "Santa Cruz Quarter",
      blocks: [
        "Santa Cruz Quarter winding streets",
        "Patio de los Naranjos, Seville Cathedral",
        "Hospital de los Venerables",
      ],
    },
    {
      area: "Triana",
      blocks: [
        "Triana district and ceramics workshops",
        "Guadalquivir riverside walk",
        "Triana Market",
      ],
    },
    {
      area: "Plaza de Espana",
      blocks: [
        "Plaza de Espana",
        "Maria Luisa Park",
        "Museum of Arts and Popular Customs, Maria Luisa Park",
      ],
    },
  ],
  "Spain:Malaga": [
    {
      area: "Historic center",
      blocks: [
        "Alcazaba fortress and Gibralfaro Castle",
        "Malaga Cathedral",
        "Roman Theatre, below the Alcazaba",
      ],
    },
    {
      area: "Picasso area",
      blocks: [
        "Picasso Museum Malaga",
        "Calle Larios shopping street",
        "Plaza de la Merced, Picasso's birthplace",
      ],
    },
    {
      area: "Beach & Port",
      blocks: [
        "Malagueta Beach",
        "Muelle Uno waterfront promenade",
        "Centre Pompidou Malaga, Muelle Uno",
      ],
    },
  ],
  "Spain:*": [
    {
      area: "Old town",
      blocks: [
        "Historic old town and cathedral",
        "Main plaza and local market",
        "Old town walking streets",
      ],
    },
    {
      area: "Culture",
      blocks: ["Regional art museum", "Old quarter walking area", "Local craft workshops"],
    },
    {
      area: "Waterfront",
      blocks: [
        "Riverside or seafront promenade",
        "Scenic viewpoint or castle",
        "Local park",
      ],
    },
  ],
};

const COUNTRY_FALLBACK: Record<string, AreaCluster[]> = {
  Japan: AREA_CLUSTERS["Japan:Tokyo"],
  Taiwan: AREA_CLUSTERS["Taiwan:*"],
  Singapore: AREA_CLUSTERS["Singapore:Singapore"],
  Spain: AREA_CLUSTERS["Spain:*"],
};

const GENERIC_FALLBACK: AreaCluster[] = [
  { area: "City center", blocks: ["City center", "Local market", "Main square"] },
  { area: "Culture", blocks: ["Main museum", "Scenic viewpoint", "Historic district"] },
];

function areasFor(country: string, city: string): AreaCluster[] {
  return (
    AREA_CLUSTERS[`${country}:${city}`] ??
    AREA_CLUSTERS[`${country}:*`] ??
    COUNTRY_FALLBACK[country] ??
    GENERIC_FALLBACK
  );
}

// --- helpers ---------------------------------------------------------------
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function parseISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- generator -------------------------------------------------------------
// Realistic daily pacing: 3 stops/blocks a day (morning, afternoon, evening),
// which is what a sightseeing tourist can comfortably cover — not a rushed
// checklist. Every day's 3 stops come from the SAME neighborhood cluster, so
// consecutive stops are always genuinely close to each other (e.g. picking
// Shibuya Crossing means the next stop that day is also in Shibuya/Harajuku,
// never a landmark on the other side of the city). Areas rotate across the
// trip so a multi-day itinerary covers different parts of the city, and the
// starting area is chosen by a stable per-application seed so different
// applicants get different (but each internally consistent) routes. Within
// an area, the most famous highlights are listed first and are always picked
// first — the rarer, secondary spots only appear on longer trips that revisit
// an area a second time.
export function generateItinerary(opts: {
  destinationCountry: string;
  destinationCity: string;
  travelStart: string;
  travelEnd: string;
  seed: string;
}): ItineraryDay[] {
  const start = parseISO(opts.travelStart);
  const end = parseISO(opts.travelEnd);
  if (!start || !end || end < start) return [];

  const areas = areasFor(opts.destinationCountry, opts.destinationCity);
  const city = opts.destinationCity || opts.destinationCountry;
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  // Rotate the area order by seed so different applicants start in a
  // different neighborhood, while each individual itinerary stays consistent
  // (same seed -> same order) across regenerations.
  const startIdx = areas.length > 0 ? hashSeed(opts.seed) % areas.length : 0;
  const orderedAreas = areas.map((_, i) => areas[(startIdx + i) % areas.length]);

  // Per-area cursor so a trip long enough to revisit an area picks its NEXT
  // highlights rather than repeating the same 3.
  const cursorByArea = new Map<string, number>();
  const pickFromArea = (area: AreaCluster, count: number): string[] => {
    let cursor = cursorByArea.get(area.area) ?? 0;
    const picks: string[] = [];
    for (let k = 0; k < count; k++) {
      picks.push(area.blocks[cursor % area.blocks.length]);
      cursor += 1;
    }
    cursorByArea.set(area.area, cursor);
    return picks;
  };

  let areaPointer = 0;
  const nextArea = (): AreaCluster => {
    const a = orderedAreas[areaPointer % orderedAreas.length];
    areaPointer += 1;
    return a;
  };
  // Arrival day never gets a day-trip area — the applicant has just landed
  // and needs to check in first, so a half-day out-of-city excursion the same
  // day isn't realistic. Skip ahead to the first in-city area, and leave the
  // pointer there so day trips still appear naturally on later, full days.
  const nextInCityArea = (): AreaCluster => {
    let skipped = 0;
    while (orderedAreas[areaPointer % orderedAreas.length]?.dayTrip && skipped < orderedAreas.length) {
      areaPointer += 1;
      skipped += 1;
    }
    return nextArea();
  };

  const days: ItineraryDay[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const isFirst = i === 0;
    const isLast = totalDays > 1 && i === totalDays - 1;

    if (isFirst) {
      // Arrival day: half a day of sightseeing, in one nearby in-city area,
      // once the applicant has checked in.
      const area = nextInCityArea();
      const [afternoon, evening] = pickFromArea(area, 2);
      days.push({
        date: toISO(date),
        city,
        morning: `Arrival in ${city} and hotel check-in`,
        afternoon,
        evening,
      });
    } else if (isLast) {
      days.push({
        date: toISO(date),
        city,
        morning: "Final short walk in the city center",
        afternoon: "Travel to the airport",
        evening: "Departure back to Seoul, Korea",
      });
    } else {
      const area = nextArea();
      const [morning, afternoon, evening] = pickFromArea(area, 3);
      days.push({ date: toISO(date), city, morning, afternoon, evening });
    }
  }

  return days;
}
