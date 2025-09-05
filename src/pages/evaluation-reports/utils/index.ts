import type { EvaluationReport } from '@/lib/evaluation-report-types';

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDifficultyColor = (difficulty: string) => {
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

export const isFallbackReport = (report: EvaluationReport) => {
  const reportData = report.user_evaluation_report as Record<string, unknown>;

  return (
    reportData.report_type === 'fallback_text' ||
    reportData.report_type === 'multi_part_text' ||
    reportData.raw_content
  );
};
