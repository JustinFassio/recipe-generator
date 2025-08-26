import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Production credentials
const supabaseUrl = 'https://sxvdkipywmjcitdhfpp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionPhotos() {
  console.log('🔍 Testing Production Photo Functionality...\n');

  try {
    // 1. Check if buckets exist
    console.log('1. Checking storage buckets...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(
      '✅ Buckets found:',
      buckets.map((b) => b.name)
    );

    // 2. Check RLS policies on buckets
    console.log('\n2. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'storage.objects');

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Storage policies found:', policies.length);
      policies.forEach((policy) => {
        console.log(`   - ${policy.policy_name}: ${policy.definition}`);
      });
    }

    // 3. Test file upload (create a test file)
    console.log('\n3. Testing file upload...');
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testContent = 'This is a test file for upload verification';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
    } else {
      console.log('✅ Upload successful:', uploadData.path);

      // 4. Test file download
      console.log('\n4. Testing file download...');
      const { data: downloadData, error: downloadError } =
        await supabase.storage.from('recipe-images').download(testFileName);

      if (downloadError) {
        console.error('❌ Download failed:', downloadError);
      } else {
        console.log('✅ Download successful');
      }

      // 5. Test file deletion
      console.log('\n5. Testing file deletion...');
      const { error: deleteError } = await supabase.storage
        .from('recipe-images')
        .remove([testFileName]);

      if (deleteError) {
        console.error('❌ Deletion failed:', deleteError);
      } else {
        console.log('✅ Deletion successful');
      }
    }

    // 6. Check bucket permissions
    console.log('\n6. Checking bucket permissions...');
    const { data: bucketInfo, error: bucketInfoError } =
      await supabase.storage.getBucket('recipe-images');

    if (bucketInfoError) {
      console.error('❌ Error getting bucket info:', bucketInfoError);
    } else {
      console.log('✅ Bucket info:', {
        name: bucketInfo.name,
        public: bucketInfo.public,
        file_size_limit: bucketInfo.file_size_limit,
        allowed_mime_types: bucketInfo.allowed_mime_types,
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProductionPhotos();
