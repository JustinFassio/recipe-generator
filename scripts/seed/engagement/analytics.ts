/**
 * Analytics Seed Script
 * Creates avatar analytics, recipe views, and engagement data
 */

import { admin } from '../utils/client';
import { logSuccess, logError, logInfo, findUserByEmail } from '../utils/shared';

// Avatar analytics data for users
const avatarAnalyticsData = [
  {
    userEmail: 'alice@example.com',
    analytics: {
      total_uploads: 12,
      successful_uploads: 11,
      failed_uploads: 1,
      total_size_bytes: 2456789,
      avg_file_size_bytes: 204732,
      compression_ratio: 0.65,
      unique_filenames: 11,
      upload_frequency_days: 3.2,
      last_upload_date: '2025-01-15T10:30:00Z',
      preferred_format: 'jpeg',
      usage_pattern: 'regular'
    }
  },
  {
    userEmail: 'bob@example.com',
    analytics: {
      total_uploads: 8,
      successful_uploads: 8,
      failed_uploads: 0,
      total_size_bytes: 3245678,
      avg_file_size_bytes: 405709,
      compression_ratio: 0.58,
      unique_filenames: 8,
      upload_frequency_days: 5.1,
      last_upload_date: '2025-01-14T16:20:00Z',
      preferred_format: 'jpeg',
      usage_pattern: 'moderate'
    }
  },
  {
    userEmail: 'cora@example.com',
    analytics: {
      total_uploads: 15,
      successful_uploads: 14,
      failed_uploads: 1,
      total_size_bytes: 4123456,
      avg_file_size_bytes: 274897,
      compression_ratio: 0.72,
      unique_filenames: 14,
      upload_frequency_days: 2.8,
      last_upload_date: '2025-01-16T09:15:00Z',
      preferred_format: 'jpeg',
      usage_pattern: 'frequent'
    }
  },
  {
    userEmail: 'david@example.com',
    analytics: {
      total_uploads: 6,
      successful_uploads: 5,
      failed_uploads: 1,
      total_size_bytes: 1876543,
      avg_file_size_bytes: 312757,
      compression_ratio: 0.63,
      unique_filenames: 5,
      upload_frequency_days: 7.2,
      last_upload_date: '2025-01-13T14:45:00Z',
      preferred_format: 'png',
      usage_pattern: 'occasional'
    }
  }
];

// Recipe views data (simulating user engagement)
const recipeViewsData = [
  // Popular public recipes get more views
  { recipeId: '11111111-1111-1111-1111-111111111111', views: 45 }, // Avocado Toast (public)
  { recipeId: '22222222-2222-2222-2222-222222222221', views: 38 }, // Caesar Salad (public)
  
  // Private recipes get fewer views (only from friends/shared)
  { recipeId: '11111111-1111-1111-1111-111111111112', views: 12 }, // Caprese Salad (private)
  { recipeId: '11111111-1111-1111-1111-111111111113', views: 18 }, // Quick Pasta (private)
  { recipeId: '11111111-1111-1111-1111-111111111114', views: 23 }, // Veggie Stir Fry (private)
];

/**
 * Seed avatar analytics data
 */
async function seedAvatarAnalytics() {
  logInfo('Seeding avatar analytics...');

  // Get all users for email lookup
  const { data: userList, error: userError } = await admin.auth.admin.listUsers();
  if (userError) {
    logError('Error fetching user list for analytics:', userError);
    return;
  }

  let insertedCount = 0;

  for (const analytics of avatarAnalyticsData) {
    // Find the user
    const user = findUserByEmail(userList.users, analytics.userEmail);
    if (!user) {
      logError(`User not found for analytics: ${analytics.userEmail}`);
      continue;
    }

    // Insert avatar analytics events using the correct JSONB structure
    const { error } = await admin.from('avatar_analytics').insert({
      event_type: 'upload',
      event_data: analytics.analytics,
      user_id: user.id,
    });

    if (error) {
      logError(`Error inserting analytics for ${analytics.userEmail}:`, error);
    } else {
      insertedCount++;
    }
  }

  // Create summary analytics using the correct JSONB structure
  const totalUploads = avatarAnalyticsData.reduce((sum, a) => sum + a.analytics.total_uploads, 0);
  const totalSize = avatarAnalyticsData.reduce((sum, a) => sum + a.analytics.total_size_bytes, 0);
  const avgCompression = avatarAnalyticsData.reduce((sum, a) => sum + a.analytics.compression_ratio, 0) / avatarAnalyticsData.length;

  const summaryData = {
    total_users_with_uploads: insertedCount,
    total_uploads_all_users: totalUploads,
    total_storage_used_bytes: totalSize,
    average_compression_ratio: avgCompression,
    last_calculated: new Date().toISOString(),
  };

  const { error: summaryError } = await admin.from('avatar_analytics_summary').insert({
    analytics_data: summaryData,
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    period_end: new Date().toISOString(),
  });

  if (summaryError) {
    logError('Error creating analytics summary:', summaryError);
  }

  logInfo(`  ✓ Added analytics for ${insertedCount} users`);
}

/**
 * Seed recipe views data
 */
async function seedRecipeViews() {
  logInfo('Seeding recipe views...');

  // Get all users for realistic view distribution
  const { data: userList, error: userError } = await admin.auth.admin.listUsers();
  if (userError) {
    logError('Error fetching user list for recipe views:', userError);
    return;
  }

  let insertedCount = 0;

  for (const view of recipeViewsData) {
    // Create multiple view records to simulate realistic viewing patterns
    const viewsToCreate = Math.min(view.views, 20); // Cap at 20 for performance
    
    for (let i = 0; i < viewsToCreate; i++) {
      // Pick a random user for this view
      const randomUser = userList.users[Math.floor(Math.random() * userList.users.length)];
      
      // Create view with random timestamp in the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const viewedAt = new Date();
      viewedAt.setDate(viewedAt.getDate() - daysAgo);
      viewedAt.setHours(viewedAt.getHours() - hoursAgo);

      const { error } = await admin.from('recipe_views').insert({
        recipe_id: view.recipeId,
        version_number: 1, // Most views will be on version 1
        user_id: randomUser.id,
        viewed_at: viewedAt.toISOString(),
      });

      if (error) {
        logError(`Error inserting view for recipe ${view.recipeId}:`, error);
        break;
      } else {
        insertedCount++;
      }
    }
  }

  logInfo(`  ✓ Added ${insertedCount} recipe views`);
}

/**
 * Main function to seed all analytics
 */
export async function seedAnalyticsData() {
  console.log('🚀 Starting analytics data seed...\n');

  await seedAvatarAnalytics();
  await seedRecipeViews();

  // Calculate some statistics
  const totalViews = recipeViewsData.reduce((sum, r) => sum + r.views, 0);
  const totalAnalytics = avatarAnalyticsData.length;

  logSuccess('Analytics data seed completed!');
  logInfo(`  • Avatar analytics: ${totalAnalytics} users`);
  logInfo(`  • Recipe views: ${totalViews} total views across ${recipeViewsData.length} recipes`);
  logInfo(`  • Analytics summary: Generated aggregate statistics`);
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAnalyticsData().catch((err) => {
    logError('Analytics seeding failed:', err);
    process.exit(1);
  });
}
