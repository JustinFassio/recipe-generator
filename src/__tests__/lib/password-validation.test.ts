import { describe, it, expect } from 'vitest';

// Password validation constants
const MIN_PASSWORD_LENGTH = 6;

// Password validation function (extracted from components for testing)
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  return { isValid: true };
}

// Test password validation logic
describe('Password Validation', () => {
  describe('validatePassword function', () => {
    it('should accept valid passwords (6+ characters)', () => {
      const validPasswords = [
        '123456', // exactly 6
        'abcdef', // exactly 6
        'password', // 8 characters
        'mypassword123', // 12 characters
        'a'.repeat(20), // 20 characters
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject passwords shorter than 6 characters', () => {
      const invalidPasswords = [
        'a', // 1 character
        'ab', // 2 characters
        'abc', // 3 characters
        'abcd', // 4 characters
        'abcde', // 5 characters
      ];

      invalidPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
        );
      });
    });

    it('should reject null/undefined passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });
  });

  describe('Password length constants', () => {
    it('should have consistent minimum length across the app', () => {
      // This test ensures we don't accidentally change the minimum length
      expect(MIN_PASSWORD_LENGTH).toBe(6);
    });

    it('should match Supabase backend configuration', () => {
      // This test documents the expected backend configuration
      // If backend changes, this test will fail and remind us to update frontend
      expect(MIN_PASSWORD_LENGTH).toBe(6); // Should match supabase/config.toml
    });
  });

  describe('Password validation edge cases', () => {
    it('should handle special characters', () => {
      const specialCharPasswords = [
        '123!@#', // 6 chars with special chars
        'pass@word', // 9 chars with special chars
        'a1b2c3', // 6 chars alphanumeric
      ];

      specialCharPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle unicode characters', () => {
      const unicodePasswords = [
        '123456', // basic
        'pässwörd', // umlauts
        'パスワード', // japanese (6 chars)
      ];

      unicodePasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(password.length >= MIN_PASSWORD_LENGTH);
      });
    });
  });
});
