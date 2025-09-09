// Lightweight ingredient text parser used before saving to Global Ingredients.
// Goal: strip quantity/units/size adjectives and return the clean ingredient name,
// while also returning structured pieces if the caller wants them.

export type ParsedIngredient = {
  name: string; // canonical-ish display name (e.g., "yellow squash")
  quantity: string | null; // e.g., "1", "1-2", "1/2"
  unit: string | null; // e.g., "cup", "tbsp", "oz"
  size: string | null; // e.g., "small", "medium", "large"
  original: string;
};

const UNIT_PATTERN =
  /(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?)\b/i;

const SIZE_PATTERN = /(small|medium|large|xl|extra[-\s]?large|jumbo)\b/i;

export function parseIngredientText(rawInput: string): ParsedIngredient {
  // Normalize whitespace and remove parentheses content (notes like "(optional)")
  let s = rawInput.replace(/\([^)]*\)/g, ' ');
  // Remove any trailing clause after a comma (e.g., ", divided", ", optional")
  s = s.replace(/,.*$/, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  // Capture an optional leading quantity (numbers, decimals, mixed numbers, ranges, fractions)
  // followed by an optional unit and optional size descriptor.
  const qtyUnit = new RegExp(
    `^\\s*(?<qty>(?:\\d+(?:[./]\\d+)?|\\d*\\s*\\d/\\d|\\d+\\.\\d+|\\d+\\s*-\\s*\\d+)?)\\s*(?<unit>${UNIT_PATTERN.source})?\\s*(?<size>${SIZE_PATTERN.source})?\\s*`,
    'i'
  );

  const m = s.match(qtyUnit);
  const start = m ? m[0].length : 0;
  const rest = s.slice(start);

  // Strip leading filler like "of" or "about" then collapse whitespace
  const name = rest
    .replace(/\b(of|about|approximately)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    name,
    quantity: m?.groups?.qty?.trim() || null,
    unit: m?.groups?.unit ? m.groups.unit.toLowerCase() : null,
    size: m?.groups?.size ? m.groups.size.toLowerCase() : null,
    original: rawInput.trim(),
  };
}
