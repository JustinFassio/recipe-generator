// Re-export types from the consolidated evaluation report types
export type {
  EvaluationReport,
  DeficiencyRisk,
  ImmediateAction,
  CriticalAlert,
  DietaryRestriction,
  KeyMetric,
  MilestoneMarker,
} from '@/lib/evaluation-report-types';

// Additional types specific to the evaluation reports page
export type TabType =
  | 'overview'
  | 'safety'
  | 'personalization'
  | 'nutrition'
  | 'recommendations'
  | 'progress';

import type { EvaluationReport } from '@/lib/evaluation-report-types';

export interface TabProps {
  report: EvaluationReport;
}

export interface ReportActionsProps {
  report: EvaluationReport;
  onDownload: (report: EvaluationReport) => void;
  onShare: (report: EvaluationReport) => void;
  onDelete: (report: EvaluationReport) => void;
}
