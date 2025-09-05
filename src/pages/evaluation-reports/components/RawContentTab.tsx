import { BookOpen } from 'lucide-react';
import type { TabProps } from '../types';

export function RawContentTab({ report }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="alert alert-info">
        <BookOpen className="h-4 w-4" />
        <div>
          <h3 className="font-bold">Raw Report Content</h3>
          <div className="text-xs">
            This report was saved in raw format. The structured view will be
            available after completing the full health evaluation.
          </div>
        </div>
      </div>
      <div className="bg-muted p-4 rounded-lg">
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {((report.user_evaluation_report as Record<string, unknown>)
            .raw_content as string) || 'No content available'}
        </pre>
      </div>
    </div>
  );
}
