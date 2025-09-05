// Re-export types from the main evaluation report storage
export type { EvaluationReport } from '@/lib/evaluation-report-storage';

// Additional types specific to the evaluation reports page
export type TabType =
  | 'overview'
  | 'safety'
  | 'personalization'
  | 'nutrition'
  | 'recommendations'
  | 'progress';

// Type definitions for evaluation report data structures
export interface DeficiencyRisk {
  nutrient: string;
  risk_level: string;
  current_intake_estimate: string;
  food_sources: string[];
  supplementation_consideration: string;
}

export interface ImmediateAction {
  action: string;
  description: string;
  expected_benefit: string;
  difficulty: string;
  resources_provided: string[];
}

export interface CriticalAlert {
  type: string;
  severity: string;
  item: string;
  required_action: string;
  hidden_sources: string[];
  cross_contamination_risk: string;
}

export interface DietaryRestriction {
  type: string;
  severity: string;
  tolerance_threshold: string;
  safe_alternatives: string[];
  enzyme_supplementation: string;
}

export interface KeyMetric {
  metric: string;
  baseline: string;
  target: string;
  reassessment: string;
}

export interface MilestoneMarker {
  [week: string]: string;
}

export interface TabProps {
  report: import('@/lib/evaluation-report-storage').EvaluationReport;
}

export interface ReportActionsProps {
  report: import('@/lib/evaluation-report-storage').EvaluationReport;
  onDownload: (
    report: import('@/lib/evaluation-report-storage').EvaluationReport
  ) => void;
  onShare: (
    report: import('@/lib/evaluation-report-storage').EvaluationReport
  ) => void;
  onDelete: (
    report: import('@/lib/evaluation-report-storage').EvaluationReport
  ) => void;
}
