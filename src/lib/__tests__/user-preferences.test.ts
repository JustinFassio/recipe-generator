import { describe, it, expect } from 'vitest';
import {
  validateAllergies,
  validateSpiceTolerance,
  validateTimePerMeal,
} from '../user-preferences';

describe('user-preferences validation', () => {
  describe('validateAllergies', () => {
    it('should return true for valid allergies', () => {
      expect(validateAllergies(['peanut', 'shellfish', 'dairy'])).toBe(true);
    });

    it('should return false for empty string allergies', () => {
      expect(validateAllergies(['peanut', '', 'dairy'])).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(validateAllergies([])).toBe(true);
    });
  });

  describe('validateSpiceTolerance', () => {
    it('should return true for valid spice levels', () => {
      expect(validateSpiceTolerance(1)).toBe(true);
      expect(validateSpiceTolerance(3)).toBe(true);
      expect(validateSpiceTolerance(5)).toBe(true);
    });

    it('should return false for invalid spice levels', () => {
      expect(validateSpiceTolerance(0)).toBe(false);
      expect(validateSpiceTolerance(6)).toBe(false);
      expect(validateSpiceTolerance(3.5)).toBe(false);
    });
  });

  describe('validateTimePerMeal', () => {
    it('should return true for valid time ranges', () => {
      expect(validateTimePerMeal(10)).toBe(true);
      expect(validateTimePerMeal(60)).toBe(true);
      expect(validateTimePerMeal(120)).toBe(true);
    });

    it('should return false for invalid time ranges', () => {
      expect(validateTimePerMeal(5)).toBe(false);
      expect(validateTimePerMeal(150)).toBe(false);
      expect(validateTimePerMeal(30.5)).toBe(false);
    });
  });
});
