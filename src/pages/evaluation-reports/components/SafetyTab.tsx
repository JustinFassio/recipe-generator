import { Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TabProps, CriticalAlert, DietaryRestriction } from '../types';

export function SafetyTab({ report }: TabProps) {
  return (
    <div>
      {/* Safety Assessment */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safety Assessment
        </h3>
        <div className="space-y-4">
          {/* Critical Alerts */}
          {report.user_evaluation_report.safety_assessment.critical_alerts
            .length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                Critical Alerts
              </h4>
              <div className="space-y-2">
                {report.user_evaluation_report.safety_assessment.critical_alerts.map(
                  (alert: CriticalAlert, index: number) => (
                    <div
                      key={index}
                      className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <Badge variant="destructive">{alert.severity}</Badge>
                        <Badge variant="outline">{alert.type}</Badge>
                      </div>
                      <p className="font-medium mb-1">{alert.item}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.required_action}
                      </p>
                      <div className="text-xs">
                        <span className="font-medium">Hidden sources:</span>{' '}
                        {Array.isArray(alert.hidden_sources)
                          ? alert.hidden_sources.length > 0
                            ? alert.hidden_sources.join(', ')
                            : 'None specified'
                          : 'None specified'}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Dietary Restrictions */}
          {report.user_evaluation_report.safety_assessment.dietary_restrictions
            .length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Dietary Restrictions</h4>
              <div className="space-y-2">
                {report.user_evaluation_report.safety_assessment.dietary_restrictions.map(
                  (restriction: DietaryRestriction, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {restriction.severity}
                        </Badge>
                        <Badge variant="outline">{restriction.type}</Badge>
                      </div>
                      <p className="text-sm mb-2">
                        Tolerance: {restriction.tolerance_threshold}
                      </p>
                      <div className="text-xs">
                        <span className="font-medium">Safe alternatives:</span>{' '}
                        {Array.isArray(restriction.safe_alternatives)
                          ? restriction.safe_alternatives.length > 0
                            ? restriction.safe_alternatives.join(', ')
                            : 'None specified'
                          : 'None specified'}
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
  );
}
