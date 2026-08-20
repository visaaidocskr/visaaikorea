// Curated city/airport directory for the flight-search autocomplete.
// Focused on where our clients actually fly: Korea outbound, our visa
// destinations, Central Asia home routes, and the common hubs between.
// Names are kept in English — IATA codes and airport names are what tickets
// and boarding passes print, in every locale.

export type Airport = {
  /** IATA code, e.g. "ICN" */
  code: string;
  name: string;
};

export type CityEntry = {
  city: string;
  country: string;
  airports: Airport[];
};

export const CITIES: CityEntry[] = [
  // Korea
  { city: "Seoul", country: "South Korea", airports: [
    { code: "ICN", name: "Incheon International Airport" },
    { code: "GMP", name: "Gimpo International Airport" },
  ]},
  { city: "Busan", country: "South Korea", airports: [{ code: "PUS", name: "Gimhae International Airport" }] },
  { city: "Jeju", country: "South Korea", airports: [{ code: "CJU", name: "Jeju International Airport" }] },
  { city: "Daegu", country: "South Korea", airports: [{ code: "TAE", name: "Daegu International Airport" }] },
  // Japan
  { city: "Tokyo", country: "Japan", airports: [
    { code: "NRT", name: "Narita International Airport" },
    { code: "HND", name: "Haneda Airport" },
  ]},
  { city: "Osaka", country: "Japan", airports: [
    { code: "KIX", name: "Kansai International Airport" },
    { code: "ITM", name: "Osaka Itami Airport" },
  ]},
  { city: "Fukuoka", country: "Japan", airports: [{ code: "FUK", name: "Fukuoka Airport" }] },
  { city: "Sapporo", country: "Japan", airports: [{ code: "CTS", name: "New Chitose Airport" }] },
  { city: "Nagoya", country: "Japan", airports: [{ code: "NGO", name: "Chubu Centrair International Airport" }] },
  { city: "Okinawa", country: "Japan", airports: [{ code: "OKA", name: "Naha Airport" }] },
  // Taiwan
  { city: "Taipei", country: "Taiwan", airports: [
    { code: "TPE", name: "Taoyuan International Airport" },
    { code: "TSA", name: "Songshan Airport" },
  ]},
  { city: "Kaohsiung", country: "Taiwan", airports: [{ code: "KHH", name: "Kaohsiung International Airport" }] },
  { city: "Taichung", country: "Taiwan", airports: [{ code: "RMQ", name: "Taichung International Airport" }] },
  // Singapore
  { city: "Singapore", country: "Singapore", airports: [{ code: "SIN", name: "Changi Airport" }] },
  // Vietnam
  { city: "Hanoi", country: "Vietnam", airports: [{ code: "HAN", name: "Noi Bai International Airport" }] },
  { city: "Ho Chi Minh City", country: "Vietnam", airports: [{ code: "SGN", name: "Tan Son Nhat International Airport" }] },
  { city: "Da Nang", country: "Vietnam", airports: [{ code: "DAD", name: "Da Nang International Airport" }] },
  { city: "Nha Trang", country: "Vietnam", airports: [{ code: "CXR", name: "Cam Ranh International Airport" }] },
  { city: "Phu Quoc", country: "Vietnam", airports: [{ code: "PQC", name: "Phu Quoc International Airport" }] },
  // Spain
  { city: "Madrid", country: "Spain", airports: [{ code: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport" }] },
  { city: "Barcelona", country: "Spain", airports: [{ code: "BCN", name: "Josep Tarradellas Barcelona–El Prat Airport" }] },
  { city: "Malaga", country: "Spain", airports: [{ code: "AGP", name: "Málaga–Costa del Sol Airport" }] },
  { city: "Seville", country: "Spain", airports: [{ code: "SVQ", name: "Seville Airport" }] },
  { city: "Valencia", country: "Spain", airports: [{ code: "VLC", name: "Valencia Airport" }] },
  // Uzbekistan
  { city: "Tashkent", country: "Uzbekistan", airports: [{ code: "TAS", name: "Islam Karimov Tashkent International Airport" }] },
  { city: "Samarkand", country: "Uzbekistan", airports: [{ code: "SKD", name: "Samarkand International Airport" }] },
  { city: "Bukhara", country: "Uzbekistan", airports: [{ code: "BHK", name: "Bukhara International Airport" }] },
  { city: "Urgench", country: "Uzbekistan", airports: [{ code: "UGC", name: "Urgench International Airport" }] },
  { city: "Namangan", country: "Uzbekistan", airports: [{ code: "NMA", name: "Namangan Airport" }] },
  { city: "Fergana", country: "Uzbekistan", airports: [{ code: "FEG", name: "Fergana International Airport" }] },
  // Central Asia
  { city: "Almaty", country: "Kazakhstan", airports: [{ code: "ALA", name: "Almaty International Airport" }] },
  { city: "Astana", country: "Kazakhstan", airports: [{ code: "NQZ", name: "Nursultan Nazarbayev International Airport" }] },
  { city: "Bishkek", country: "Kyrgyzstan", airports: [{ code: "FRU", name: "Manas International Airport" }] },
  { city: "Dushanbe", country: "Tajikistan", airports: [{ code: "DYU", name: "Dushanbe International Airport" }] },
  // China + HK/Macau
  { city: "Beijing", country: "China", airports: [
    { code: "PEK", name: "Beijing Capital International Airport" },
    { code: "PKX", name: "Beijing Daxing International Airport" },
  ]},
  { city: "Shanghai", country: "China", airports: [
    { code: "PVG", name: "Shanghai Pudong International Airport" },
    { code: "SHA", name: "Shanghai Hongqiao International Airport" },
  ]},
  { city: "Guangzhou", country: "China", airports: [{ code: "CAN", name: "Guangzhou Baiyun International Airport" }] },
  { city: "Hangzhou", country: "China", airports: [{ code: "HGH", name: "Hangzhou Xiaoshan International Airport" }] },
  { city: "Hong Kong", country: "Hong Kong", airports: [{ code: "HKG", name: "Hong Kong International Airport" }] },
  { city: "Macau", country: "Macau", airports: [{ code: "MFM", name: "Macau International Airport" }] },
  // Southeast Asia
  { city: "Bangkok", country: "Thailand", airports: [
    { code: "BKK", name: "Suvarnabhumi Airport" },
    { code: "DMK", name: "Don Mueang International Airport" },
  ]},
  { city: "Phuket", country: "Thailand", airports: [{ code: "HKT", name: "Phuket International Airport" }] },
  { city: "Chiang Mai", country: "Thailand", airports: [{ code: "CNX", name: "Chiang Mai International Airport" }] },
  { city: "Manila", country: "Philippines", airports: [{ code: "MNL", name: "Ninoy Aquino International Airport" }] },
  { city: "Cebu", country: "Philippines", airports: [{ code: "CEB", name: "Mactan–Cebu International Airport" }] },
  { city: "Kuala Lumpur", country: "Malaysia", airports: [{ code: "KUL", name: "Kuala Lumpur International Airport" }] },
  { city: "Jakarta", country: "Indonesia", airports: [{ code: "CGK", name: "Soekarno–Hatta International Airport" }] },
  { city: "Denpasar (Bali)", country: "Indonesia", airports: [{ code: "DPS", name: "Ngurah Rai International Airport" }] },
  // Middle East / Türkiye
  { city: "Dubai", country: "United Arab Emirates", airports: [{ code: "DXB", name: "Dubai International Airport" }] },
  { city: "Abu Dhabi", country: "United Arab Emirates", airports: [{ code: "AUH", name: "Zayed International Airport" }] },
  { city: "Istanbul", country: "Türkiye", airports: [
    { code: "IST", name: "Istanbul Airport" },
    { code: "SAW", name: "Sabiha Gökçen International Airport" },
  ]},
  // Russia / Mongolia
  { city: "Moscow", country: "Russia", airports: [
    { code: "SVO", name: "Sheremetyevo International Airport" },
    { code: "DME", name: "Domodedovo International Airport" },
  ]},
  { city: "Vladivostok", country: "Russia", airports: [{ code: "VVO", name: "Vladivostok International Airport" }] },
  { city: "Ulaanbaatar", country: "Mongolia", airports: [{ code: "UBN", name: "Chinggis Khaan International Airport" }] },
  // Long haul
  { city: "New York", country: "United States", airports: [
    { code: "JFK", name: "John F. Kennedy International Airport" },
    { code: "EWR", name: "Newark Liberty International Airport" },
  ]},
  { city: "Los Angeles", country: "United States", airports: [{ code: "LAX", name: "Los Angeles International Airport" }] },
  { city: "London", country: "United Kingdom", airports: [
    { code: "LHR", name: "Heathrow Airport" },
    { code: "LGW", name: "Gatwick Airport" },
  ]},
  { city: "Paris", country: "France", airports: [{ code: "CDG", name: "Charles de Gaulle Airport" }] },
  { city: "Frankfurt", country: "Germany", airports: [{ code: "FRA", name: "Frankfurt Airport" }] },
  { city: "Rome", country: "Italy", airports: [{ code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport" }] },
];

/**
 * Prefix-first search over city names, countries, airport names and IATA
 * codes. Returns whole city groups so the dropdown can show
 * "Hanoi · All airports" followed by its airports.
 */
export function searchCities(query: string, limit = 6): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const scored: Array<{ score: number; entry: CityEntry }> = [];
  for (const entry of CITIES) {
    const city = entry.city.toLowerCase();
    const country = entry.country.toLowerCase();
    let score = 0;
    // An exact IATA code hit outranks everything: "han" must put Hanoi first.
    if (entry.airports.some((a) => a.code.toLowerCase() === q)) score = 110;
    else if (city.startsWith(q)) score = 100;
    else if (entry.airports.some((a) => a.code.toLowerCase().startsWith(q))) score = 80;
    else if (city.includes(q)) score = 70;
    else if (country.startsWith(q)) score = 60;
    else if (entry.airports.some((a) => a.name.toLowerCase().includes(q))) score = 50;
    else if (country.includes(q)) score = 40;
    if (score > 0) scored.push({ score, entry });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.city.localeCompare(b.entry.city));
  return scored.slice(0, limit).map((s) => s.entry);
}
