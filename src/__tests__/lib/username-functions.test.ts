import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUsernameAvailability, claimUsername } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

const mockSupabase = vi.mocked(supabase);

describe.skip('Username Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUsernameAvailability', () => {
    it('should return available for valid username', async () => {
      // Mock successful RPC call
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await checkUsernameAvailability('testuser123');

      expect(result.available).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('is_username_available', {
        p_username: 'testuser123',
      });
    });

    it('should return unavailable for taken username', async () => {
      // Mock successful RPC call returning false
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await checkUsernameAvailability('alice');

      expect(result.available).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid username format', async () => {
      const result = await checkUsernameAvailability('invalid-username!');

      expect(result.available).toBe(false);
      expect(result.error?.message).toContain(
        'lowercase letters, numbers, and underscores'
      );
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should return error for username too short', async () => {
      const result = await checkUsernameAvailability('ab');

      expect(result.available).toBe(false);
      expect(result.error?.message).toContain('3-24 characters');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should return error for username too long', async () => {
      const result = await checkUsernameAvailability('a'.repeat(25));

      expect(result.available).toBe(false);
      expect(result.error?.message).toContain('3-24 characters');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      const result = await checkUsernameAvailability('testuser');

      expect(result.available).toBe(false);
      expect(result.error?.message).toBe('Database error');
    });

    it('should handle exceptions', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const result = await checkUsernameAvailability('testuser');

      expect(result.available).toBe(false);
      expect(result.error?.message).toContain('unexpected error');
    });
  });

  describe('claimUsername', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should successfully claim available username', async () => {
      // Mock successful username update
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      // Mock profile fetch
      mockSupabase
        .from()
        .select()
        .single.mockResolvedValue({
          data: { id: mockUser.id, username: 'newusername' },
          error: null,
        });

      const result = await claimUsername('newusername');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_username_atomic', {
        p_user_id: mockUser.id,
        p_new_username: 'newusername',
      });
    });

    it('should handle username already taken', async () => {
      // Mock username already taken response
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false, error: 'username_already_taken' },
        error: null,
      });

      const result = await claimUsername('alice');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('This username is already taken');
    });

    it('should handle unauthorized access', async () => {
      // Mock unauthorized response
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false, error: 'unauthorized' },
        error: null,
      });

      const result = await claimUsername('newusername');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('unauthorized');
    });

    it('should handle user not found', async () => {
      // Mock user not found response
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false, error: 'user_not_found' },
        error: null,
      });

      const result = await claimUsername('newusername');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('user_not_found');
    });

    it('should handle invalid username format', async () => {
      const result = await claimUsername('invalid-username!');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain(
        'lowercase letters, numbers, and underscores'
      );
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await claimUsername('newusername');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('must be signed in');
    });

    it('should handle RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      const result = await claimUsername('newusername');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Database error');
    });

    it('should handle exceptions', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const result = await claimUsername('newusername');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
    });
  });
});
