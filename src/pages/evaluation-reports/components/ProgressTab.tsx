import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TabProps, KeyMetric, MilestoneMarker } from '../types';

export function ProgressTab({ report }: TabProps) {
  return (
    <div>
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
              {report.user_evaluation_report.progress_tracking.key_metrics.map(
                (metric: KeyMetric, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">{metric.metric}</div>
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
              {report.user_evaluation_report.progress_tracking.milestone_markers.map(
                (milestone: MilestoneMarker, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    {Object.entries(milestone).map(([week, marker]) => (
                      <div key={week} className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{week}</Badge>
                        <span className="text-sm">{String(marker)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
