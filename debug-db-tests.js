import {
  shouldRunDbTests,
  createDbClient,
} from './src/__tests__/database/_utils/dbClient.ts';

console.log('shouldRunDbTests():', shouldRunDbTests());

if (shouldRunDbTests()) {
  const supabase = createDbClient('service');
  console.log('Created service client');

  const { data, error } = await supabase
    .from('recipes')
    .select('categories')
    .limit(1);

  console.log('Error:', error);
  console.log('Data:', data);
} else {
  console.log('Database tests should be skipped');
}
