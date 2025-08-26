// Recipe-related constants
export const MAX_CATEGORIES_PER_RECIPE = 6;
export const MAX_CATEGORY_LENGTH = 50;

// Filter options
export const COOKING_TIME_OPTIONS: Array<'quick' | 'medium' | 'long'> = [
  'quick',
  'medium',
  'long',
];

export const DIFFICULTY_OPTIONS: Array<
  'beginner' | 'intermediate' | 'advanced'
> = ['beginner', 'intermediate', 'advanced'];

export const COOKING_TIME_LABELS: Record<'quick' | 'medium' | 'long', string> =
  {
    quick: 'Quick (< 30 min)',
    medium: 'Medium (30-60 min)',
    long: 'Long (> 60 min)',
  };

export const DIFFICULTY_LABELS: Record<
  'beginner' | 'intermediate' | 'advanced',
  string
> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
