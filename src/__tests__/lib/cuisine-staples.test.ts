import { describe, it, expect } from 'vitest';
import { CuisineStaplesManager } from '@/lib/shopping-cart/cuisine-staples/manager';
import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';

describe('CuisineStaplesManager', () => {
  it('should get available cuisines', () => {
    const manager = new CuisineStaplesManager();
    const cuisines = manager.getAvailableCuisines();

    expect(cuisines).toContain('mexican');
    expect(cuisines).toContain('italian');
    expect(cuisines).toContain('asian');
    expect(cuisines).toContain('chinese');
    expect(cuisines).toContain('indian');
    expect(cuisines).toContain('thai');
    expect(cuisines).toContain('korean');
    expect(cuisines).toContain('japanese');
    expect(cuisines).toContain('vietnamese');
    expect(cuisines).toContain('greek');
    expect(cuisines).toContain('french');
    expect(cuisines).toContain('spanish');
    expect(cuisines).toContain('lebanese');
    expect(cuisines).toContain('turkish');
    expect(cuisines).toContain('ethiopian');
    expect(cuisines).toContain('german');
    expect(cuisines).toContain('brazilian');
    expect(cuisines).toContain('peruvian');
    expect(cuisines).toContain('moroccan');
    expect(cuisines).toContain('filipino');
    expect(cuisines).toContain('jamaican');
    expect(cuisines).toContain('russian');
    expect(cuisines).toContain('polish');
    expect(cuisines).toContain('hungarian');
    expect(cuisines).toContain('nigerian');
    expect(cuisines).toContain('south_african');
    expect(cuisines).toContain('egyptian');
    expect(cuisines).toContain('swedish');
    expect(cuisines).toContain('dutch');
    expect(cuisines).toContain('austrian');
    expect(cuisines).toContain('indonesian');
    expect(cuisines).toContain('malaysian');
    expect(cuisines).toContain('singaporean');
    expect(cuisines).toContain('portuguese');
    expect(cuisines).toContain('belgian');
    expect(cuisines).toContain('swiss');
    expect(cuisines).toContain('canadian');
    expect(cuisines).toContain('argentinian');
    expect(cuisines).toContain('chilean');
    expect(cuisines).toContain('iranian');
    expect(cuisines).toContain('israeli');
    expect(cuisines).toContain('syrian');
    expect(cuisines).toContain('cuban');
    expect(cuisines).toContain('puerto_rican');
    expect(cuisines).toContain('dominican');
    expect(cuisines).toContain('norwegian');
    expect(cuisines).toContain('danish');
    expect(cuisines).toContain('finnish');
    expect(cuisines).toContain('nigerian');
    expect(cuisines).toContain('south_african');
    expect(cuisines).toContain('egyptian');
    expect(cuisines).toContain('korean');
    expect(cuisines).toContain('japanese');
    expect(cuisines).toContain('vietnamese');
    expect(cuisines).toContain('greek');
    expect(cuisines).toContain('french');
    expect(cuisines).toContain('spanish');
    expect(cuisines).toContain('tex_mex');
    expect(cuisines).toContain('california');
    expect(cuisines).toContain('modern_american');
    expect(cuisines).toContain('southern');
    expect(cuisines).toContain('new_england');
    expect(cuisines).toContain('pacific_northwest');
    expect(cuisines).toContain('korean_mexican');
    expect(cuisines).toContain('indian_chinese');
    expect(cuisines).toContain('mediterranean_american');
    expect(cuisines).toContain('plant_based');
    expect(cuisines).toContain('vegan');
    expect(cuisines).toContain('vegetarian');
    expect(cuisines).toContain('mediterranean_diet');
    expect(cuisines).toContain('nordic_diet');
    expect(cuisines).toContain('plant_based_health');
    expect(cuisines).toContain('kosher');
    expect(cuisines).toContain('halal');
    expect(cuisines).toContain('vegetarian_adaptations');
    expect(cuisines).toContain('keto');
    expect(cuisines).toContain('paleo');
    expect(cuisines).toContain('raw_food');
    expect(cuisines).toContain('grilled');
    expect(cuisines).toContain('slow_cooker');
    expect(cuisines).toContain('one_pot');
    expect(cuisines).toContain('intermittent_fasting');
    expect(cuisines).toContain('carnivore');
    expect(cuisines).toContain('mediterranean_keto');
    expect(cuisines).toContain('aip');
    expect(cuisines).toContain('low_fodmap');
    expect(cuisines).toContain('anti_inflammatory');
    expect(cuisines).toContain('whole30');
    expect(cuisines).toContain('dash_diet');
    expect(cuisines).toContain('mind_diet');
    expect(cuisines.length).toBeGreaterThanOrEqual(100);
  });

  it('should get cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mexicanStaples = manager.getCuisineStaples('mexican');

    expect(mexicanStaples).toHaveLength(11); // Based on our data
    expect(mexicanStaples[0].ingredient).toBe('cumin');
    expect(mexicanStaples[0].priority).toBe('essential');
    expect(mexicanStaples[0].category).toBe('flavor_builders');
  });

  it('should get Chinese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const chineseStaples = manager.getCuisineStaples('chinese');

    expect(chineseStaples).toHaveLength(15);
    expect(chineseStaples[0].ingredient).toBe('soy sauce');
    expect(chineseStaples[0].priority).toBe('essential');
    expect(chineseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Indian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const indianStaples = manager.getCuisineStaples('indian');

    expect(indianStaples).toHaveLength(17);
    expect(indianStaples[0].ingredient).toBe('turmeric');
    expect(indianStaples[0].priority).toBe('essential');
    expect(indianStaples[0].category).toBe('flavor_builders');
  });

  it('should get Thai cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const thaiStaples = manager.getCuisineStaples('thai');

    expect(thaiStaples).toHaveLength(17);
    expect(thaiStaples[0].ingredient).toBe('fish sauce');
    expect(thaiStaples[0].priority).toBe('essential');
    expect(thaiStaples[0].category).toBe('flavor_builders');
  });

  it('should get Korean cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const koreanStaples = manager.getCuisineStaples('korean');

    expect(koreanStaples.length).toBeGreaterThanOrEqual(7);

    expect(koreanStaples.length).toBeLessThanOrEqual(20);
    expect(koreanStaples[0].ingredient).toBe('gochujang');
    expect(koreanStaples[0].priority).toBe('essential');
    expect(koreanStaples[0].category).toBe('flavor_builders');
  });

  it('should get Japanese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const japaneseStaples = manager.getCuisineStaples('japanese');

    expect(japaneseStaples).toHaveLength(17);
    expect(japaneseStaples[0].ingredient).toBe('soy sauce');
    expect(japaneseStaples[0].priority).toBe('essential');
    expect(japaneseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Vietnamese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const vietnameseStaples = manager.getCuisineStaples('vietnamese');

    expect(vietnameseStaples).toHaveLength(17);
    expect(vietnameseStaples[0].ingredient).toBe('fish sauce');
    expect(vietnameseStaples[0].priority).toBe('essential');
    expect(vietnameseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Greek cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const greekStaples = manager.getCuisineStaples('greek');

    expect(greekStaples.length).toBeGreaterThanOrEqual(7);

    expect(greekStaples.length).toBeLessThanOrEqual(20);
    expect(greekStaples[0].ingredient).toBe('olive oil');
    expect(greekStaples[0].priority).toBe('essential');
    expect(greekStaples[0].category).toBe('flavor_builders');
  });

  it('should get French cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const frenchStaples = manager.getCuisineStaples('french');

    expect(frenchStaples.length).toBeGreaterThanOrEqual(7);

    expect(frenchStaples.length).toBeLessThanOrEqual(20);
    expect(frenchStaples[0].ingredient).toBe('butter');
    expect(frenchStaples[0].priority).toBe('essential');
    expect(frenchStaples[0].category).toBe('dairy_cold');
  });

  it('should get Spanish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const spanishStaples = manager.getCuisineStaples('spanish');

    expect(spanishStaples.length).toBeGreaterThanOrEqual(7);

    expect(spanishStaples.length).toBeLessThanOrEqual(20);
    expect(spanishStaples[0].ingredient).toBe('olive oil');
    expect(spanishStaples[0].priority).toBe('essential');
    expect(spanishStaples[0].category).toBe('flavor_builders');
  });

  it('should get Lebanese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const lebaneseStaples = manager.getCuisineStaples('lebanese');

    expect(lebaneseStaples.length).toBeGreaterThanOrEqual(7);

    expect(lebaneseStaples.length).toBeLessThanOrEqual(20);
    expect(lebaneseStaples[0].ingredient).toBe('olive oil');
    expect(lebaneseStaples[0].priority).toBe('essential');
    expect(lebaneseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Turkish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const turkishStaples = manager.getCuisineStaples('turkish');

    expect(turkishStaples.length).toBeGreaterThanOrEqual(7);

    expect(turkishStaples.length).toBeLessThanOrEqual(20);
    expect(turkishStaples[0].ingredient).toBe('olive oil');
    expect(turkishStaples[0].priority).toBe('essential');
    expect(turkishStaples[0].category).toBe('flavor_builders');
  });

  it('should get Ethiopian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const ethiopianStaples = manager.getCuisineStaples('ethiopian');

    expect(ethiopianStaples.length).toBeGreaterThanOrEqual(7);

    expect(ethiopianStaples.length).toBeLessThanOrEqual(20);
    expect(ethiopianStaples[0].ingredient).toBe('berbere');
    expect(ethiopianStaples[0].priority).toBe('essential');
    expect(ethiopianStaples[0].category).toBe('flavor_builders');
  });

  it('should get German cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const germanStaples = manager.getCuisineStaples('german');

    expect(germanStaples.length).toBeGreaterThanOrEqual(7);

    expect(germanStaples.length).toBeLessThanOrEqual(20);
    expect(germanStaples[0].ingredient).toBe('sausages');
    expect(germanStaples[0].priority).toBe('essential');
    expect(germanStaples[0].category).toBe('proteins');
  });

  it('should get Brazilian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const brazilianStaples = manager.getCuisineStaples('brazilian');

    expect(brazilianStaples.length).toBeGreaterThanOrEqual(7);

    expect(brazilianStaples.length).toBeLessThanOrEqual(20);
    expect(brazilianStaples[0].ingredient).toBe('rice');
    expect(brazilianStaples[0].priority).toBe('essential');
    expect(brazilianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Peruvian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const peruvianStaples = manager.getCuisineStaples('peruvian');

    expect(peruvianStaples.length).toBeGreaterThanOrEqual(7);

    expect(peruvianStaples.length).toBeLessThanOrEqual(20);
    expect(peruvianStaples[0].ingredient).toBe('lime');
    expect(peruvianStaples[0].priority).toBe('essential');
    expect(peruvianStaples[0].category).toBe('fresh_produce');
  });

  it('should get Moroccan cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const moroccanStaples = manager.getCuisineStaples('moroccan');

    expect(moroccanStaples.length).toBeGreaterThanOrEqual(7);

    expect(moroccanStaples.length).toBeLessThanOrEqual(20);
    expect(moroccanStaples[0].ingredient).toBe('couscous');
    expect(moroccanStaples[0].priority).toBe('essential');
    expect(moroccanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Filipino cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const filipinoStaples = manager.getCuisineStaples('filipino');

    expect(filipinoStaples.length).toBeGreaterThanOrEqual(7);

    expect(filipinoStaples.length).toBeLessThanOrEqual(20);
    expect(filipinoStaples[0].ingredient).toBe('rice');
    expect(filipinoStaples[0].priority).toBe('essential');
    expect(filipinoStaples[0].category).toBe('pantry_staples');
  });

  it('should get Jamaican cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const jamaicanStaples = manager.getCuisineStaples('jamaican');

    expect(jamaicanStaples.length).toBeGreaterThanOrEqual(7);

    expect(jamaicanStaples.length).toBeLessThanOrEqual(20);
    expect(jamaicanStaples[0].ingredient).toBe('scotch bonnet peppers');
    expect(jamaicanStaples[0].priority).toBe('essential');
    expect(jamaicanStaples[0].category).toBe('fresh_produce');
  });

  it('should get Russian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const russianStaples = manager.getCuisineStaples('russian');

    expect(russianStaples.length).toBeGreaterThanOrEqual(7);

    expect(russianStaples.length).toBeLessThanOrEqual(20);
    expect(russianStaples[0].ingredient).toBe('beets');
    expect(russianStaples[0].priority).toBe('essential');
    expect(russianStaples[0].category).toBe('fresh_produce');
  });

  it('should get Polish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const polishStaples = manager.getCuisineStaples('polish');

    expect(polishStaples.length).toBeGreaterThanOrEqual(7);

    expect(polishStaples.length).toBeLessThanOrEqual(20);
    expect(polishStaples[0].ingredient).toBe('kielbasa');
    expect(polishStaples[0].priority).toBe('essential');
    expect(polishStaples[0].category).toBe('proteins');
  });

  it('should get Hungarian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const hungarianStaples = manager.getCuisineStaples('hungarian');

    expect(hungarianStaples.length).toBeGreaterThanOrEqual(7);

    expect(hungarianStaples.length).toBeLessThanOrEqual(20);
    expect(hungarianStaples[0].ingredient).toBe('paprika');
    expect(hungarianStaples[0].priority).toBe('essential');
    expect(hungarianStaples[0].category).toBe('flavor_builders');
  });

  it('should get Nigerian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const nigerianStaples = manager.getCuisineStaples('nigerian');

    expect(nigerianStaples.length).toBeGreaterThanOrEqual(7);

    expect(nigerianStaples.length).toBeLessThanOrEqual(20);
    expect(nigerianStaples[0].ingredient).toBe('rice');
    expect(nigerianStaples[0].priority).toBe('essential');
    expect(nigerianStaples[0].category).toBe('pantry_staples');
  });

  it('should get South African cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const southAfricanStaples = manager.getCuisineStaples('south_african');

    expect(southAfricanStaples.length).toBeGreaterThanOrEqual(7);

    expect(southAfricanStaples.length).toBeLessThanOrEqual(20);
    expect(southAfricanStaples[0].ingredient).toBe('meat');
    expect(southAfricanStaples[0].priority).toBe('essential');
    expect(southAfricanStaples[0].category).toBe('proteins');
  });

  it('should get Egyptian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const egyptianStaples = manager.getCuisineStaples('egyptian');

    expect(egyptianStaples.length).toBeGreaterThanOrEqual(7);

    expect(egyptianStaples.length).toBeLessThanOrEqual(20);
    expect(egyptianStaples[0].ingredient).toBe('rice');
    expect(egyptianStaples[0].priority).toBe('essential');
    expect(egyptianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Swedish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const swedishStaples = manager.getCuisineStaples('swedish');

    expect(swedishStaples.length).toBeGreaterThanOrEqual(7);

    expect(swedishStaples.length).toBeLessThanOrEqual(20);
    expect(swedishStaples[0].ingredient).toBe('ground beef');
    expect(swedishStaples[0].priority).toBe('essential');
    expect(swedishStaples[0].category).toBe('proteins');
  });

  it('should get Dutch cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const dutchStaples = manager.getCuisineStaples('dutch');

    expect(dutchStaples.length).toBeGreaterThanOrEqual(7);

    expect(dutchStaples.length).toBeLessThanOrEqual(20);
    expect(dutchStaples[0].ingredient).toBe('potatoes');
    expect(dutchStaples[0].priority).toBe('essential');
    expect(dutchStaples[0].category).toBe('fresh_produce');
  });

  it('should get Austrian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const austrianStaples = manager.getCuisineStaples('austrian');

    expect(austrianStaples.length).toBeGreaterThanOrEqual(7);

    expect(austrianStaples.length).toBeLessThanOrEqual(20);
    expect(austrianStaples[0].ingredient).toBe('veal');
    expect(austrianStaples[0].priority).toBe('essential');
    expect(austrianStaples[0].category).toBe('proteins');
  });

  it('should get Indonesian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const indonesianStaples = manager.getCuisineStaples('indonesian');

    expect(indonesianStaples.length).toBeGreaterThanOrEqual(7);

    expect(indonesianStaples.length).toBeLessThanOrEqual(20);
    expect(indonesianStaples[0].ingredient).toBe('rice');
    expect(indonesianStaples[0].priority).toBe('essential');
    expect(indonesianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Malaysian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const malaysianStaples = manager.getCuisineStaples('malaysian');

    expect(malaysianStaples.length).toBeGreaterThanOrEqual(7);

    expect(malaysianStaples.length).toBeLessThanOrEqual(20);
    expect(malaysianStaples[0].ingredient).toBe('rice');
    expect(malaysianStaples[0].priority).toBe('essential');
    expect(malaysianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Singaporean cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const singaporeanStaples = manager.getCuisineStaples('singaporean');

    expect(singaporeanStaples.length).toBeGreaterThanOrEqual(7);

    expect(singaporeanStaples.length).toBeLessThanOrEqual(20);
    expect(singaporeanStaples[0].ingredient).toBe('rice');
    expect(singaporeanStaples[0].priority).toBe('essential');
    expect(singaporeanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Portuguese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const portugueseStaples = manager.getCuisineStaples('portuguese');

    expect(portugueseStaples.length).toBeGreaterThanOrEqual(7);

    expect(portugueseStaples.length).toBeLessThanOrEqual(20);
    expect(portugueseStaples[0].ingredient).toBe('cod');
    expect(portugueseStaples[0].priority).toBe('essential');
    expect(portugueseStaples[0].category).toBe('proteins');
  });

  it('should get Belgian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const belgianStaples = manager.getCuisineStaples('belgian');

    expect(belgianStaples.length).toBeGreaterThanOrEqual(7);

    expect(belgianStaples.length).toBeLessThanOrEqual(20);
    expect(belgianStaples[0].ingredient).toBe('mussels');
    expect(belgianStaples[0].priority).toBe('essential');
    expect(belgianStaples[0].category).toBe('proteins');
  });

  it('should get Swiss cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const swissStaples = manager.getCuisineStaples('swiss');

    expect(swissStaples.length).toBeGreaterThanOrEqual(7);

    expect(swissStaples.length).toBeLessThanOrEqual(20);
    expect(swissStaples[0].ingredient).toBe('cheese');
    expect(swissStaples[0].priority).toBe('essential');
    expect(swissStaples[0].category).toBe('dairy_cold');
  });

  it('should get Canadian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const canadianStaples = manager.getCuisineStaples('canadian');

    expect(canadianStaples.length).toBeGreaterThanOrEqual(7);

    expect(canadianStaples.length).toBeLessThanOrEqual(20);
    expect(canadianStaples[0].ingredient).toBe('potatoes');
    expect(canadianStaples[0].priority).toBe('essential');
    expect(canadianStaples[0].category).toBe('fresh_produce');
  });

  it('should get Argentinian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const argentinianStaples = manager.getCuisineStaples('argentinian');

    expect(argentinianStaples.length).toBeGreaterThanOrEqual(7);

    expect(argentinianStaples.length).toBeLessThanOrEqual(20);
    expect(argentinianStaples[0].ingredient).toBe('beef');
    expect(argentinianStaples[0].priority).toBe('essential');
    expect(argentinianStaples[0].category).toBe('proteins');
  });

  it('should get Chilean cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const chileanStaples = manager.getCuisineStaples('chilean');

    expect(chileanStaples.length).toBeGreaterThanOrEqual(7);

    expect(chileanStaples.length).toBeLessThanOrEqual(20);
    expect(chileanStaples[0].ingredient).toBe('fish');
    expect(chileanStaples[0].priority).toBe('essential');
    expect(chileanStaples[0].category).toBe('proteins');
  });

  it('should get Iranian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const iranianStaples = manager.getCuisineStaples('iranian');

    expect(iranianStaples.length).toBeGreaterThanOrEqual(7);

    expect(iranianStaples.length).toBeLessThanOrEqual(20);
    expect(iranianStaples[0].ingredient).toBe('rice');
    expect(iranianStaples[0].priority).toBe('essential');
    expect(iranianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Israeli cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const israeliStaples = manager.getCuisineStaples('israeli');

    expect(israeliStaples.length).toBeGreaterThanOrEqual(7);

    expect(israeliStaples.length).toBeLessThanOrEqual(20);
    expect(israeliStaples[0].ingredient).toBe('chickpeas');
    expect(israeliStaples[0].priority).toBe('essential');
    expect(israeliStaples[0].category).toBe('pantry_staples');
  });

  it('should get Syrian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const syrianStaples = manager.getCuisineStaples('syrian');

    expect(syrianStaples.length).toBeGreaterThanOrEqual(7);

    expect(syrianStaples.length).toBeLessThanOrEqual(20);
    expect(syrianStaples[0].ingredient).toBe('rice');
    expect(syrianStaples[0].priority).toBe('essential');
    expect(syrianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Cuban cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const cubanStaples = manager.getCuisineStaples('cuban');

    expect(cubanStaples.length).toBeGreaterThanOrEqual(7);

    expect(cubanStaples.length).toBeLessThanOrEqual(20);
    expect(cubanStaples[0].ingredient).toBe('rice');
    expect(cubanStaples[0].priority).toBe('essential');
    expect(cubanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Puerto Rican cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const puertoRicanStaples = manager.getCuisineStaples('puerto_rican');

    expect(puertoRicanStaples.length).toBeGreaterThanOrEqual(7);

    expect(puertoRicanStaples.length).toBeLessThanOrEqual(20);
    expect(puertoRicanStaples[0].ingredient).toBe('rice');
    expect(puertoRicanStaples[0].priority).toBe('essential');
    expect(puertoRicanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Dominican cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const dominicanStaples = manager.getCuisineStaples('dominican');

    expect(dominicanStaples.length).toBeGreaterThanOrEqual(7);

    expect(dominicanStaples.length).toBeLessThanOrEqual(20);
    expect(dominicanStaples[0].ingredient).toBe('rice');
    expect(dominicanStaples[0].priority).toBe('essential');
    expect(dominicanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Norwegian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const norwegianStaples = manager.getCuisineStaples('norwegian');

    expect(norwegianStaples.length).toBeGreaterThanOrEqual(7);

    expect(norwegianStaples.length).toBeLessThanOrEqual(20);
    expect(norwegianStaples[0].ingredient).toBe('salmon');
    expect(norwegianStaples[0].priority).toBe('essential');
    expect(norwegianStaples[0].category).toBe('proteins');
  });

  it('should get Danish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const danishStaples = manager.getCuisineStaples('danish');

    expect(danishStaples.length).toBeGreaterThanOrEqual(7);

    expect(danishStaples.length).toBeLessThanOrEqual(20);
    expect(danishStaples[0].ingredient).toBe('bread');
    expect(danishStaples[0].priority).toBe('essential');
    expect(danishStaples[0].category).toBe('pantry_staples');
  });

  it('should get Finnish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const finnishStaples = manager.getCuisineStaples('finnish');

    expect(finnishStaples.length).toBeGreaterThanOrEqual(7);

    expect(finnishStaples.length).toBeLessThanOrEqual(20);
    expect(finnishStaples[0].ingredient).toBe('rye bread');
    expect(finnishStaples[0].priority).toBe('essential');
    expect(finnishStaples[0].category).toBe('pantry_staples');
  });

  it('should get Nigerian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const nigerianStaples = manager.getCuisineStaples('nigerian');

    expect(nigerianStaples.length).toBeGreaterThanOrEqual(7);

    expect(nigerianStaples.length).toBeLessThanOrEqual(20);
    expect(nigerianStaples[0].ingredient).toBe('rice');
    expect(nigerianStaples[0].priority).toBe('essential');
    expect(nigerianStaples[0].category).toBe('pantry_staples');
  });

  it('should get South African cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const southAfricanStaples = manager.getCuisineStaples('south_african');

    expect(southAfricanStaples.length).toBeGreaterThanOrEqual(7);

    expect(southAfricanStaples.length).toBeLessThanOrEqual(20);
    expect(southAfricanStaples[0].ingredient).toBe('meat');
    expect(southAfricanStaples[0].priority).toBe('essential');
    expect(southAfricanStaples[0].category).toBe('proteins');
  });

  it('should get Egyptian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const egyptianStaples = manager.getCuisineStaples('egyptian');

    expect(egyptianStaples.length).toBeGreaterThanOrEqual(7);

    expect(egyptianStaples.length).toBeLessThanOrEqual(20);
    expect(egyptianStaples[0].ingredient).toBe('rice');
    expect(egyptianStaples[0].priority).toBe('essential');
    expect(egyptianStaples[0].category).toBe('pantry_staples');
  });

  it('should get Korean cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const koreanStaples = manager.getCuisineStaples('korean');

    expect(koreanStaples.length).toBeGreaterThanOrEqual(7);

    expect(koreanStaples.length).toBeLessThanOrEqual(20);
    expect(koreanStaples[0].ingredient).toBe('gochujang');
    expect(koreanStaples[0].priority).toBe('essential');
    expect(koreanStaples[0].category).toBe('flavor_builders');
  });

  it('should get Japanese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const japaneseStaples = manager.getCuisineStaples('japanese');

    expect(japaneseStaples).toHaveLength(17);
    expect(japaneseStaples[0].ingredient).toBe('soy sauce');
    expect(japaneseStaples[0].priority).toBe('essential');
    expect(japaneseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Vietnamese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const vietnameseStaples = manager.getCuisineStaples('vietnamese');

    expect(vietnameseStaples).toHaveLength(17);
    expect(vietnameseStaples[0].ingredient).toBe('fish sauce');
    expect(vietnameseStaples[0].priority).toBe('essential');
    expect(vietnameseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Greek cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const greekStaples = manager.getCuisineStaples('greek');

    expect(greekStaples.length).toBeGreaterThanOrEqual(7);

    expect(greekStaples.length).toBeLessThanOrEqual(20);
    expect(greekStaples[0].ingredient).toBe('olive oil');
    expect(greekStaples[0].priority).toBe('essential');
    expect(greekStaples[0].category).toBe('flavor_builders');
  });

  it('should get French cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const frenchStaples = manager.getCuisineStaples('french');

    expect(frenchStaples.length).toBeGreaterThanOrEqual(7);

    expect(frenchStaples.length).toBeLessThanOrEqual(20);
    expect(frenchStaples[0].ingredient).toBe('butter');
    expect(frenchStaples[0].priority).toBe('essential');
    expect(frenchStaples[0].category).toBe('dairy_cold');
  });

  it('should get Spanish cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const spanishStaples = manager.getCuisineStaples('spanish');

    expect(spanishStaples.length).toBeGreaterThanOrEqual(7);

    expect(spanishStaples.length).toBeLessThanOrEqual(20);
    expect(spanishStaples[0].ingredient).toBe('olive oil');
    expect(spanishStaples[0].priority).toBe('essential');
    expect(spanishStaples[0].category).toBe('flavor_builders');
  });

  it('should get Tex-Mex cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const texMexStaples = manager.getCuisineStaples('tex_mex');

    expect(texMexStaples.length).toBeGreaterThanOrEqual(7);

    expect(texMexStaples.length).toBeLessThanOrEqual(20);
    expect(texMexStaples[0].ingredient).toBe('cumin');
    expect(texMexStaples[0].priority).toBe('essential');
    expect(texMexStaples[0].category).toBe('flavor_builders');
  });

  it('should get California cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const californiaStaples = manager.getCuisineStaples('california');

    expect(californiaStaples.length).toBeGreaterThanOrEqual(7);

    expect(californiaStaples.length).toBeLessThanOrEqual(20);
    expect(californiaStaples[0].ingredient).toBe('avocado');
    expect(californiaStaples[0].priority).toBe('essential');
    expect(californiaStaples[0].category).toBe('fresh_produce');
  });

  it('should get Modern American cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const modernAmericanStaples = manager.getCuisineStaples('modern_american');

    expect(modernAmericanStaples.length).toBeGreaterThanOrEqual(7);

    expect(modernAmericanStaples.length).toBeLessThanOrEqual(20);
    expect(modernAmericanStaples[0].ingredient).toBe('olive oil');
    expect(modernAmericanStaples[0].priority).toBe('essential');
    expect(modernAmericanStaples[0].category).toBe('pantry_staples');
  });

  it('should get Southern cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const southernStaples = manager.getCuisineStaples('southern');

    expect(southernStaples.length).toBeGreaterThanOrEqual(7);

    expect(southernStaples.length).toBeLessThanOrEqual(20);
    expect(southernStaples[0].ingredient).toBe('cornmeal');
    expect(southernStaples[0].priority).toBe('essential');
    expect(southernStaples[0].category).toBe('pantry_staples');
  });

  it('should get New England cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const newEnglandStaples = manager.getCuisineStaples('new_england');

    expect(newEnglandStaples.length).toBeGreaterThanOrEqual(7);

    expect(newEnglandStaples.length).toBeLessThanOrEqual(20);
    expect(newEnglandStaples[0].ingredient).toBe('clam');
    expect(newEnglandStaples[0].priority).toBe('recommended');
    expect(newEnglandStaples[0].category).toBe('proteins');
  });

  it('should get Pacific Northwest cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const pacificNorthwestStaples =
      manager.getCuisineStaples('pacific_northwest');

    expect(pacificNorthwestStaples.length).toBeGreaterThanOrEqual(7);

    expect(pacificNorthwestStaples.length).toBeLessThanOrEqual(20);
    expect(pacificNorthwestStaples[0].ingredient).toBe('salmon');
    expect(pacificNorthwestStaples[0].priority).toBe('essential');
    expect(pacificNorthwestStaples[0].category).toBe('proteins');
  });

  it('should get Korean-Mexican cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const koreanMexicanStaples = manager.getCuisineStaples('korean_mexican');

    expect(koreanMexicanStaples.length).toBeGreaterThanOrEqual(7);

    expect(koreanMexicanStaples.length).toBeLessThanOrEqual(20);
    expect(koreanMexicanStaples[0].ingredient).toBe('gochujang');
    expect(koreanMexicanStaples[0].priority).toBe('essential');
    expect(koreanMexicanStaples[0].category).toBe('flavor_builders');
  });

  it('should get Indian-Chinese cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const indianChineseStaples = manager.getCuisineStaples('indian_chinese');

    expect(indianChineseStaples.length).toBeGreaterThanOrEqual(7);

    expect(indianChineseStaples.length).toBeLessThanOrEqual(20);
    expect(indianChineseStaples[0].ingredient).toBe('soy sauce');
    expect(indianChineseStaples[0].priority).toBe('essential');
    expect(indianChineseStaples[0].category).toBe('flavor_builders');
  });

  it('should get Mediterranean-American cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mediterraneanAmericanStaples = manager.getCuisineStaples(
      'mediterranean_american'
    );

    expect(mediterraneanAmericanStaples.length).toBeGreaterThanOrEqual(7);

    expect(mediterraneanAmericanStaples.length).toBeLessThanOrEqual(20);
    expect(mediterraneanAmericanStaples[0].ingredient).toBe('olive oil');
    expect(mediterraneanAmericanStaples[0].priority).toBe('essential');
    expect(mediterraneanAmericanStaples[0].category).toBe('flavor_builders');
  });

  it('should get Plant-Based cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const plantBasedStaples = manager.getCuisineStaples('plant_based');

    expect(plantBasedStaples.length).toBeGreaterThanOrEqual(7);

    expect(plantBasedStaples.length).toBeLessThanOrEqual(20);
    expect(plantBasedStaples[0].ingredient).toBe('legumes');
    expect(plantBasedStaples[0].priority).toBe('essential');
    expect(plantBasedStaples[0].category).toBe('pantry_staples');
  });

  it('should get Vegan cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const veganStaples = manager.getCuisineStaples('vegan');

    expect(veganStaples.length).toBeGreaterThanOrEqual(7);

    expect(veganStaples.length).toBeLessThanOrEqual(20);
    expect(veganStaples[0].ingredient).toBe('tofu');
    expect(veganStaples[0].priority).toBe('essential');
    expect(veganStaples[0].category).toBe('proteins');
  });

  it('should get Vegetarian cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const vegetarianStaples = manager.getCuisineStaples('vegetarian');

    expect(vegetarianStaples.length).toBeGreaterThanOrEqual(7);

    expect(vegetarianStaples.length).toBeLessThanOrEqual(20);
    expect(vegetarianStaples[0].ingredient).toBe('eggs');
    expect(vegetarianStaples[0].priority).toBe('essential');
    expect(vegetarianStaples[0].category).toBe('proteins');
  });

  it('should get Mediterranean Diet cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mediterraneanDietStaples =
      manager.getCuisineStaples('mediterranean_diet');

    expect(mediterraneanDietStaples.length).toBeGreaterThanOrEqual(7);

    expect(mediterraneanDietStaples.length).toBeLessThanOrEqual(20);
    expect(mediterraneanDietStaples[0].ingredient).toBe('olive_oil');
    expect(mediterraneanDietStaples[0].priority).toBe('essential');
    expect(mediterraneanDietStaples[0].category).toBe('flavor_builders');
  });

  it('should get Nordic Diet cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const nordicDietStaples = manager.getCuisineStaples('nordic_diet');

    expect(nordicDietStaples.length).toBeGreaterThanOrEqual(7);

    expect(nordicDietStaples.length).toBeLessThanOrEqual(20);
    expect(nordicDietStaples[0].ingredient).toBe('fish');
    expect(nordicDietStaples[0].priority).toBe('essential');
    expect(nordicDietStaples[0].category).toBe('proteins');
  });

  it('should get Plant-Based Health cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const plantBasedHealthStaples =
      manager.getCuisineStaples('plant_based_health');

    expect(plantBasedHealthStaples.length).toBeGreaterThanOrEqual(7);

    expect(plantBasedHealthStaples.length).toBeLessThanOrEqual(20);
    expect(plantBasedHealthStaples[0].ingredient).toBe('leafy_greens');
    expect(plantBasedHealthStaples[0].priority).toBe('essential');
    expect(plantBasedHealthStaples[0].category).toBe('fresh_produce');
  });

  it('should get Kosher cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const kosherStaples = manager.getCuisineStaples('kosher');

    expect(kosherStaples.length).toBeGreaterThanOrEqual(7);

    expect(kosherStaples.length).toBeLessThanOrEqual(20);
    expect(kosherStaples[0].ingredient).toBe('kosher_salt');
    expect(kosherStaples[0].priority).toBe('essential');
    expect(kosherStaples[0].category).toBe('flavor_builders');
  });

  it('should get Halal cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const halalStaples = manager.getCuisineStaples('halal');

    expect(halalStaples.length).toBeGreaterThanOrEqual(7);

    expect(halalStaples.length).toBeLessThanOrEqual(20);
    expect(halalStaples[0].ingredient).toBe('lamb');
    expect(halalStaples[0].priority).toBe('essential');
    expect(halalStaples[0].category).toBe('proteins');
  });

  it('should get Vegetarian Adaptations cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const vegetarianAdaptationsStaples = manager.getCuisineStaples(
      'vegetarian_adaptations'
    );

    expect(vegetarianAdaptationsStaples.length).toBeGreaterThanOrEqual(7);

    expect(vegetarianAdaptationsStaples.length).toBeLessThanOrEqual(20);
    expect(vegetarianAdaptationsStaples[0].ingredient).toBe('tofu');
    expect(vegetarianAdaptationsStaples[0].priority).toBe('essential');
    expect(vegetarianAdaptationsStaples[0].category).toBe('proteins');
  });

  it('should get Keto cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const ketoStaples = manager.getCuisineStaples('keto');

    expect(ketoStaples.length).toBeGreaterThanOrEqual(7);

    expect(ketoStaples.length).toBeLessThanOrEqual(20);
    expect(ketoStaples[0].ingredient).toBe('coconut_oil');
    expect(ketoStaples[0].priority).toBe('essential');
    expect(ketoStaples[0].category).toBe('flavor_builders');
  });

  it('should get Paleo cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const paleoStaples = manager.getCuisineStaples('paleo');

    expect(paleoStaples.length).toBeGreaterThanOrEqual(7);

    expect(paleoStaples.length).toBeLessThanOrEqual(20);
    expect(paleoStaples[0].ingredient).toBe('coconut_oil');
    expect(paleoStaples[0].priority).toBe('essential');
    expect(paleoStaples[0].category).toBe('flavor_builders');
  });

  it('should get Raw Food cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const rawFoodStaples = manager.getCuisineStaples('raw_food');

    expect(rawFoodStaples.length).toBeGreaterThanOrEqual(7);

    expect(rawFoodStaples.length).toBeLessThanOrEqual(20);
    expect(rawFoodStaples[0].ingredient).toBe('fruits');
    expect(rawFoodStaples[0].priority).toBe('essential');
    expect(rawFoodStaples[0].category).toBe('fresh_produce');
  });

  it('should get Grilled cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const grilledStaples = manager.getCuisineStaples('grilled');

    expect(grilledStaples.length).toBeGreaterThanOrEqual(7);

    expect(grilledStaples.length).toBeLessThanOrEqual(20);
    expect(grilledStaples[0].ingredient).toBe('charcoal');
    expect(grilledStaples[0].priority).toBe('essential');
    expect(grilledStaples[0].category).toBe('flavor_builders');
  });

  it('should get Slow Cooker cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const slowCookerStaples = manager.getCuisineStaples('slow_cooker');

    expect(slowCookerStaples.length).toBeGreaterThanOrEqual(7);

    expect(slowCookerStaples.length).toBeLessThanOrEqual(20);
    expect(slowCookerStaples[0].ingredient).toBe('meat');
    expect(slowCookerStaples[0].priority).toBe('essential');
    expect(slowCookerStaples[0].category).toBe('proteins');
  });

  it('should get One-Pot cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const onePotStaples = manager.getCuisineStaples('one_pot');

    expect(onePotStaples.length).toBeGreaterThanOrEqual(7);

    expect(onePotStaples.length).toBeLessThanOrEqual(20);
    expect(onePotStaples[0].ingredient).toBe('rice');
    expect(onePotStaples[0].priority).toBe('essential');
    expect(onePotStaples[0].category).toBe('pantry_staples');
  });

  it('should get Intermittent Fasting cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const intermittentFastingStaples = manager.getCuisineStaples(
      'intermittent_fasting'
    );

    expect(intermittentFastingStaples.length).toBeGreaterThanOrEqual(7);

    expect(intermittentFastingStaples.length).toBeLessThanOrEqual(20);
    expect(intermittentFastingStaples[0].ingredient).toBe('protein');
    expect(intermittentFastingStaples[0].priority).toBe('essential');
    expect(intermittentFastingStaples[0].category).toBe('proteins');
  });

  it('should get Carnivore cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const carnivoreStaples = manager.getCuisineStaples('carnivore');

    expect(carnivoreStaples.length).toBeGreaterThanOrEqual(7);

    expect(carnivoreStaples.length).toBeLessThanOrEqual(20);
    expect(carnivoreStaples[0].ingredient).toBe('beef');
    expect(carnivoreStaples[0].priority).toBe('essential');
    expect(carnivoreStaples[0].category).toBe('proteins');
  });

  it('should get Mediterranean Keto cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mediterraneanKetoStaples =
      manager.getCuisineStaples('mediterranean_keto');

    expect(mediterraneanKetoStaples.length).toBeGreaterThanOrEqual(7);

    expect(mediterraneanKetoStaples.length).toBeLessThanOrEqual(20);
    expect(mediterraneanKetoStaples[0].ingredient).toBe('olive_oil');
    expect(mediterraneanKetoStaples[0].priority).toBe('essential');
    expect(mediterraneanKetoStaples[0].category).toBe('flavor_builders');
  });

  it('should get AIP cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const aipStaples = manager.getCuisineStaples('aip');

    expect(aipStaples.length).toBeGreaterThanOrEqual(7);

    expect(aipStaples.length).toBeLessThanOrEqual(20);
    expect(aipStaples[0].ingredient).toBe('meat');
    expect(aipStaples[0].priority).toBe('essential');
    expect(aipStaples[0].category).toBe('proteins');
  });

  it('should get Low FODMAP cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const lowFodmapStaples = manager.getCuisineStaples('low_fodmap');

    expect(lowFodmapStaples.length).toBeGreaterThanOrEqual(7);

    expect(lowFodmapStaples.length).toBeLessThanOrEqual(20);
    expect(lowFodmapStaples[0].ingredient).toBe('rice');
    expect(lowFodmapStaples[0].priority).toBe('essential');
    expect(lowFodmapStaples[0].category).toBe('pantry_staples');
  });

  it('should get Anti-Inflammatory cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const antiInflammatoryStaples =
      manager.getCuisineStaples('anti_inflammatory');

    expect(antiInflammatoryStaples.length).toBeGreaterThanOrEqual(7);

    expect(antiInflammatoryStaples.length).toBeLessThanOrEqual(20);
    expect(antiInflammatoryStaples[0].ingredient).toBe('fatty_fish');
    expect(antiInflammatoryStaples[0].priority).toBe('essential');
    expect(antiInflammatoryStaples[0].category).toBe('proteins');
  });

  it('should get Whole30 cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const whole30Staples = manager.getCuisineStaples('whole30');

    expect(whole30Staples.length).toBeGreaterThanOrEqual(7);

    expect(whole30Staples.length).toBeLessThanOrEqual(20);
    expect(whole30Staples[0].ingredient).toBe('meat');
    expect(whole30Staples[0].priority).toBe('essential');
    expect(whole30Staples[0].category).toBe('proteins');
  });

  it('should get DASH Diet cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const dashDietStaples = manager.getCuisineStaples('dash_diet');

    expect(dashDietStaples.length).toBeGreaterThanOrEqual(7);

    expect(dashDietStaples.length).toBeLessThanOrEqual(20);
    expect(dashDietStaples[0].ingredient).toBe('vegetables');
    expect(dashDietStaples[0].priority).toBe('essential');
    expect(dashDietStaples[0].category).toBe('fresh_produce');
  });

  it('should get MIND Diet cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mindDietStaples = manager.getCuisineStaples('mind_diet');

    expect(mindDietStaples.length).toBeGreaterThanOrEqual(7);

    expect(mindDietStaples.length).toBeLessThanOrEqual(20);
    expect(mindDietStaples[0].ingredient).toBe('leafy_greens');
    expect(mindDietStaples[0].priority).toBe('essential');
    expect(mindDietStaples[0].category).toBe('fresh_produce');
  });

  it('should find missing staples for Mexican cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['paprika'], // User has paprika but missing other essentials
      fresh_produce: ['onion', 'garlic'], // User has some basics
    });

    const missing = manager.findMissingStaples(
      'mexican',
      {
        flavor_builders: ['paprika'],
        fresh_produce: ['onion', 'garlic'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Mexican');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
    expect(missing.coverage).toBeGreaterThan(0);
    expect(missing.coverage).toBeLessThan(100);
  });

  it('should find missing staples for Italian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['tomato', 'garlic'],
      dairy_cold: ['cheese'],
    });

    const missing = manager.findMissingStaples(
      'italian',
      {
        fresh_produce: ['tomato', 'garlic'],
        dairy_cold: ['cheese'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Italian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Chinese cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['soy sauce'],
      fresh_produce: ['garlic', 'ginger'],
    });

    const missing = manager.findMissingStaples(
      'chinese',
      {
        flavor_builders: ['soy sauce'],
        fresh_produce: ['garlic', 'ginger'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Chinese');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Indian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['turmeric', 'cumin'],
      fresh_produce: ['garlic', 'onion'],
    });

    const missing = manager.findMissingStaples(
      'indian',
      {
        flavor_builders: ['turmeric', 'cumin'],
        fresh_produce: ['garlic', 'onion'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Indian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Thai cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['fish sauce'],
      fresh_produce: ['lime', 'garlic'],
    });

    const missing = manager.findMissingStaples(
      'thai',
      {
        flavor_builders: ['fish sauce'],
        fresh_produce: ['lime', 'garlic'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Thai');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Korean cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['gochujang', 'soy sauce'],
      fresh_produce: ['garlic', 'ginger'],
    });

    const missing = manager.findMissingStaples(
      'korean',
      {
        flavor_builders: ['gochujang', 'soy sauce'],
        fresh_produce: ['garlic', 'ginger'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Korean');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Japanese cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['soy sauce', 'miso'],
      fresh_produce: ['ginger', 'green onions'],
    });

    const missing = manager.findMissingStaples(
      'japanese',
      {
        flavor_builders: ['soy sauce', 'miso'],
        fresh_produce: ['ginger', 'green onions'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Japanese');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Vietnamese cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['fish sauce'],
      fresh_produce: ['lime', 'cilantro', 'mint'],
    });

    const missing = manager.findMissingStaples(
      'vietnamese',
      {
        flavor_builders: ['fish sauce'],
        fresh_produce: ['lime', 'cilantro', 'mint'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Vietnamese');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Greek cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['olive oil'],
      dairy_cold: ['feta cheese'],
      fresh_produce: ['lemon', 'garlic'],
    });

    const missing = manager.findMissingStaples(
      'greek',
      {
        flavor_builders: ['olive oil'],
        dairy_cold: ['feta cheese'],
        fresh_produce: ['lemon', 'garlic'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Greek');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for French cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      dairy_cold: ['butter', 'cream'],
      fresh_produce: ['garlic', 'shallots'],
    });

    const missing = manager.findMissingStaples(
      'french',
      {
        dairy_cold: ['butter', 'cream'],
        fresh_produce: ['garlic', 'shallots'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('French');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Spanish cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['olive oil', 'paprika'],
      fresh_produce: ['garlic', 'onion'],
    });

    const missing = manager.findMissingStaples(
      'spanish',
      {
        flavor_builders: ['olive oil', 'paprika'],
        fresh_produce: ['garlic', 'onion'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Spanish');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Lebanese cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['olive oil', 'tahini'],
      fresh_produce: ['garlic', 'lemon'],
    });

    const missing = manager.findMissingStaples(
      'lebanese',
      {
        flavor_builders: ['olive oil', 'tahini'],
        fresh_produce: ['garlic', 'lemon'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Lebanese');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Turkish cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['olive oil'],
      fresh_produce: ['garlic', 'onion'],
      dairy_cold: ['yogurt'],
    });

    const missing = manager.findMissingStaples(
      'turkish',
      {
        flavor_builders: ['olive oil'],
        fresh_produce: ['garlic', 'onion'],
        dairy_cold: ['yogurt'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Turkish');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Ethiopian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['berbere'],
      fresh_produce: ['garlic', 'onion'],
    });

    const missing = manager.findMissingStaples(
      'ethiopian',
      {
        flavor_builders: ['berbere'],
        fresh_produce: ['garlic', 'onion'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Ethiopian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for German cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      proteins: ['sausages'],
      fresh_produce: ['potatoes', 'cabbage'],
      flavor_builders: ['mustard'],
    });

    const missing = manager.findMissingStaples(
      'german',
      {
        proteins: ['sausages'],
        fresh_produce: ['potatoes', 'cabbage'],
        flavor_builders: ['mustard'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('German');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Brazilian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      pantry_staples: ['rice', 'black beans'],
      fresh_produce: ['garlic', 'onion'],
    });

    const missing = manager.findMissingStaples(
      'brazilian',
      {
        pantry_staples: ['rice', 'black beans'],
        fresh_produce: ['garlic', 'onion'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Brazilian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Peruvian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['lime', 'garlic', 'onion'],
      pantry_staples: ['rice', 'quinoa'],
    });

    const missing = manager.findMissingStaples(
      'peruvian',
      {
        fresh_produce: ['lime', 'garlic', 'onion'],
        pantry_staples: ['rice', 'quinoa'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Peruvian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Moroccan cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      pantry_staples: ['couscous'],
      fresh_produce: ['garlic', 'onion'],
      flavor_builders: ['olive oil', 'cumin'],
    });

    const missing = manager.findMissingStaples(
      'moroccan',
      {
        pantry_staples: ['couscous'],
        fresh_produce: ['garlic', 'onion'],
        flavor_builders: ['olive oil', 'cumin'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Moroccan');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Filipino cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      pantry_staples: ['rice'],
      fresh_produce: ['garlic', 'onion'],
      flavor_builders: ['soy sauce', 'vinegar'],
    });

    const missing = manager.findMissingStaples(
      'filipino',
      {
        pantry_staples: ['rice'],
        fresh_produce: ['garlic', 'onion'],
        flavor_builders: ['soy sauce', 'vinegar'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Filipino');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Jamaican cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['scotch bonnet peppers', 'garlic', 'onion'],
      flavor_builders: ['allspice', 'thyme'],
    });

    const missing = manager.findMissingStaples(
      'jamaican',
      {
        fresh_produce: ['scotch bonnet peppers', 'garlic', 'onion'],
        flavor_builders: ['allspice', 'thyme'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Jamaican');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Russian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['beets', 'cabbage', 'potatoes'],
      dairy_cold: ['sour cream'],
    });

    const missing = manager.findMissingStaples(
      'russian',
      {
        fresh_produce: ['beets', 'cabbage', 'potatoes'],
        dairy_cold: ['sour cream'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Russian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Polish cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      proteins: ['kielbasa'],
      fresh_produce: ['cabbage', 'potatoes'],
      pantry_staples: ['flour'],
    });

    const missing = manager.findMissingStaples(
      'polish',
      {
        proteins: ['kielbasa'],
        fresh_produce: ['cabbage', 'potatoes'],
        pantry_staples: ['flour'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Polish');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Hungarian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['paprika'],
      fresh_produce: ['onion', 'garlic', 'tomatoes'],
    });

    const missing = manager.findMissingStaples(
      'hungarian',
      {
        flavor_builders: ['paprika'],
        fresh_produce: ['onion', 'garlic', 'tomatoes'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Hungarian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Nigerian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      pantry_staples: ['rice'],
      fresh_produce: ['tomatoes', 'onion', 'garlic'],
      flavor_builders: ['palm oil', 'stock cubes'],
    });

    const missing = manager.findMissingStaples(
      'nigerian',
      {
        pantry_staples: ['rice'],
        fresh_produce: ['tomatoes', 'onion', 'garlic'],
        flavor_builders: ['palm oil', 'stock cubes'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Nigerian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for South African cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      proteins: ['meat'],
      fresh_produce: ['onion', 'garlic', 'tomatoes'],
      flavor_builders: ['curry powder', 'turmeric'],
    });

    const missing = manager.findMissingStaples(
      'south_african',
      {
        proteins: ['meat'],
        fresh_produce: ['onion', 'garlic', 'tomatoes'],
        flavor_builders: ['curry powder', 'turmeric'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('South African');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Egyptian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      pantry_staples: ['fava beans', 'rice', 'lentils'],
      fresh_produce: ['onion', 'garlic', 'tomatoes'],
    });

    const missing = manager.findMissingStaples(
      'egyptian',
      {
        pantry_staples: ['fava beans', 'rice', 'lentils'],
        fresh_produce: ['onion', 'garlic', 'tomatoes'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Egyptian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Swedish cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      proteins: ['ground beef', 'ground pork'],
      fresh_produce: ['onion', 'garlic', 'potatoes'],
      dairy_cold: ['milk', 'butter', 'cream'],
    });

    const missing = manager.findMissingStaples(
      'swedish',
      {
        proteins: ['ground beef', 'ground pork'],
        fresh_produce: ['onion', 'garlic', 'potatoes'],
        dairy_cold: ['milk', 'butter', 'cream'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Swedish');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Dutch cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['potatoes', 'cabbage', 'onion', 'garlic'],
      dairy_cold: ['butter', 'milk', 'cheese'],
      proteins: ['herring', 'eggs'],
    });

    const missing = manager.findMissingStaples(
      'dutch',
      {
        fresh_produce: ['potatoes', 'cabbage', 'onion', 'garlic'],
        dairy_cold: ['butter', 'milk', 'cheese'],
        proteins: ['herring', 'eggs'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Dutch');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should find missing staples for Austrian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      proteins: ['veal', 'pork', 'eggs'],
      pantry_staples: ['flour', 'breadcrumbs', 'sugar'],
      dairy_cold: ['butter', 'milk', 'cream'],
    });

    const missing = manager.findMissingStaples(
      'austrian',
      {
        proteins: ['veal', 'pork', 'eggs'],
        pantry_staples: ['flour', 'breadcrumbs', 'sugar'],
        dairy_cold: ['butter', 'milk', 'cream'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Austrian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should get recommended additions', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['onion', 'garlic'], // User has basics
    });

    const recommendations = manager.getRecommendedAdditions(
      'mexican',
      {
        fresh_produce: ['onion', 'garlic'],
      },
      matcher,
      3
    );

    expect(recommendations.length).toBeLessThanOrEqual(3);
    expect(recommendations.length).toBeGreaterThan(0);

    // Should prioritize essential ingredients
    const essentialCount = recommendations.filter(
      (r) => r.priority === 'essential'
    ).length;
    expect(essentialCount).toBeGreaterThan(0);
  });

  it('should get all missing staples', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['onion', 'garlic'],
      flavor_builders: ['paprika'],
    });

    const allMissing = manager.getAllMissingStaples(
      {
        fresh_produce: ['onion', 'garlic'],
        flavor_builders: ['paprika'],
      },
      matcher
    );

    expect(allMissing.length).toBeGreaterThan(0);
    expect(allMissing.every((m) => m.missing.length > 0)).toBe(true);
  });

  it('should handle empty groceries', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({});

    const missing = manager.findMissingStaples('mexican', {}, matcher);

    expect(missing.cuisine).toBe('Mexican');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBe(0);
    expect(missing.coverage).toBe(0);
  });

  it('should handle unknown cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({});

    const missing = manager.findMissingStaples('unknown', {}, matcher);

    expect(missing.cuisine).toBe('unknown');
    expect(missing.missing).toEqual([]);
    expect(missing.available).toEqual([]);
    expect(missing.coverage).toBe(0);
  });
});
