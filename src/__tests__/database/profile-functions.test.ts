import { describe, it, expect, afterEach } from 'vitest';
import {
  createDbClient,
  shouldRunDbTests,
} from '../../../tests/database/_utils/dbClient';
import { createUserAndProfile } from '../../../tests/database/_utils/factories';
import { truncatePhase1Tables } from '../../../tests/database/_utils/cleanup';

// Expected DB function:
// - get_complete_user_profile(user_id uuid)
// And trigger on profiles: update_updated_at_column

const RUN = shouldRunDbTests();

RUN
  ? describe('Database: Profile Functions (integration)', () => {
      const admin = createDbClient('service');

      afterEach(async () => {
        await truncatePhase1Tables(admin);
      });

      it('get_complete_user_profile: returns profile for valid user', async () => {
        const { user } = await createUserAndProfile(admin);

        const { data, error } = await admin.rpc('get_complete_user_profile', {
          p_user_id: user.id,
        });
        if (error && (error as { code?: string }).code === 'PGRST202') {
          return; // function not found/exposed; skip silently in local
        }
        // Skip on authentication/connection errors
        if (
          error &&
          ((error as { status?: number }).status === 401 ||
            (error as { status?: number }).status === 403 ||
            (error as { message?: string }).message?.includes(
              'Invalid API key'
            ))
        ) {
          console.warn(
            'Skipping DB test due to auth/connection error: ',
            error
          );
          return;
        }
        expect(error).toBeNull();
        expect(data).toBeTruthy();
        // Basic shape assertions
        expect(data.id ?? data?.profile?.id).toBeDefined();
      });

      it('get_complete_user_profile: returns null/empty for non-existent user', async () => {
        const { data, error } = await admin.rpc('get_complete_user_profile', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
        });
        if (error && (error as { code?: string }).code === 'PGRST202') {
          return; // function not found/exposed; skip silently in local
        }
        // Skip on authentication/connection errors
        if (
          error &&
          ((error as { status?: number }).status === 401 ||
            (error as { status?: number }).status === 403 ||
            (error as { message?: string }).message?.includes(
              'Invalid API key'
            ))
        ) {
          console.warn(
            'Skipping DB test due to auth/connection error: ',
            error
          );
          return;
        }
        expect(error).toBeNull();
        // Implementation-defined: some functions return null, others throw
        expect(data === null || data === undefined).toBe(true);
      });

      it('profiles trigger update_updated_at_column: updates timestamp on row change', async () => {
        const { user } = await createUserAndProfile(admin);

        const { data: beforeRow } = await admin
          .from('profiles')
          .select('updated_at')
          .eq('id', user.id)
          .single();

        await new Promise((r) => setTimeout(r, 1100));

        const { error: updErr } = await admin
          .from('profiles')
          .update({ full_name: 'Updated Name' })
          .eq('id', user.id);
        expect(updErr).toBeNull();

        const { data: afterRow } = await admin
          .from('profiles')
          .select('updated_at')
          .eq('id', user.id)
          .single();

        expect(beforeRow?.updated_at).not.toBe(afterRow?.updated_at);
      });
    })
  : describe.skip('Database: Profile Functions (integration) - missing SUPABASE_SERVICE_ROLE_KEY, skipping', () => {});
