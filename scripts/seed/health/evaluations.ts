/**
 * Health Evaluations Seed Script
 * Creates test health evaluation reports for users
 */

import { admin } from '../utils/client';
import { logSuccess, logError, findUserByEmail } from '../utils/shared';

/**
 * Main function to seed evaluation reports
 */
export async function seedEvaluationReports() {
  console.log('🚀 Starting evaluation reports seed...\n');

  // Get all users
  const { data: userList, error: userError } =
    await admin.auth.admin.listUsers();
  if (userError) {
    logError('Error fetching user list for evaluation reports:', userError);
    return;
  }

  // Sample evaluation reports
  const evaluationReports = [
    {
      userEmail: 'alice@example.com',
      reportId: 'eval_2025_01_15_alice_001',
      evaluationDate: '2025-01-15T10:00:00Z',
      dietitian: 'Dr. Luna Clearwater',
      reportVersion: 'v2.1',
      reportData: {
        summary:
          'Comprehensive nutritional assessment for vegetarian diet optimization',
        recommendations: [
          'Increase protein variety with legumes and quinoa',
          'Add vitamin B12 supplementation',
          'Include more iron-rich foods like spinach and lentils',
        ],
        restrictions: ['Avoid peanuts due to allergy'],
        goals: [
          'Maintain vegetarian diet',
          'Optimize protein intake',
          'Ensure micronutrient balance',
        ],
      },
    },
    {
      userEmail: 'bob@example.com',
      reportId: 'eval_2025_01_12_bob_001',
      evaluationDate: '2025-01-12T14:30:00Z',
      dietitian: 'Dr. Luna Clearwater',
      reportVersion: 'v2.1',
      reportData: {
        summary: 'Assessment for high-protein diet with grilling preferences',
        recommendations: [
          'Balance red meat with lean proteins',
          'Increase vegetable intake',
          'Consider heart-healthy cooking methods',
        ],
        restrictions: [],
        goals: [
          'Maintain muscle mass',
          'Support active lifestyle',
          'Improve heart health',
        ],
      },
    },
    {
      userEmail: 'david@example.com',
      reportId: 'eval_2025_01_10_david_001',
      evaluationDate: '2025-01-10T09:15:00Z',
      dietitian: 'Dr. Luna Clearwater',
      reportVersion: 'v2.1',
      reportData: {
        summary: 'Cultural cuisine integration with optimal nutrition',
        recommendations: [
          'Maintain traditional Korean fermented foods for gut health',
          'Balance sodium intake from traditional sauces',
          'Include more variety in vegetable preparations',
        ],
        restrictions: [],
        goals: [
          'Preserve cultural food traditions',
          'Optimize digestive health',
          'Balance modern nutrition',
        ],
      },
    },
  ];

  for (const report of evaluationReports) {
    // Find the user
    const user = findUserByEmail(userList.users, report.userEmail);
    if (!user) {
      logError(`User not found for evaluation report: ${report.userEmail}`);
      continue;
    }

    // Insert evaluation report
    const { error } = await admin.from('evaluation_reports').upsert(
      {
        user_id: user.id,
        report_id: report.reportId,
        evaluation_date: report.evaluationDate,
        dietitian: report.dietitian,
        report_version: report.reportVersion,
        report_data: report.reportData,
      },
      { onConflict: 'user_id,report_id' }
    );

    if (error) {
      logError(
        `Error seeding evaluation report for ${report.userEmail}:`,
        error
      );
    } else {
      logSuccess(
        `Evaluation report seeded for ${report.userEmail}: ${report.reportId}`
      );
    }
  }

  logSuccess('Evaluation reports seed completed successfully!');
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEvaluationReports().catch((err) => {
    logError('Evaluation reports seeding failed:', err);
    process.exit(1);
  });
}
