import { Country } from "./schema";

export interface CountryNeighbors {
  [countryCode: string]: string[];
}

export const countryNeighbors: CountryNeighbors = {
  "US": ["CA", "MX"],
  "CA": ["US"],
  "MX": ["US", "GT", "BZ"],
  "GB": ["IE"],
  "FR": ["ES", "IT", "CH", "DE", "BE", "LU"],
  "DE": ["DK", "PL", "CZ", "AT", "CH", "FR", "LU", "BE", "NL"],
  "IT": ["FR", "CH", "AT", "SI", "VA"],
  "ES": ["FR", "PT"],
  "PT": ["ES"],
  "RU": ["NO", "FI", "EE", "LV", "LT", "PL", "BY", "UA", "GE", "AZ", "KZ", "MN", "CN", "KP"],
  "CN": ["KP", "KR", "MN", "RU", "KZ", "KG", "TJ", "AF", "PK", "IN", "NP", "BT", "MM", "LA", "VN"],
  "JP": [],
  "IN": ["PK", "CN", "NP", "BT", "MM", "BD"],
  "BR": ["UY", "AR", "PY", "BO", "PE", "CO", "VE", "GY", "SR"],
  "AR": ["CL", "BO", "PY", "BR", "UY"],
  "AU": [],
  "EG": ["LY", "SD", "IL"],
  "ZA": ["NA", "BW", "ZW", "MZ", "SZ", "LS"],
  "NG": ["BJ", "NE", "TD", "CM"],
  "KE": ["SO", "ET", "SS", "UG", "TZ"],
  "SA": ["JO", "IQ", "KW", "QA", "AE", "OM", "YE"],
  "TR": ["GR", "BG", "GE", "AM", "AZ", "IR", "IQ", "SY"],
  "IR": ["TR", "IQ", "KW", "SA", "AE", "OM", "AF", "PK", "TM", "AZ", "AM"],
  "PK": ["IN", "CN", "AF", "IR"],
  "BD": ["IN", "MM"],
  "TH": ["MM", "LA", "KH", "MY"],
  "VN": ["CN", "LA", "KH"],
  "MY": ["TH", "SG", "BN", "ID"],
  "PH": [],
  "ID": ["MY", "PG", "TL"],
  "SG": ["MY"],
  "KR": ["KP"],
  "IL": ["LB", "SY", "JO", "EG"],
  "AE": ["SA", "OM"],
  "CL": ["PE", "BO", "AR"],
  "PE": ["EC", "CO", "BR", "BO", "CL"],
  "CO": ["PA", "VE", "BR", "PE", "EC"],
  "VE": ["CO", "BR", "GY"],
  "MA": ["DZ", "EH"],
  "TN": ["DZ", "LY"],
  "DZ": ["MA", "TN", "LY", "NE", "ML", "MR"],
  "ET": ["ER", "DJ", "SO", "KE", "SS", "SD"],
  "GH": ["CI", "BF", "TG"],
  "SN": ["MR", "ML", "GN", "GW", "GM"],
  "UG": ["SS", "KE", "TZ", "RW", "CD"],
  "TZ": ["KE", "UG", "RW", "BI", "CD", "ZM", "MW", "MZ"],
  "ZW": ["ZM", "MZ", "ZA", "BW"],
};

