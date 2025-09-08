import { describe, it, expect } from 'vitest';
import {
  NORTH_AMERICAN_COUNTRIES,
  US_STATES,
  CANADIAN_PROVINCES,
  MEXICAN_STATES,
  ALL_STATES_PROVINCES,
  getStatesProvincesByCountry,
  getStateProvinceByCode,
  getStateProvinceByValue,
  getCitiesByStateProvince,
  getCitiesByCountry,
} from '@/lib/geographic-data';

describe('Geographic Data', () => {
  describe('NORTH_AMERICAN_COUNTRIES', () => {
    it('should contain expected countries', () => {
      expect(NORTH_AMERICAN_COUNTRIES).toHaveLength(4);
      expect(NORTH_AMERICAN_COUNTRIES.map((c) => c.value)).toEqual([
        'United States',
        'Canada',
        'Mexico',
        'Other',
      ]);
    });

    it('should have proper structure for each country', () => {
      NORTH_AMERICAN_COUNTRIES.forEach((country) => {
        expect(country).toHaveProperty('value');
        expect(country).toHaveProperty('label');
        expect(country).toHaveProperty('code');
        expect(typeof country.value).toBe('string');
        expect(typeof country.label).toBe('string');
        expect(typeof country.code).toBe('string');
      });
    });
  });

  describe('US_STATES', () => {
    it('should contain 50 states plus DC', () => {
      expect(US_STATES).toHaveLength(51);
    });

    it('should have proper structure for each state', () => {
      US_STATES.forEach((state) => {
        expect(state).toHaveProperty('value');
        expect(state).toHaveProperty('label');
        expect(state).toHaveProperty('code');
        expect(state).toHaveProperty('country');
        expect(state.country).toBe('United States');
        expect(typeof state.value).toBe('string');
        expect(typeof state.label).toBe('string');
        expect(typeof state.code).toBe('string');
      });
    });

    it('should include major states', () => {
      const stateValues = US_STATES.map((s) => s.value);
      expect(stateValues).toContain('California');
      expect(stateValues).toContain('Texas');
      expect(stateValues).toContain('New York');
      expect(stateValues).toContain('Florida');
      expect(stateValues).toContain('District of Columbia');
    });
  });

  describe('CANADIAN_PROVINCES', () => {
    it('should contain 13 provinces and territories', () => {
      expect(CANADIAN_PROVINCES).toHaveLength(13);
    });

    it('should have proper structure for each province', () => {
      CANADIAN_PROVINCES.forEach((province) => {
        expect(province).toHaveProperty('value');
        expect(province).toHaveProperty('label');
        expect(province).toHaveProperty('code');
        expect(province).toHaveProperty('country');
        expect(province.country).toBe('Canada');
      });
    });

    it('should include major provinces', () => {
      const provinceValues = CANADIAN_PROVINCES.map((p) => p.value);
      expect(provinceValues).toContain('Ontario');
      expect(provinceValues).toContain('Quebec');
      expect(provinceValues).toContain('British Columbia');
      expect(provinceValues).toContain('Alberta');
    });
  });

  describe('MEXICAN_STATES', () => {
    it('should contain 31 states', () => {
      expect(MEXICAN_STATES).toHaveLength(31);
    });

    it('should have proper structure for each state', () => {
      MEXICAN_STATES.forEach((state) => {
        expect(state).toHaveProperty('value');
        expect(state).toHaveProperty('label');
        expect(state).toHaveProperty('code');
        expect(state).toHaveProperty('country');
        expect(state.country).toBe('Mexico');
      });
    });

    it('should include major states', () => {
      const stateValues = MEXICAN_STATES.map((s) => s.value);
      expect(stateValues).toContain('Jalisco');
      expect(stateValues).toContain('Mexico');
      expect(stateValues).toContain('Nuevo Leon');
      expect(stateValues).toContain('Yucatan');
    });
  });

  describe('ALL_STATES_PROVINCES', () => {
    it('should contain all states and provinces', () => {
      expect(ALL_STATES_PROVINCES).toHaveLength(95); // 51 US + 13 CA + 31 MX
    });

    it('should be a combination of all state/province arrays', () => {
      const expectedLength =
        US_STATES.length + CANADIAN_PROVINCES.length + MEXICAN_STATES.length;
      expect(ALL_STATES_PROVINCES).toHaveLength(expectedLength);
    });
  });

  describe('getStatesProvincesByCountry', () => {
    it('should return US states for United States', () => {
      const result = getStatesProvincesByCountry('United States');
      expect(result).toEqual(US_STATES);
    });

    it('should return Canadian provinces for Canada', () => {
      const result = getStatesProvincesByCountry('Canada');
      expect(result).toEqual(CANADIAN_PROVINCES);
    });

    it('should return Mexican states for Mexico', () => {
      const result = getStatesProvincesByCountry('Mexico');
      expect(result).toEqual(MEXICAN_STATES);
    });

    it('should return empty array for unknown country', () => {
      const result = getStatesProvincesByCountry('Unknown Country');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = getStatesProvincesByCountry('');
      expect(result).toEqual([]);
    });
  });

  describe('getStateProvinceByCode', () => {
    it('should find US state by code', () => {
      const result = getStateProvinceByCode('CA', 'United States');
      expect(result).toBeDefined();
      expect(result?.value).toBe('California');
      expect(result?.country).toBe('United States');
    });

    it('should find Canadian province by code', () => {
      const result = getStateProvinceByCode('ON', 'Canada');
      expect(result).toBeDefined();
      expect(result?.value).toBe('Ontario');
      expect(result?.country).toBe('Canada');
    });

    it('should find Mexican state by code', () => {
      const result = getStateProvinceByCode('JA', 'Mexico');
      expect(result).toBeDefined();
      expect(result?.value).toBe('Jalisco');
      expect(result?.country).toBe('Mexico');
    });

    it('should return undefined for unknown code', () => {
      const result = getStateProvinceByCode('XX', 'United States');
      expect(result).toBeUndefined();
    });
  });

  describe('getStateProvinceByValue', () => {
    it('should find state by value', () => {
      const result = getStateProvinceByValue('California', 'United States');
      expect(result).toBeDefined();
      expect(result?.code).toBe('CA');
      expect(result?.country).toBe('United States');
    });

    it('should return undefined for unknown value', () => {
      const result = getStateProvinceByValue('Unknown State', 'United States');
      expect(result).toBeUndefined();
    });
  });

  describe('getCitiesByStateProvince', () => {
    it('should return cities for California', () => {
      const result = getCitiesByStateProvince('California');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Los Angeles');
      expect(result).toContain('San Francisco');
    });

    it('should return cities for Ontario', () => {
      const result = getCitiesByStateProvince('Ontario');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Toronto');
      expect(result).toContain('Ottawa');
    });

    it('should return empty array for unknown state/province', () => {
      const result = getCitiesByStateProvince('Unknown State');
      expect(result).toEqual([]);
    });
  });

  describe('getCitiesByCountry', () => {
    it('should return cities for United States', () => {
      const result = getCitiesByCountry('United States');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return cities for Canada', () => {
      const result = getCitiesByCountry('Canada');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return cities for Mexico', () => {
      const result = getCitiesByCountry('Mexico');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown country', () => {
      const result = getCitiesByCountry('Unknown Country');
      expect(result).toEqual([]);
    });
  });
});
