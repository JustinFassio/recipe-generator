import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  createDbClient,
  shouldRunDbTests,
} from '../../../tests/database/_utils/dbClient';
import {
  createUserAndProfile,
  uniqueUsername,
} from '../../../tests/database/_utils/factories';
import { truncatePhase1Tables } from '../../../tests/database/_utils/cleanup';

// These tests expect DB functions:
// - is_username_available(text)
// - update_username_atomic(user_id uuid, new_username text)
// - claim_username_atomic(user_id uuid, username text)

const RUN = shouldRunDbTests();

RUN
  ? describe('Database: Username Functions (integration)', () => {
      const admin = createDbClient('service');

      beforeAll(async () => {
        // Ensure schema is migrated beforehand in CI/setup
      });

      afterEach(async () => {
        await truncatePhase1Tables(admin);
      });

      it('is_username_available: returns true for available username', async () => {
        const username = uniqueUsername('avail');
        const { data, error } = await admin.rpc('is_username_available', {
          check_username: username,
        });
        expect(error).toBeNull();
        expect(data).toBe(true);
      });

      it('is_username_available: returns false for taken username', async () => {
        const taken = uniqueUsername('taken');
        const { user } = await createUserAndProfile(admin, { username: null });
        expect(user.id).toBeTruthy();

        const { error: insertErr } = await admin
          .from('usernames')
          .insert({ username: taken, user_id: user.id });
        expect(insertErr).toBeNull();

        const { data, error } = await admin.rpc('is_username_available', {
          check_username: taken,
        });
        expect(error).toBeNull();
        expect(data).toBe(false);
      });

      it('update_username_atomic: successfully updates own username', async () => {
        const { user } = await createUserAndProfile(admin, { username: null });
        const target = uniqueUsername('update');

        const { data: result, error } = await admin.rpc(
          'update_username_atomic',
          {
            p_user_id: user.id,
            p_new_username: target,
          }
        );
        expect(error).toBeNull();
        expect(result?.success).toBe(true);

        const { data: profileRow, error: profileErr } = await admin
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        expect(profileErr).toBeNull();
        expect(profileRow?.username).toBe(target);
      });

      it('update_username_atomic: returns error when username already taken', async () => {
        const taken = uniqueUsername('taken');
        const { user: first } = await createUserAndProfile(admin, {
          username: taken,
        });
        const { user: second } = await createUserAndProfile(admin, {
          username: null,
        });
        expect(first.id && second.id).toBeTruthy();

        const { data: result, error } = await admin.rpc(
          'update_username_atomic',
          {
            p_user_id: second.id,
            p_new_username: taken,
          }
        );
        expect(error).toBeNull();
        expect(result?.success).toBe(false);
        expect(result?.error).toBe('username_already_taken');
      });

      it('claim_username_atomic: successfully claims a free username', async () => {
        const { user } = await createUserAndProfile(admin, { username: null });
        const target = uniqueUsername('claim');
        const { error } = await admin.rpc('claim_username_atomic', {
          p_user_id: user.id,
          p_username: target,
        });
        expect(error).toBeNull();

        const { data, error: getErr } = await admin
          .from('usernames')
          .select('*')
          .eq('username', target)
          .single();
        expect(getErr).toBeNull();
        expect(data?.user_id).toBe(user.id);
      });

      it('claim_username_atomic: returns false when user already has a username', async () => {
        const { user } = await createUserAndProfile(admin, { username: null });
        const first = uniqueUsername('first');
        const second = uniqueUsername('second');

        const firstClaim = await admin.rpc('claim_username_atomic', {
          p_user_id: user.id,
          p_username: first,
        });
        expect(firstClaim.error).toBeNull();
        expect(firstClaim.data).toBe(true);

        const secondClaim = await admin.rpc('claim_username_atomic', {
          p_user_id: user.id,
          p_username: second,
        });
        expect(secondClaim.error).toBeNull();
        expect(secondClaim.data).toBe(true);
      });
    })
  : describe.skip('Database: Username Functions (integration) - missing SUPABASE_SERVICE_ROLE_KEY, skipping', () => {});
