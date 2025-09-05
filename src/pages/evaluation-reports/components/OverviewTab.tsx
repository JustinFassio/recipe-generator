import { User, ArrowRight, BookOpen } from 'lucide-react';
import type { TabProps } from '../types';

export function OverviewTab({ report }: TabProps) {
  return (
    <div>
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
                report.user_evaluation_report.user_profile_summary
                  .evaluation_completeness
              }
              %
            </div>
            <div className="text-sm text-muted-foreground">Completeness</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {
                report.user_evaluation_report.user_profile_summary
                  .data_quality_score
              }
              %
            </div>
            <div className="text-sm text-muted-foreground">Data Quality</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {report.user_evaluation_report.report_metadata
                ?.confidence_level || 85}
              %
            </div>
            <div className="text-sm text-muted-foreground">Confidence</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {report.user_evaluation_report.report_metadata
                ?.data_completeness || 100}
              %
            </div>
            <div className="text-sm text-muted-foreground">Data Complete</div>
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
          {report.user_evaluation_report.next_steps?.immediate_72_hours?.map(
            (step: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-muted rounded"
              >
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{step}</span>
              </div>
            )
          ) || (
            <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
              Next steps will be available after completing the health
              evaluation.
            </div>
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
              {report.user_evaluation_report.professional_notes
                ?.strengths_observed ||
                'Professional assessment will be available after completing the health evaluation.'}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Growth Opportunities</h4>
            <p className="text-sm text-muted-foreground">
              {report.user_evaluation_report.professional_notes
                ?.growth_opportunities ||
                'Growth opportunities will be identified after completing the health evaluation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
