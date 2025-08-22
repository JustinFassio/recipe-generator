/**
 * Profile-related constants shared across the application
 * Following the Phase 1 atomic feature approach
 */

// Skill level mapping constants
export const SKILL_LEVEL_MAP: Record<string, string> = {
  '1': 'beginner',
  '2': 'intermediate',
  '3': 'advanced',
  '4': 'expert',
  '5': 'chef',
};

export const SKILL_LEVEL_REVERSE_MAP: Record<string, string> = {
  beginner: '1',
  intermediate: '2',
  advanced: '3',
  expert: '4',
  chef: '5',
};

// Skill level validation constants
export const SKILL_LEVEL_UI_VALUES = ['1', '2', '3', '4', '5'] as const;
export const SKILL_LEVEL_DB_VALUES = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'chef',
] as const;

// Type definitions for skill levels
export type SkillLevelUI = (typeof SKILL_LEVEL_UI_VALUES)[number];
export type SkillLevelDB = (typeof SKILL_LEVEL_DB_VALUES)[number];
