#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugUsernameIssues() {
  console.log('🔍 Debugging Username Issues\n');

  // 1. Check database schema
  console.log('1. Checking database schema...');
  try {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, username, full_name, created_at, updated_at')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log('✅ Profiles table structure:');
      console.table(profiles);
    }

    const { data: usernames, error: usernamesError } = await admin
      .from('usernames')
      .select('username, user_id, created_at, updated_at')
      .limit(5);

    if (usernamesError) {
      console.error('❌ Error fetching usernames:', usernamesError);
    } else {
      console.log('✅ Usernames table structure:');
      console.table(usernames);
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }

  // 2. Check RPC functions
  console.log('\n2. Checking RPC functions...');
  try {
    // Test is_username_available function
    const { data: available, error: availableError } = await admin.rpc(
      'is_username_available',
      { check_username: 'testuser' }
    );

    if (availableError) {
      console.error('❌ is_username_available function error:', availableError);
    } else {
      console.log('✅ is_username_available function works:', available);
    }

    // Test update_username_atomic function (with a test user)
    const { data: users } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (users.users.length > 0) {
      const testUserId = users.users[0].id;
      const { data: updateResult, error: updateError } = await admin.rpc(
        'update_username_atomic',
        { p_user_id: testUserId, p_new_username: 'testuser123' }
      );

      if (updateError) {
        console.error('❌ update_username_atomic function error:', updateError);
      } else {
        console.log('✅ update_username_atomic function works:', updateResult);
      }
    }
  } catch (error) {
    console.error('❌ RPC function check failed:', error);
  }

  // 3. Check RLS policies
  console.log('\n3. Checking RLS policies...');
  try {
    const { error: policiesError } = await admin
      .from('profiles')
      .select('*')
      .limit(1);

    if (policiesError) {
      console.error('❌ RLS policy check failed:', policiesError);
    } else {
      console.log('✅ RLS policies allow read access');
    }
  } catch (error) {
    console.error('❌ RLS check failed:', error);
  }

  // 4. Check user authentication
  console.log('\n4. Checking user authentication...');
  try {
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser();

    if (authError) {
      console.log('ℹ️  No authenticated user (expected for admin script)');
    } else {
      console.log('✅ User authenticated:', user?.id);
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }

  // 5. Environment info
  console.log('\n5. Environment information...');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SERVICE_ROLE_KEY exists:', !!SERVICE_ROLE_KEY);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  console.log('\n✅ Debug complete!');
}

debugUsernameIssues().catch((error) => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
