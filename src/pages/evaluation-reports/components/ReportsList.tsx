import { Button } from '@/components/ui/button';
import { formatDate } from '../utils';
import type { EvaluationReport } from '../types';

interface ReportsListProps {
  reports: EvaluationReport[];
  selectedReport: EvaluationReport | null;
  onSelectReport: (report: EvaluationReport) => void;
}

export function ReportsList({
  reports,
  selectedReport,
  onSelectReport,
}: ReportsListProps) {
  return (
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
                onClick={() => onSelectReport(report)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">Report #{index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.user_evaluation_report.evaluation_date)}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
