import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDifficultyColor } from '../utils';
import type { TabProps, ImmediateAction } from '../types';

export function RecommendationsTab({ report }: TabProps) {
  return (
    <div>
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
              {report.user_evaluation_report.personalized_recommendations.immediate_actions.map(
                (action: ImmediateAction, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getDifficultyColor(action.difficulty)}>
                        {action.difficulty}
                      </Badge>
                      <span className="font-medium">{action.action}</span>
                    </div>
                    <p className="text-sm mb-2">{action.description}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Expected benefit: {action.expected_benefit}
                    </p>
                    <div className="text-xs">
                      <span className="font-medium">Resources:</span>{' '}
                      {Array.isArray(action.resources_provided)
                        ? action.resources_provided.length > 0
                          ? action.resources_provided.join(', ')
                          : 'None specified'
                        : 'None specified'}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Weekly Structure */}
          <div>
            <h4 className="font-medium mb-3">Weekly Meal Framework</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Meal Templates</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Breakfast:</span>{' '}
                    {
                      report.user_evaluation_report.personalized_recommendations
                        .weekly_structure.meal_framework.breakfast_template
                    }
                  </div>
                  <div>
                    <span className="font-medium">Lunch:</span>{' '}
                    {
                      report.user_evaluation_report.personalized_recommendations
                        .weekly_structure.meal_framework.lunch_template
                    }
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{' '}
                    {
                      report.user_evaluation_report.personalized_recommendations
                        .weekly_structure.meal_framework.dinner_template
                    }
                  </div>
                  <div>
                    <span className="font-medium">Snacks:</span>{' '}
                    {
                      report.user_evaluation_report.personalized_recommendations
                        .weekly_structure.meal_framework.snack_strategy
                    }
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Cuisine Rotation</h5>
                <div className="space-y-2 text-sm">
                  {Object.entries(
                    report.user_evaluation_report.personalized_recommendations
                      .weekly_structure.cuisine_rotation
                  ).map(([day, cuisine]) => (
                    <div key={day}>
                      <span className="font-medium capitalize">{day}:</span>{' '}
                      {String(cuisine)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