export const continentCountries: { [continent: string]: string[] } = {
  "Europe": ["GB", "FR", "DE", "IT", "ES", "RU", "PT", "PL", "RO", "NL", "BE", "CZ", "GR", "SE", "HU", "AT", "BY", "RS", "CH", "BG", "DK", "FI", "SK", "NO", "IE", "HR", "BA", "GE", "LT", "SI", "LV", "MK", "EE", "AL", "MD", "MT", "LU", "CY", "ME", "IS", "MC", "LI", "AD", "SM", "VA"],
  "Asia": ["CN", "IN", "ID", "PK", "BD", "JP", "PH", "VN", "TR", "IR", "TH", "MY", "SA", "UZ", "AF", "IQ", "SY", "YE", "KR", "KP", "TM", "TJ", "AZ", "AE", "JO", "IL", "LA", "LB", "KG", "SG", "OM", "KW", "AM", "MM", "BH", "TL", "BT", "QA", "MN", "KH", "NP", "BN", "TW", "LK"],
  "Africa": ["NG", "ET", "EG", "CD", "TZ", "ZA", "KE", "UG", "DZ", "SD", "MA", "AO", "GH", "MZ", "MG", "CM", "CI", "NE", "BF", "ML", "MW", "ZM", "SN", "SO", "TD", "ZW", "GN", "RW", "BJ", "TN", "BI", "SS", "TG", "SL", "LY", "LR", "MR", "ER", "GA", "BW", "GM", "NA", "LS", "GW", "GQ", "MU", "SZ", "DJ", "KM", "CV", "ST", "SC"],
  "North America": ["US", "MX", "CA", "GT", "CU", "HT", "DO", "HN", "NI", "SV", "CR", "PA", "JM", "TT", "BS", "BZ", "BB", "LC", "GD", "VC", "AG", "DM", "KN"],
  "South America": ["BR", "CO", "AR", "PE", "VE", "CL", "EC", "BO", "PY", "UY", "GY", "SR"],
  "Oceania": ["AU", "PG", "NZ", "FJ", "SB", "VU", "WS", "KI", "TO", "FM", "PW", "MH", "NR", "TV"]
};

export interface GeographicProximity {
  isHomeCountry: boolean;
  isNeighbor: boolean;
  isSameContinent: boolean;
  proximityScore: number;
}

export function calculateGeographicProximity(
  targetCountryCode: string,
  homeCountryCode: string,
  targetContinent: string
): GeographicProximity {
  const isHomeCountry = targetCountryCode === homeCountryCode;
  
  const neighbors = countryNeighbors[homeCountryCode] || [];
  const isNeighbor = neighbors.includes(targetCountryCode);
  
  const homeContinent = Object.entries(continentCountries).find(([_, countries]) => 
    countries.includes(homeCountryCode)
  )?.[0] || "";
  
  const isSameContinent = homeContinent === targetContinent;
  
  let proximityScore = 0;
  if (isHomeCountry) proximityScore = 100;
  else if (isNeighbor) proximityScore = 75;
  else if (isSameContinent) proximityScore = 50;
  else proximityScore = 25;
  
  return {
    isHomeCountry,
    isNeighbor,
    isSameContinent,
    proximityScore
  };
}

export function adjustInitialDifficulty(
  baseStaticDifficulty: number,
  proximity: GeographicProximity
): number {
  let adjustedDifficulty = baseStaticDifficulty;
  
  if (proximity.isHomeCountry) {
    adjustedDifficulty = Math.max(0, adjustedDifficulty - 40);
  } else if (proximity.isNeighbor) {
    adjustedDifficulty = Math.max(0, adjustedDifficulty - 25);
  } else if (proximity.isSameContinent) {
    adjustedDifficulty = Math.max(0, adjustedDifficulty - 15);
  }
  
  return Math.round(adjustedDifficulty);
}

export function getStaticDifficultyScore(difficulty: string): number {
  const difficultyMap: { [key: string]: number } = {
    'beginner': 20,
    'easy': 35,
    'intermediate': 50,
    'advanced': 70,
    'expert': 85
  };
  return difficultyMap[difficulty] || 50;
}

export function getDiverseAssessmentCountries(allCountries: Country[], count: number = 25): Country[] {
  const continents = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];
  const difficulties = ["beginner", "easy", "intermediate"];
  
  const selectedCountries: Country[] = [];
  const countriesPerContinent = Math.floor(count / continents.length);
  
  for (const continent of continents) {
    const continentCountriesList = allCountries.filter(c => c.continent === continent);
    
    for (const difficulty of difficulties) {
      const difficultyCountries = continentCountriesList.filter(c => c.difficulty === difficulty);
      if (difficultyCountries.length > 0) {
        const randomIndex = Math.floor(Math.random() * difficultyCountries.length);
        selectedCountries.push(difficultyCountries[randomIndex]);
      }
    }
  }
  
  const shuffled = selectedCountries.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
