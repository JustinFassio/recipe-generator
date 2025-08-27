import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Database integration tests for username functions
// These tests require a running Supabase instance

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if no service role key (CI environment)
const testIfServiceKey = SUPABASE_SERVICE_ROLE_KEY ? it : it.skip;

describe('Database Username Functions Integration', () => {
  let admin: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ Skipping database tests - no service role key');
      return;
    }

    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create a test user
    const { data: user, error } = await admin.auth.admin.createUser({
      email: 'test-username-functions@example.com',
      password: 'testpassword123',
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    testUserId = user.user.id;

    // Create profile for test user
    await admin.from('profiles').upsert({
      id: testUserId,
      full_name: 'Test User',
    });
  });

  afterAll(async () => {
    if (testUserId) {
      // Clean up test user
      await admin.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    if (!testUserId) return;

    // Clean up any usernames created by previous tests
    await admin.from('usernames').delete().eq('user_id', testUserId);
    await admin
      .from('profiles')
      .update({ username: null })
      .eq('id', testUserId);
  });

  describe('is_username_available function', () => {
    testIfServiceKey('should return true for available username', async () => {
      const { data, error } = await admin.rpc('is_username_available', {
        p_username: 'unique_test_username_123',
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    testIfServiceKey('should return false for taken username', async () => {
      // First, take the username
      await admin.rpc('update_username_atomic', {
        p_user_id: testUserId,
        p_new_username: 'taken_username_test',
      });

      // Then check if it's available
      const { data, error } = await admin.rpc('is_username_available', {
        p_username: 'taken_username_test',
      });

      expect(error).toBeNull();
      expect(data).toBe(false);
    });

    testIfServiceKey('should handle empty username', async () => {
      const { data, error } = await admin.rpc('is_username_available', {
        p_username: '',
      });

      expect(error).toBeNull();
      expect(data).toBe(true); // Empty username is technically available
    });
  });

  describe('update_username_atomic function', () => {
    testIfServiceKey(
      'should successfully claim available username',
      async () => {
        const newUsername = 'new_username_test_123';

        const { data, error } = await admin.rpc('update_username_atomic', {
          p_user_id: testUserId,
          p_new_username: newUsername,
        });

        expect(error).toBeNull();
        expect(data).toEqual({ success: true });

        // Verify username was set in profiles table
        const { data: profile } = await admin
          .from('profiles')
          .select('username')
          .eq('id', testUserId)
          .single();

        expect(profile.username).toBe(newUsername);

        // Verify username was set in usernames table
        const { data: usernameRecord } = await admin
          .from('usernames')
          .select('username')
          .eq('user_id', testUserId)
          .single();

        expect(usernameRecord.username).toBe(newUsername);
      }
    );

    testIfServiceKey('should fail when username is already taken', async () => {
      const takenUsername = 'already_taken_username';

      // First user takes the username
      await admin.rpc('update_username_atomic', {
        p_user_id: testUserId,
        p_new_username: takenUsername,
      });

      // Create another test user
      const { data: user2 } = await admin.auth.admin.createUser({
        email: 'test2-username-functions@example.com',
        password: 'testpassword123',
        email_confirm: true,
      });

      await admin.from('profiles').upsert({
        id: user2.user.id,
        full_name: 'Test User 2',
      });

      // Second user tries to take the same username
      const { data, error } = await admin.rpc('update_username_atomic', {
        p_user_id: user2.user.id,
        p_new_username: takenUsername,
      });

      expect(error).toBeNull();
      expect(data).toEqual({ success: false, error: 'username_already_taken' });

      // Clean up second user
      await admin.auth.admin.deleteUser(user2.user.id);
    });

    testIfServiceKey(
      'should allow user to update their own username',
      async () => {
        const firstUsername = 'first_username_test';
        const secondUsername = 'second_username_test';

        // Set initial username
        await admin.rpc('update_username_atomic', {
          p_user_id: testUserId,
          p_new_username: firstUsername,
        });

        // Update to new username
        const { data, error } = await admin.rpc('update_username_atomic', {
          p_user_id: testUserId,
          p_new_username: secondUsername,
        });

        expect(error).toBeNull();
        expect(data).toEqual({ success: true });

        // Verify both tables were updated
        const { data: profile } = await admin
          .from('profiles')
          .select('username')
          .eq('id', testUserId)
          .single();

        expect(profile.username).toBe(secondUsername);

        const { data: usernameRecord } = await admin
          .from('usernames')
          .select('username')
          .eq('user_id', testUserId)
          .single();

        expect(usernameRecord.username).toBe(secondUsername);
      }
    );

    testIfServiceKey('should fail for non-existent user', async () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await admin.rpc('update_username_atomic', {
        p_user_id: nonExistentUserId,
        p_new_username: 'test_username',
      });

      expect(error).toBeNull();
      expect(data).toEqual({ success: false, error: 'user_not_found' });
    });

    testIfServiceKey('should handle invalid username format', async () => {
      const invalidUsername = 'invalid-username!';

      const { data, error } = await admin.rpc('update_username_atomic', {
        p_user_id: testUserId,
        p_new_username: invalidUsername,
      });

      expect(error).toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toContain('check constraint');
    });
  });

  describe('Username constraints and validation', () => {
    testIfServiceKey('should enforce username length constraints', async () => {
      // Test too short username
      const shortUsername = 'ab';
      const { data: shortResult } = await admin.rpc('update_username_atomic', {
        p_user_id: testUserId,
        p_new_username: shortUsername,
      });

      expect(shortResult.success).toBe(false);

      // Test too long username
      const longUsername = 'a'.repeat(25);
      const { data: longResult } = await admin.rpc('update_username_atomic', {
        p_user_id: testUserId,
        p_new_username: longUsername,
      });

      expect(longResult.success).toBe(false);
    });

    testIfServiceKey(
      'should enforce username character constraints',
      async () => {
        const invalidUsernames = [
          'user-name', // hyphen
          'user_name!', // exclamation
          'user@name', // at symbol
          'user name', // space
          'USERNAME', // uppercase
        ];

        for (const invalidUsername of invalidUsernames) {
          const { data } = await admin.rpc('update_username_atomic', {
            p_user_id: testUserId,
            p_new_username: invalidUsername,
          });

          expect(data.success).toBe(false);
        }
      }
    );

    testIfServiceKey('should allow valid username characters', async () => {
      const validUsernames = [
        'user123',
        'user_name',
        'user123name',
        'user',
        'a'.repeat(24), // max length
      ];

      for (const validUsername of validUsernames) {
        const { data } = await admin.rpc('update_username_atomic', {
          p_user_id: testUserId,
          p_new_username: validUsername,
        });

        expect(data.success).toBe(true);

        // Clean up for next test
        await admin.from('usernames').delete().eq('user_id', testUserId);
        await admin
          .from('profiles')
          .update({ username: null })
          .eq('id', testUserId);
      }
    });
  });

  describe('Username uniqueness', () => {
    testIfServiceKey(
      'should enforce username uniqueness across users',
      async () => {
        const sharedUsername = 'shared_username_test';

        // First user claims username
        const { data: firstResult } = await admin.rpc(
          'update_username_atomic',
          {
            p_user_id: testUserId,
            p_new_username: sharedUsername,
          }
        );

        expect(firstResult.success).toBe(true);

        // Create second user
        const { data: user2 } = await admin.auth.admin.createUser({
          email: 'test3-username-functions@example.com',
          password: 'testpassword123',
          email_confirm: true,
        });

        await admin.from('profiles').upsert({
          id: user2.user.id,
          full_name: 'Test User 3',
        });

        // Second user tries to claim same username
        const { data: secondResult } = await admin.rpc(
          'update_username_atomic',
          {
            p_user_id: user2.user.id,
            p_new_username: sharedUsername,
          }
        );

        expect(secondResult.success).toBe(false);
        expect(secondResult.error).toBe('username_already_taken');

        // Clean up second user
        await admin.auth.admin.deleteUser(user2.user.id);
      }
    );
  });
});
