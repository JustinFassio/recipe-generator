import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TabProps, DeficiencyRisk } from '../types';

export function NutritionTab({ report }: TabProps) {
  return (
    <div>
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
                report.user_evaluation_report.nutritional_analysis
                  .current_status
              ).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(value)}%</span>
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
              {report.user_evaluation_report.nutritional_analysis.deficiency_risks.map(
                (risk: DeficiencyRisk, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
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
                      <span className="font-medium">{risk.nutrient}</span>
                    </div>
                    <p className="text-sm mb-2">
                      Current intake: {risk.current_intake_estimate}
                    </p>
                    <div className="text-xs">
                      <span className="font-medium">Food sources:</span>{' '}
                      {risk.food_sources?.join(', ') || 'None specified'}
                    </div>
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
