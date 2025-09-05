import { Target } from 'lucide-react';
import type { TabProps } from '../types';

export function PersonalizationTab({ report }: TabProps) {
  return (
    <div>
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
                      report.user_evaluation_report.personalization_matrix
                        .skill_profile.current_level
                    }
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${report.user_evaluation_report.personalization_matrix.skill_profile.confidence_score}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Confidence:{' '}
                  {
                    report.user_evaluation_report.personalization_matrix
                      .skill_profile.confidence_score
                  }
                  %
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Growth:</span>{' '}
                {
                  report.user_evaluation_report.personalization_matrix
                    .skill_profile.growth_trajectory
                }
              </div>
              <div className="text-sm">
                <span className="font-medium">Timeline:</span>{' '}
                {
                  report.user_evaluation_report.personalization_matrix
                    .skill_profile.advancement_timeline
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
                      report.user_evaluation_report.personalization_matrix
                        .time_analysis.available_time_per_meal
                    }{' '}
                    min
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${report.user_evaluation_report.personalization_matrix.time_analysis.time_utilization_efficiency}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Efficiency:{' '}
                  {
                    report.user_evaluation_report.personalization_matrix
                      .time_analysis.time_utilization_efficiency
                  }
                  %
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Quick meals:</span>{' '}
                {
                  report.user_evaluation_report.personalization_matrix
                    .time_analysis.quick_meal_quota
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
