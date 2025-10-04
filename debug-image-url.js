#!/usr/bin/env node

// Debug script to test getSafeImageUrl function
import { getSafeImageUrl } from './src/lib/image-cache-utils.ts';

const testCases = [
  {
    name: 'Supabase URL',
    url: 'https://sxvdkipywmjycithdfpp.supabase.co/storage/v1/object/public/recipe-images/576def01-9f93-410c-95e5-aa613a54f7c1/1759154189701-hk11yb.jpg',
    updatedAt: '2025-10-02 02:49:08.558821+00',
    createdAt: '2025-09-29 13:54:55.470618+00',
  },
  {
    name: 'Local fallback URL',
    url: '/recipe-generator-logo.png',
    updatedAt: '2025-10-04 15:31:50.165032+00',
    createdAt: '2025-09-27 14:36:24.599297+00',
  },
  {
    name: 'DALL-E URL (should be expired)',
    url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/abc123',
    updatedAt: '2025-01-01 00:00:00+00',
    createdAt: '2025-01-01 00:00:00+00',
  },
];

console.log('Testing getSafeImageUrl function...\n');

testCases.forEach((testCase) => {
  console.log(`\n${testCase.name}:`);
  console.log(`  Input URL: ${testCase.url}`);

  const result = getSafeImageUrl(
    testCase.url,
    testCase.updatedAt,
    testCase.createdAt,
    '/recipe-generator-logo.png'
  );

  console.log(`  Result: ${result}`);
  console.log(`  Is truthy: ${!!result}`);
});
