import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getUserEvaluationReports,
  deleteEvaluationReport,
  exportEvaluationReport,
  type EvaluationReport,
} from '@/lib/evaluation-report-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export default function EvaluationReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EvaluationReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadUserReports = useCallback(async () => {
    try {
      if (user?.id) {
        const userReports = getUserEvaluationReports(user.id);
        setReports(userReports);
        if (userReports.length > 0) {
          setSelectedReport(userReports[0]);
        }
      }
    } catch (error) {
      console.error('Error loading evaluation reports:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadUserReports();
    }
  }, [user?.id, loadUserReports]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'default';
      case 'moderate':
        return 'secondary';
      case 'challenging':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const downloadReport = (report: EvaluationReport) => {
    try {
      exportEvaluationReport(report);
    } catch (error) {
      console.error('Error downloading report:', error);
      // You could add a toast notification here
    }
  };

  const shareReport = async (report: EvaluationReport) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Health Evaluation Report',
          text: `Health evaluation report by ${report.user_evaluation_report.dietitian}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const handleDeleteReport = (report: EvaluationReport) => {
    if (
      user?.id &&
      window.confirm(
        'Are you sure you want to delete this evaluation report? This action cannot be undone.'
      )
    ) {
      try {
        const success = deleteEvaluationReport(
          user.id,
          report.user_evaluation_report.report_id
        );
        if (success) {
          // Reload reports
          loadUserReports();
          // Clear selection if this was the selected report
          if (selectedReport === report) {
            setSelectedReport(null);
          }
        }
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  // Handle tab switching
  useEffect(() => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    const switchTab = (tabName: string) => {
      // Hide all tab contents
      tabContents.forEach((content) => {
        content.classList.add('hidden');
      });

      // Remove active state from all tabs
      tabs.forEach((tab) => {
        tab.classList.remove('tab-active');
      });

      // Show selected tab content and activate tab
      const selectedContent = document.querySelector(`[data-tab="${tabName}"]`);
      const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);

      if (selectedContent) {
        selectedContent.classList.remove('hidden');
      }
      if (selectedTab) {
        selectedTab.classList.add('tab-active');
      }
    };

    // Add click event listeners to tabs
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
          switchTab(tabName);
        }
      });
    });

    // Show first tab by default
    if (tabs.length > 0) {
      const firstTab = tabs[0];
      const firstTabName = firstTab.getAttribute('data-tab');
      if (firstTabName) {
        switchTab(firstTabName);
      }
    }

    // Cleanup event listeners
    return () => {
      tabs.forEach((tab) => {
        tab.removeEventListener('click', () => {});
      });
    };
  }, [selectedReport]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading evaluation reports...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Health Evaluation Reports
            </h2>
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Evaluation Reports Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                You haven't completed a health evaluation with Dr. Luna
                Clearwater yet.
              </p>
              <Button asChild>
                <a href="/chat">Start Health Evaluation</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Health Evaluation Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive health assessments and personalized recommendations from
          Dr. Luna Clearwater
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg">Your Reports</h3>
              <div className="space-y-2">
                {reports.map((report, index) => (
                  <Button
                    key={report.user_evaluation_report.report_id}
                    variant={selectedReport === report ? 'default' : 'ghost'}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Report #{index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          report.user_evaluation_report.evaluation_date
                        )}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {selectedReport && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="card-title flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Health Evaluation Report
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated by{' '}
                      {selectedReport.user_evaluation_report.dietitian} on{' '}
                      {formatDate(
                        selectedReport.user_evaluation_report.evaluation_date
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(selectedReport)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareReport(selectedReport)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReport(selectedReport)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="tabs tabs-boxed mb-6">
                  <a className="tab tab-lifted" data-tab="overview">
                    Overview
                  </a>
                  <a className="tab tab-lifted" data-tab="safety">
                    Safety
                  </a>
                  <a className="tab tab-lifted" data-tab="personalization">
                    Personalization
                  </a>
                  <a className="tab tab-lifted" data-tab="nutrition">
                    Nutrition
                  </a>
                  <a className="tab tab-lifted" data-tab="recommendations">
                    Recommendations
                  </a>
                  <a className="tab tab-lifted" data-tab="progress">
                    Progress
                  </a>
                </div>

                <div className="tab-content" data-tab="overview">
                  {/* Profile Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {
                            selectedReport.user_evaluation_report
                              .user_profile_summary.evaluation_completeness
                          }
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completeness
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {
                            selectedReport.user_evaluation_report
                              .user_profile_summary.data_quality_score
                          }
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Data Quality
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {
                            selectedReport.user_evaluation_report
                              .report_metadata.confidence_level
                          }
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confidence
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {
                            selectedReport.user_evaluation_report
                              .report_metadata.data_completeness
                          }
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Data Complete
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      Immediate Next Steps (72 Hours)
                    </h3>
                    <div className="space-y-2">
                      {selectedReport.user_evaluation_report.next_steps.immediate_72_hours.map(
                        (step, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded"
                          >
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>{step}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Professional Notes */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Professional Assessment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Strengths Observed</h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            selectedReport.user_evaluation_report
                              .professional_notes.strengths_observed
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">
                          Growth Opportunities
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            selectedReport.user_evaluation_report
                              .professional_notes.growth_opportunities
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tab-content hidden" data-tab="safety">
                  {/* Safety Assessment */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Safety Assessment
                    </h3>
                    <div className="space-y-4">
                      {/* Critical Alerts */}
                      {selectedReport.user_evaluation_report.safety_assessment
                        .critical_alerts.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-destructive">
                            Critical Alerts
                          </h4>
                          <div className="space-y-2">
                            {selectedReport.user_evaluation_report.safety_assessment.critical_alerts.map(
                              (alert, index) => (
                                <div
                                  key={index}
                                  className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <Badge variant="destructive">
                                      {alert.severity}
                                    </Badge>
                                    <Badge variant="outline">
                                      {alert.type}
                                    </Badge>
                                  </div>
                                  <p className="font-medium mb-1">
                                    {alert.item}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {alert.required_action}
                                  </p>
                                  <div className="text-xs">
                                    <span className="font-medium">
                                      Hidden sources:
                                    </span>{' '}
                                    {alert.hidden_sources.join(', ')}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dietary Restrictions */}
                      {selectedReport.user_evaluation_report.safety_assessment
                        .dietary_restrictions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Dietary Restrictions
                          </h4>
                          <div className="space-y-2">
                            {selectedReport.user_evaluation_report.safety_assessment.dietary_restrictions.map(
                              (restriction, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary">
                                      {restriction.severity}
                                    </Badge>
                                    <Badge variant="outline">
                                      {restriction.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mb-2">
                                    Tolerance: {restriction.tolerance_threshold}
                                  </p>
                                  <div className="text-xs">
                                    <span className="font-medium">
                                      Safe alternatives:
                                    </span>{' '}
                                    {restriction.safe_alternatives.join(', ')}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tab-content hidden" data-tab="personalization">
                  {/* Personalization Matrix */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Personalization Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Skill Profile */}
                      <div>
                        <h4 className="font-medium mb-3">Skill Profile</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Level</span>
                              <span className="font-medium">
                                {
                                  selectedReport.user_evaluation_report
                                    .personalization_matrix.skill_profile
                                    .current_level
                                }
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${selectedReport.user_evaluation_report.personalization_matrix.skill_profile.confidence_score}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Confidence:{' '}
                              {
                                selectedReport.user_evaluation_report
                                  .personalization_matrix.skill_profile
                                  .confidence_score
                              }
                              %
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Growth:</span>{' '}
                            {
                              selectedReport.user_evaluation_report
                                .personalization_matrix.skill_profile
                                .growth_trajectory
                            }
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Timeline:</span>{' '}
                            {
                              selectedReport.user_evaluation_report
                                .personalization_matrix.skill_profile
                                .advancement_timeline
                            }
                          </div>
                        </div>
                      </div>

                      {/* Time Analysis */}
                      <div>
                        <h4 className="font-medium mb-3">Time Analysis</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Available Time</span>
                              <span className="font-medium">
                                {
                                  selectedReport.user_evaluation_report
                                    .personalization_matrix.time_analysis
                                    .available_time_per_meal
                                }{' '}
                                min
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${selectedReport.user_evaluation_report.personalization_matrix.time_analysis.time_utilization_efficiency}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Efficiency:{' '}
                              {
                                selectedReport.user_evaluation_report
                                  .personalization_matrix.time_analysis
                                  .time_utilization_efficiency
                              }
                              %
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Quick meals:</span>{' '}
                            {
                              selectedReport.user_evaluation_report
                                .personalization_matrix.time_analysis
                                .quick_meal_quota
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tab-content hidden" data-tab="nutrition">
                  {/* Nutritional Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Nutritional Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Status */}
                      <div>
                        <h4 className="font-medium mb-3">Current Status</h4>
                        <div className="space-y-3">
                          {Object.entries(
                            selectedReport.user_evaluation_report
                              .nutritional_analysis.current_status
                          ).map(([key, value]) => (
                            <div key={key}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium">{value}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deficiency Risks */}
                      <div>
                        <h4 className="font-medium mb-3">Deficiency Risks</h4>
                        <div className="space-y-2">
                          {selectedReport.user_evaluation_report.nutritional_analysis.deficiency_risks.map(
                            (risk, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      risk.risk_level === 'high'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                  >
                                    {risk.risk_level}
                                  </Badge>
                                  <span className="font-medium">
                                    {risk.nutrient}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">
                                  Current intake: {risk.current_intake_estimate}
                                </p>
                                <div className="text-xs">
                                  <span className="font-medium">
                                    Food sources:
                                  </span>{' '}
                                  {risk.food_sources.join(', ')}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tab-content hidden" data-tab="recommendations">
                  {/* Personalized Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      Personalized Recommendations
                    </h3>
                    <div className="space-y-6">
                      {/* Immediate Actions */}
                      <div>
                        <h4 className="font-medium mb-3">Immediate Actions</h4>
                        <div className="space-y-3">
                          {selectedReport.user_evaluation_report.personalized_recommendations.immediate_actions.map(
                            (action, index) => (
                              <div
                                key={index}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={getDifficultyColor(
                                      action.difficulty
                                    )}
                                  >
                                    {action.difficulty}
                                  </Badge>
                                  <span className="font-medium">
                                    {action.action}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">
                                  {action.description}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Expected benefit: {action.expected_benefit}
                                </p>
                                <div className="text-xs">
                                  <span className="font-medium">
                                    Resources:
                                  </span>{' '}
                                  {action.resources_provided.join(', ')}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Weekly Structure */}
                      <div>
                        <h4 className="font-medium mb-3">
                          Weekly Meal Framework
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2">Meal Templates</h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Breakfast:</span>{' '}
                                {
                                  selectedReport.user_evaluation_report
                                    .personalized_recommendations
                                    .weekly_structure.meal_framework
                                    .breakfast_template
                                }
                              </div>
                              <div>
                                <span className="font-medium">Lunch:</span>{' '}
                                {
                                  selectedReport.user_evaluation_report
                                    .personalized_recommendations
                                    .weekly_structure.meal_framework
                                    .lunch_template
                                }
                              </div>
                              <div>
                                <span className="font-medium">Dinner:</span>{' '}
                                {
                                  selectedReport.user_evaluation_report
                                    .personalized_recommendations
                                    .weekly_structure.meal_framework
                                    .dinner_template
                                }
                              </div>
                              <div>
                                <span className="font-medium">Snacks:</span>{' '}
                                {
                                  selectedReport.user_evaluation_report
                                    .personalized_recommendations
                                    .weekly_structure.meal_framework
                                    .snack_strategy
                                }
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">
                              Cuisine Rotation
                            </h5>
                            <div className="space-y-2 text-sm">
                              {Object.entries(
                                selectedReport.user_evaluation_report
                                  .personalized_recommendations.weekly_structure
                                  .cuisine_rotation
                              ).map(([day, cuisine]) => (
                                <div key={day}>
                                  <span className="font-medium capitalize">
                                    {day}:
                                  </span>{' '}
                                  {cuisine}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tab-content hidden" data-tab="progress">
                  {/* Progress Tracking */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Progress Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Key Metrics */}
                      <div>
                        <h4 className="font-medium mb-3">Key Metrics</h4>
                        <div className="space-y-3">
                          {selectedReport.user_evaluation_report.progress_tracking.key_metrics.map(
                            (metric, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg"
                              >
                                <div className="font-medium mb-1">
                                  {metric.metric}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Baseline: {metric.baseline}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Target: {metric.target}
                                </div>
                                <div className="text-xs">
                                  Reassessment: {metric.reassessment}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Milestone Markers */}
                      <div>
                        <h4 className="font-medium mb-3">Milestone Markers</h4>
                        <div className="space-y-3">
                          {selectedReport.user_evaluation_report.progress_tracking.milestone_markers.map(
                            (milestone, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg"
                              >
                                {Object.entries(milestone).map(
                                  ([week, marker]) => (
                                    <div
                                      key={week}
                                      className="flex items-center gap-2 mb-2"
                                    >
                                      <Badge variant="outline">{week}</Badge>
                                      <span className="text-sm">{marker}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
