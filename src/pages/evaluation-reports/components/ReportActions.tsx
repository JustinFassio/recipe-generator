import { Button } from '@/components/ui/button';
import { Download, Share2, Trash2 } from 'lucide-react';
import type { ReportActionsProps } from '../types';

export function ReportActions({
  report,
  onDownload,
  onShare,
  onDelete,
}: ReportActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onDownload(report)}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      <Button variant="outline" size="sm" onClick={() => onShare(report)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(report)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
