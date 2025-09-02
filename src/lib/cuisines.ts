/**
 * Enhanced cuisine definitions organized by continents and major regions
 * Provides comprehensive global coverage with intuitive navigation
 */

// Import the Cuisine type for proper typing
import type { Cuisine } from './types';

export interface CuisineRegion {
  description: string;
  cuisines: readonly string[];
}

export interface CuisineData {
  [region: string]: CuisineRegion;
}

// Comprehensive cuisine organization by continents and major regions
export const CUISINE_REGIONS: CuisineData = {
  'Americas': {
    description: 'American culinary traditions',
    cuisines: [
      'Mexican', 'American', 'Brazilian', 'Peruvian', 'Caribbean',
      'Argentine', 'Chilean', 'Colombian', 'Venezuelan', 'Canadian',
      'Ecuadorian', 'Uruguayan', 'Paraguayan', 'Guatemalan', 'Honduran',
      'Salvadoran', 'Nicaraguan', 'Costa Rican', 'Panamanian', 'Belizean',
      'Jamaican', 'Trinidadian', 'Barbadian', 'Bahamian', 'Cuban',
      'Dominican', 'Haitian'
    ]
  },
  'Europe': {
    description: 'European culinary traditions',
    cuisines: [
      'Italian', 'French', 'Greek', 'Spanish', 'British', 'German', 
      'Russian', 'Polish', 'Hungarian', 'Czech', 'Dutch', 'Belgian',
      'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Swiss', 'Austrian',
      'Ukrainian', 'Belarusian', 'Lithuanian', 'Latvian', 'Estonian',
      'Romanian', 'Bulgarian', 'Serbian', 'Croatian', 'Slovenian',
      'Slovak', 'Moldovan'
    ]
  },
  'Asia': {
    description: 'Asian culinary traditions', 
    cuisines: [
      'Chinese', 'Japanese', 'Thai', 'Korean', 'Vietnamese', 'Indian',
      'Indonesian', 'Malaysian', 'Filipino', 'Cambodian', 'Laotian',
      'Nepalese', 'Sri Lankan', 'Bangladeshi', 'Pakistani', 'Myanmar',
      'Bruneian', 'Timorese', 'Singaporean', 'Kazakh', 'Uzbek',
      'Kyrgyz', 'Tajik', 'Turkmen', 'Mongolian', 'Afghan', 'Azerbaijani'
    ]
  },
  'Africa': {
    description: 'African culinary traditions',
    cuisines: [
      'Moroccan', 'Ethiopian', 'Nigerian', 'South African', 'Kenyan',
      'Senegalese', 'Ghanaian', 'Egyptian', 'Tunisian', 'Algerian',
      'Ugandan', 'Tanzanian', 'Zimbabwean', 'Zambian', 'Malawian',
      'Mozambican', 'Angolan', 'Namibian', 'Botswanan'
    ]
  },
  'Middle East': {
    description: 'Middle Eastern culinary traditions',
    cuisines: [
      'Lebanese', 'Turkish', 'Middle Eastern', 'Israeli', 'Iranian',
      'Iraqi', 'Syrian', 'Jordanian', 'Palestinian', 'Yemeni'
    ]
  },
  'Oceania': {
    description: 'Oceanic culinary traditions',
    cuisines: [
      'Hawaiian', 'Polynesian', 'Fijian', 'Maori', 'Australian',
      'Papuan', 'Solomon Islander', 'Vanuatuan', 'New Caledonian', 'Samoan'
    ]
  }
};

// Flattened list of all available cuisines
export const ALL_CUISINES = [
  ...CUISINE_REGIONS['Americas'].cuisines,
  ...CUISINE_REGIONS['Europe'].cuisines,
  ...CUISINE_REGIONS['Asia'].cuisines,
  ...CUISINE_REGIONS['Africa'].cuisines,
  ...CUISINE_REGIONS['Middle East'].cuisines,
  ...CUISINE_REGIONS['Oceania'].cuisines,
] as const;

// Legacy support - maintain existing CUISINE_OPTIONS for backward compatibility
export const CUISINE_OPTIONS = [...ALL_CUISINES] as const;

// Cuisine labels mapping (for display purposes)
export const CUISINE_LABELS: Record<Cuisine, string> = ALL_CUISINES.reduce(
  (acc, cuisine) => {
    acc[cuisine] = cuisine;
    return acc;
  },
  {} as Record<Cuisine, string>
);

// Helper functions
export function getCuisinesByRegion(region: string): readonly string[] {
  return CUISINE_REGIONS[region]?.cuisines || [];
}

export function getCuisineRegion(cuisine: Cuisine): string | null {
  for (const [region, data] of Object.entries(CUISINE_REGIONS)) {
    if (data.cuisines.includes(cuisine)) {
      return region;
    }
  }
  return null;
}

export function getAvailableRegions(): readonly string[] {
  return Object.keys(CUISINE_REGIONS);
}

export function searchCuisines(query: string): Cuisine[] {
  const lowerQuery = query.toLowerCase();
  return ALL_CUISINES.filter(cuisine => 
    cuisine.toLowerCase().includes(lowerQuery)
  );
}
