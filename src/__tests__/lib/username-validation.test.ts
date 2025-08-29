import { describe, it, expect } from 'vitest';

// Test the validation regex directly
const USERNAME_VALIDATION_REGEX = /^[a-z0-9_]{3,24}$/;

describe('Username Validation', () => {
  describe('valid usernames', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'testuser',
        'user123',
        'test_user',
        'abc',
        'a'.repeat(24),
      ];

      validUsernames.forEach((username) => {
        expect(USERNAME_VALIDATION_REGEX.test(username)).toBe(true);
      });
    });
  });

  describe('invalid usernames', () => {
    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'invalid-username!',
        'ab', // too short
        'a'.repeat(25), // too long
        'TestUser', // uppercase
        'user@name', // special characters
        'user name', // spaces
      ];

      invalidUsernames.forEach((username) => {
        expect(USERNAME_VALIDATION_REGEX.test(username)).toBe(false);
      });
    });
  });
});
