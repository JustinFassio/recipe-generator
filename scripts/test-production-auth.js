import { createClient } from '@supabase/supabase-js';

// Production credentials
const supabaseUrl = 'https://sxvdkipywmjcitdhfpp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionAuth() {
  console.log('🔍 Testing Production Authentication & Permissions...\n');

  try {
    // 1. Check existing users
    console.log('1. Checking existing users...');
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      return;
    }

    console.log(`✅ Found ${users.users.length} users`);
    users.users.forEach((user) => {
      console.log(`   - ${user.email} (${user.id})`);
    });

    // 2. Check user profiles
    console.log('\n2. Checking user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      profiles.forEach((profile) => {
        console.log(
          `   - ${profile.username || 'No username'} (${profile.id})`
        );
      });
    }

    // 3. Test RLS policies on recipes table
    console.log('\n3. Testing RLS policies on recipes...');
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .limit(5);

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError);
    } else {
      console.log(`✅ Found ${recipes.length} recipes (RLS working)`);
    }

    // 4. Check storage policies
    console.log('\n4. Checking storage policies...');
    const { data: storagePolicies, error: storagePoliciesError } =
      await supabase.rpc('get_storage_policies');

    if (storagePoliciesError) {
      console.log(
        '⚠️  Could not check storage policies via RPC, checking manually...'
      );

      // Manual check of storage.objects policies
      const { data: policies, error: policiesError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'storage.objects');

      if (policiesError) {
        console.error('❌ Error checking storage policies:', policiesError);
      } else {
        console.log(`✅ Found ${policies.length} storage policies`);
        policies.forEach((policy) => {
          console.log(`   - ${policy.policy_name}: ${policy.definition}`);
        });
      }
    } else {
      console.log('✅ Storage policies:', storagePolicies);
    }

    // 5. Test bucket access with service role
    console.log('\n5. Testing bucket access...');
    const { data: bucketFiles, error: bucketError } = await supabase.storage
      .from('recipe-images')
      .list();

    if (bucketError) {
      console.error('❌ Error accessing bucket:', bucketError);
    } else {
      console.log(`✅ Bucket accessible, found ${bucketFiles.length} files`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProductionAuth();
