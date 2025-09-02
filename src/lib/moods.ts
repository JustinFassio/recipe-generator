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
export const ALL_MOODS = Object.values(MOOD_REGIONS).flatMap(region => region.moods);

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
