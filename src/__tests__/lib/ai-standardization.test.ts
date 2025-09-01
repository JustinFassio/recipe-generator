import { parseRecipeFromText } from '@/lib/recipe-parser';

describe('AI Recipe Standardization', () => {
  it('should standardize complex wellness recipe format', async () => {
    const complexRecipe = `Beautiful—keeping it raw enhances **enzyme activity**, supports **liver detox**, and aligns with **spring/summer Ayurvedic cleansing** (especially for Kapha or excess Ama). Here's a fully raw version that **pops with flavor**, **balances digestion**, and delivers deep nourishment:

### 🌱 **Raw Strawberry-Spinach Glow Salad with Balsamic-Onion Vinaigrette**
#### 🍽️ Serves: 2 | 🕒 Prep Time: 10–15 mins | All Raw 🌿

### 🥗 **Salad Ingredients**
* 2 large handfuls **fresh spinach**
* ½ cup **thawed strawberries**, thinly sliced
* ¼ cup **purple cabbage**, finely shredded
* ¼ cup **cucumber**, thin rounds or ribbons
* ¼ small **red onion**, paper-thin slices
* 1 clove **garlic**, microplaned or mashed (optional – very bold raw)
* 1 tbsp **raw walnuts** or **sunflower seeds**
* Optional: Crumbled **goat cheese** or ½ soft **boiled egg**, peeled and sliced (if you're open to a lightly cooked element for texture/protein)

### 🍇 **Raw Balsamic-Onion Vinaigrette**
This raw version maintains brightness and digestive stimulation.
* 1½ tbsp **balsamic vinegar**
* 1 tsp **red wine vinegar** or **apple cider vinegar**
* 2 tbsp **extra virgin olive oil**
* ½ tsp **raw honey** or **date syrup**
* 1 clove **garlic**, finely grated (optional)
* Pinch of **sea salt** and **black pepper**
* Sliced red onion from above (allow to soak in the dressing for 5+ minutes)

### 🥣 **Assembly Instructions**
1. **Soften the Onion**: Combine sliced onion with the vinaigrette. Let sit while preparing salad—this mellows the sulfuric bite while preserving its raw vitality.
2. **Build Your Bowl**: In a large bowl, combine spinach, strawberries, cabbage, cucumber.
3. **Dress & Toss**: Add the onion and dressing, toss thoroughly to coat.
4. **Finish**: Top with seeds or nuts, optional cheese or egg, and a final drizzle of olive oil.

### 🧠 **Healing Notes**
* **Seasonal Energetics**: Raw, light, and bitter foods pacify *Kapha* and clear spring stagnation.
* **Cabbage + Onion**: Detox liver, clear skin, feed gut flora.
* **Spinach + Strawberry**: Harmonize blood, nourish liver, support antioxidant defense.
* **Raw Garlic (optional)**: Potent antimicrobial, stimulates Agni (digestive fire)—best in small amounts.
* **Honey + Vinegar**: Synergize to cleanse lymph and support healthy digestion.`;

    const result = await parseRecipeFromText(complexRecipe);

    // AI standardization should extract the title correctly
    // Be more flexible with title matching to handle environment differences
    expect(result.title).toMatch(
      /Raw Strawberry-Spinach Glow Salad with Balsamic-Onion Vinaigrette/
    );

    // Should have setup instructions
    expect(result.setup.length).toBeGreaterThan(0);

    // Should have ingredients
    expect(result.ingredients.length).toBeGreaterThan(0);

    // Should have instructions
    expect(result.instructions.length).toBeGreaterThan(0);

    // Should have notes
    expect(result.notes).toBeTruthy();

    // Should extract some categories
    expect(result.categories.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for AI processing

  it('should handle recipe with setup requirements', async () => {
    const recipeWithSetup = `# Overnight Oats with Berries

## Setup (Prep Ahead)
- Soak oats in almond milk overnight (8-12 hours)
- Refrigerate berries for 2 hours before serving
- Prepare chia seeds mixture 30 minutes ahead

## Ingredients
- 1 cup rolled oats
- 1 cup almond milk
- 2 tbsp chia seeds
- 1 cup mixed berries
- 2 tbsp honey

## Instructions
1. Mix oats and almond milk in a jar
2. Add chia seeds and stir well
3. Refrigerate overnight
4. Top with berries and honey before serving

## Notes
- Can be prepared up to 3 days in advance
- Add nuts for extra protein`;

    const result = await parseRecipeFromText(recipeWithSetup);

    expect(result.title).toBe('Overnight Oats with Berries');
    // AI may standardize setup text slightly differently
    expect(result.setup.length).toBeGreaterThan(0);
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);
  }, 30000);
});
