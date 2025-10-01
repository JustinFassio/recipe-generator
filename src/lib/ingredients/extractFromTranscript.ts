// Deterministic extractor: scans transcript for known ingredient names and aliases
// without calling the backend. Uses simple word-boundary matching with normalization.

import { normalizeText } from '@/lib/utils/text-normalization';

function normalize(input: string): string {
  return normalizeText(input);
}

function makeWordBoundaryRegex(term: string): RegExp {
  // Escape regex special chars and match as a whole word (allowing spaces inside the term)
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, 'i');
}

// Minimal in-memory alias list for deterministic matching without DB
// This can be expanded over time; duplicates are fine.
const STATIC_INGREDIENTS: Array<{ name: string; aliases?: string[] }> = [
  {
    name: 'rice',
    aliases: ['white rice', 'brown rice', 'jasmine rice', 'basmati'],
  },
  { name: 'coconut milk', aliases: ['coconut cream'] },
  { name: 'onion', aliases: ['yellow onion', 'red onion', 'white onion'] },
  { name: 'garlic', aliases: ['garlic cloves'] },
  { name: 'ginger' },
  { name: 'chili peppers', aliases: ['chile', 'chilies', 'chili'] },
  { name: 'lemongrass' },
  { name: 'galangal' },
  { name: 'turmeric' },
  { name: 'coriander', aliases: ['cilantro', 'fresh coriander'] },
  { name: 'cumin' },
  { name: 'candlenuts' },
  { name: 'palm sugar', aliases: ['coconut sugar'] },
  { name: 'tamarind', aliases: ['tamarind paste'] },
  { name: 'shrimp paste', aliases: ['belacan', 'terasi'] },
  { name: 'fish' },
  // Thai-specific essentials
  { name: 'fish sauce' },
  { name: 'thai red curry paste', aliases: ['red curry paste'] },
  { name: 'thai green curry paste', aliases: ['green curry paste'] },
  {
    name: 'kaffir lime leaves',
    aliases: ['makrut lime leaves', 'lime leaves'],
  },
  { name: 'thai basil', aliases: ['holy basil', 'sweet basil'] },
  { name: 'peanuts', aliases: ['peanut'] },
  // Common pantry
  { name: 'flour', aliases: ['all-purpose flour', 'ap flour'] },
  { name: 'eggs', aliases: ['egg'] },
  { name: 'milk' },
  { name: 'butter' },
  { name: 'olive oil', aliases: ['extra-virgin olive oil', 'ev oo', 'evoo'] },
  { name: 'salt' },
  { name: 'black pepper', aliases: ['pepper'] },
  { name: 'tomato', aliases: ['tomatoes'] },
  { name: 'chicken' },
  { name: 'beef' },
  { name: 'fish sauce' },
];

export function extractIngredientsFromTranscript(transcript: string): string[] {
  if (!transcript || !transcript.trim()) return [];
  const text = normalize(transcript);

  const found = new Set<string>();
  for (const item of STATIC_INGREDIENTS) {
    const candidates = [item.name, ...(item.aliases ?? [])];
    for (const term of candidates) {
      const rx = makeWordBoundaryRegex(normalize(term));
      if (rx.test(text)) {
        found.add(item.name);
        break;
      }
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b));
}
