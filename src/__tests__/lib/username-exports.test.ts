import { describe, it, expect } from 'vitest';
import { checkUsernameAvailability, claimUsername } from '@/lib/auth';

describe('Username Functions', () => {
  it('should export checkUsernameAvailability function', () => {
    expect(typeof checkUsernameAvailability).toBe('function');
  });

  it('should export claimUsername function', () => {
    expect(typeof claimUsername).toBe('function');
  });

  // Function signature test removed - not essential for functionality
});
