/**
 * FLAVOR AND MOOD SYSTEM
 * 
 * This file contains all mood-related definitions and logic.
 * It is the SINGLE SOURCE OF TRUTH for mood information in the application.
 * 
 * IMPORTANT: Do NOT import mood data from other files (e.g., constants.ts).
 * All mood definitions, regions, and options are centralized here.
 * 
 * Architecture:
 * - MOOD_REGIONS: Organized by mood categories (Flavor, Emotional, Energy, etc.)
 * - ALL_MOODS: Flattened list with const assertions for type safety
 * - MOOD_OPTIONS: Type-safe options for filtering and selection
 * - MOOD_LABELS: Display labels for UI components
 * 
 * Comprehensive mood system for recipe filtering and AI guidance
 * Organized by flavor profiles, emotional states, and culinary preferences
 */

export interface MoodData {
  [region: string]: {
    description: string;
    moods: string[];
  };
}

export const MOOD_REGIONS: MoodData = {
  'Flavor Profiles': {
    description: 'Taste and texture preferences',
    moods: [
      'Savory',
      'Sweet', 
      'Spicy',
      'Tangy',
      'Creamy',
      'Crunchy',
      'Umami',
      'Bitter',
      'Smoky',
      'Fresh'
    ]
  },
  'Emotional States': {
    description: 'How food makes you feel',
    moods: [
      'Comfort',
      'Energizing',
      'Relaxing',
      'Celebratory',
      'Nostalgic',
      'Adventurous',
      'Cozy',
      'Refreshing',
      'Uplifting',
      'Soothing'
    ]
  },
  'Energy Levels': {
    description: 'Food weight and timing preferences',
    moods: [
      'Light',
      'Heavy',
      'Quick',
      'Slow',
      'Substantial',
      'Airy',
      'Immediate',
      'Patient'
    ]
  },
  'Seasonal Vibes': {
    description: 'Weather and time-based preferences',
    moods: [
      'Cozy',
      'Refreshing',
      'Festive',
      'Everyday',
      'Summer',
      'Winter',
      'Spring',
      'Autumn',
      'Holiday',
      'Weekend'
    ]
  },
  'Social Context': {
    description: 'Dining situation preferences',
    moods: [
      'Sharing',
      'Solo',
      'Romantic',
      'Party',
      'Family',
      'Intimate',
      'Communal',
      'Personal'
    ]
  },
  'Culinary Style': {
    description: 'Cooking approach and presentation',
    moods: [
      'Traditional',
      'Simple',
      'Gourmet',
      'Rustic',
      'Elegant',
      'Casual',
      'Artisanal',
      'Home-style',
      'Fusion',
      'Classic'
    ]
  }
};

// Flatten all moods into a single array for easy access
export const ALL_MOODS = [
  ...MOOD_REGIONS['Flavor Profiles'].moods,
  ...MOOD_REGIONS['Emotional States'].moods,
  ...MOOD_REGIONS['Energy Levels'].moods,
  ...MOOD_REGIONS['Seasonal Vibes'].moods,
  ...MOOD_REGIONS['Social Context'].moods,
  ...MOOD_REGIONS['Culinary Style'].moods,
] as const;

// For backward compatibility and consistency with existing patterns
export const MOOD_OPTIONS = [...ALL_MOODS] as const;

// Create labels for display (same as values for now, but can be customized)
export const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  ALL_MOODS.map(mood => [mood, mood])
);

// Helper functions
export function getMoodsByRegion(region: string): string[] {
  return MOOD_REGIONS[region]?.moods || [];
}

export function getMoodRegion(mood: string): string | null {
  for (const [region, data] of Object.entries(MOOD_REGIONS)) {
    if (data.moods.includes(mood)) {
      return region;
    }
  }
  return null;
}

export function getAvailableRegions(): string[] {
  return Object.keys(MOOD_REGIONS);
}

export function searchMoods(query: string): string[] {
  const lowercaseQuery = query.toLowerCase();
  return ALL_MOODS.filter(mood => 
    mood.toLowerCase().includes(lowercaseQuery)
  );
}

// Type for mood values
export type Mood = typeof ALL_MOODS[number];
