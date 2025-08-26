import { createClient } from '@supabase/supabase-js';

// Production credentials
const supabaseUrl = 'https://sxvdkipywmjcitdhfpp.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmRraXB5d21qeWNpdGhkZnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgyMTMwNSwiZXhwIjoyMDcxMzk3MzA1fQ.hdQpuML-BDFl4CQhsVxUH3tlsuZsrDHf1kO9FAX9dTE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecipeImageUpload() {
  console.log('🔍 Testing Recipe Image Upload Functionality...\n');

  try {
    // 1. Get a test user
    console.log('1. Getting test user...');
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError || !users.users.length) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users.users[0];
    console.log(`✅ Using test user: ${testUser.email}`);

    // 2. Create a test recipe first
    console.log('\n2. Creating test recipe...');
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: 'Test Recipe for Image Upload',
        description: 'Testing image upload functionality',
        ingredients: ['Test ingredient'],
        instructions: ['Test instruction'],
        user_id: testUser.id,
        is_public: false,
      })
      .select()
      .single();

    if (recipeError) {
      console.error('❌ Error creating test recipe:', recipeError);
      return;
    }

    console.log(`✅ Created test recipe: ${recipe.id}`);

    // 3. Test image upload to recipe-images bucket
    console.log('\n3. Testing image upload...');
    const testImageName = `recipe-${recipe.id}-test-${Date.now()}.jpg`;
    const testImageContent = 'fake-image-data'; // Simulating image data

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(testImageName, testImageContent, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Image upload failed:', uploadError);
      console.log('🔍 Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
      });
    } else {
      console.log('✅ Image upload successful:', uploadData.path);

      // 4. Update recipe with image URL
      console.log('\n4. Updating recipe with image URL...');
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/recipe-images/${testImageName}`;

      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', recipe.id);

      if (updateError) {
        console.error('❌ Error updating recipe with image:', updateError);
      } else {
        console.log('✅ Recipe updated with image URL');
      }

      // 5. Test image download/access
      console.log('\n5. Testing image access...');
      const { data: imageData, error: imageError } = await supabase.storage
        .from('recipe-images')
        .download(testImageName);

      if (imageError) {
        console.error('❌ Image access failed:', imageError);
      } else {
        console.log('✅ Image access successful');
      }

      // 6. Clean up - delete test image and recipe
      console.log('\n6. Cleaning up test data...');
      const { error: deleteImageError } = await supabase.storage
        .from('recipe-images')
        .remove([testImageName]);

      if (deleteImageError) {
        console.error('❌ Error deleting test image:', deleteImageError);
      } else {
        console.log('✅ Test image deleted');
      }

      const { error: deleteRecipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);

      if (deleteRecipeError) {
        console.error('❌ Error deleting test recipe:', deleteRecipeError);
      } else {
        console.log('✅ Test recipe deleted');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRecipeImageUpload();
