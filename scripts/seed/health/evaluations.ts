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

    // Build structured user_evaluation_report payload expected by the app
    const isAlice = report.userEmail === 'alice@example.com';
    const user_evaluation_report = {
      report_id: report.reportId,
      evaluation_date: report.evaluationDate,
      dietitian: report.dietitian,
      report_version: report.reportVersion,
      // Minimal viable structure with fallback content so UI tabs render
      user_profile_summary: {
        user_id: user.id,
        evaluation_completeness: 100,
        data_quality_score: 85,
        last_updated: new Date().toISOString(),
      },
      safety_assessment: isAlice
        ? {
            status: 'VERIFIED',
            critical_alerts: [
              {
                type: 'allergen',
                severity: 'high',
                item: 'Peanuts',
                required_action:
                  'Strict avoidance. Check labels for peanut derivatives and cross-contamination warnings.',
                hidden_sources: ['Sauces', 'Confections', 'Baked goods'],
                cross_contamination_risk: 'high',
              },
            ],
            dietary_restrictions: [
              {
                type: 'vegetarian',
                severity: 'medium',
                tolerance_threshold: 'No meat; allow eggs/dairy as tolerated',
                safe_alternatives: ['Legumes', 'Tofu', 'Tempeh'],
                enzyme_supplementation: 'None',
              },
            ],
            medical_considerations: [],
          }
        : {
            status: 'VERIFIED',
            critical_alerts: [],
            dietary_restrictions: [],
            medical_considerations: [],
          },
      personalization_matrix: {
        skill_profile: {
          current_level: 'intermediate',
          confidence_score: 80,
          growth_trajectory: 'steady',
          advancement_timeline: '3 months',
        },
        time_analysis: {
          available_time_per_meal: 30,
          time_utilization_efficiency: 70,
          quick_meal_quota: '3/week',
        },
        equipment_optimization: {},
        cultural_preferences: {},
        ingredient_landscape: {},
      },
      nutritional_analysis: {
        current_status: {
          overall_diet_quality_score: 75,
          nutritional_completeness: 70,
          anti_inflammatory_index: 65,
          gut_health_score: 60,
          metabolic_health_score: 68,
        },
        deficiency_risks: [],
        optimization_priorities: [],
      },
      personalized_recommendations: {
        immediate_actions: (report.reportData?.recommendations || []).map(
          (r: string) => ({
            action: r,
            description: r,
            difficulty: 'easy',
            expected_benefit: 'incremental',
          })
        ),
        weekly_structure: {
          meal_framework: {
            breakfast_template: 'Protein + Fiber + Healthy Fat',
            lunch_template: 'Grains + Vegetables + Protein',
            dinner_template: 'Balanced Plate',
            snack_strategy: 'High-protein, nutrient-dense snacks',
          },
          cuisine_rotation: {
            monday: 'Mediterranean',
            tuesday: 'Mexican',
            wednesday: 'Asian',
            thursday: 'Italian',
            friday: 'Comfort',
            saturday: 'Flexible',
            sunday: 'Batch Cooking',
          },
        },
        progressive_challenges: [],
      },
      progress_tracking: isAlice
        ? {
            key_metrics: [
              {
                metric: 'Fiber intake',
                baseline: '18 g/day',
                target: '25–30 g/day',
                reassessment: '4 weeks',
              },
              {
                metric: 'Protein variety (weekly)',
                baseline: '2 sources',
                target: '5+ sources',
                reassessment: '4 weeks',
              },
            ],
            milestone_markers: [
              { 'Week 2': 'Consistent breakfast protein + 1 new legume' },
              { 'Week 4': 'Fiber at 25 g/day; 3 new protein sources' },
              { 'Week 8': 'Stable variety with minimal cravings' },
            ],
          }
        : {
            key_metrics: [],
            milestone_markers: [],
          },
      next_steps: {
        immediate_72_hours: [
          'Hydrate consistently',
          'Plan 3 balanced meals',
          'Set sleep schedule',
        ],
        week_1_goals: [],
        month_1_objectives: [],
      },
      professional_notes: {
        strengths_observed:
          report.reportData?.summary || 'Structured seed report',
        growth_opportunities:
          'Diversify protein sources and micronutrient density',
        collaboration_recommendations: 'Follow-up in 4 weeks',
        reassessment_schedule: '4-6 weeks',
      },
      report_metadata: {
        confidence_level: 85,
        data_completeness: 100,
        personalization_depth: 'high',
        evidence_base: 'strong',
        last_literature_review: new Date().toISOString().split('T')[0],
        next_update_recommended: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
    };

    // Insert evaluation report with correct schema
    const { error } = await admin.from('evaluation_reports').upsert(
      {
        user_id: user.id,
        report_id: report.reportId,
        evaluation_date: report.evaluationDate,
        dietitian: report.dietitian,
        report_version: report.reportVersion,
        report_data: user_evaluation_report,
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
