import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function makeRecipesPublic() {
  try {
    // Get all recipes
    const { data: recipes, error } = await supabase.from('recipes').select('*');

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }

    if (!recipes || recipes.length === 0) {
      console.log('No recipes found to make public.');
      return;
    }

    // Make the first few recipes public
    const recipesToMakePublic = recipes.slice(0, 3);

    for (const recipe of recipesToMakePublic) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ is_public: true })
        .eq('id', recipe.id);

      if (updateError) {
        console.error(`Error making recipe ${recipe.id} public:`, updateError);
      } else {
        console.log(`✅ Made recipe "${recipe.title}" public`);
      }
    }

    console.log(
      `\n✅ Made ${recipesToMakePublic.length} recipes public for testing.`
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

makeRecipesPublic();
