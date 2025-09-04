import React from 'react';
import { FileText, Loader2, Save } from 'lucide-react';

interface EvaluationReportButtonProps {
  onGenerate: () => void;
  onSave: () => void;
  isLoading: boolean;
  hasReport: boolean;
  className?: string;
}

export const EvaluationReportButton: React.FC<EvaluationReportButtonProps> = ({
  onGenerate,
  onSave,
  isLoading,
  hasReport,
  className = '',
}) => {
  return (
    <div className={`flex justify-center p-4 ${className}`}>
      <button
        onClick={hasReport ? onSave : onGenerate}
        disabled={isLoading}
        className={`
          btn btn-primary btn-lg
          flex items-center gap-3
          px-8 py-4
          text-lg font-semibold
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${isLoading ? 'loading' : ''}
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>
              {hasReport
                ? 'Saving Evaluation Report...'
                : 'Generating Report...'}
            </span>
          </>
        ) : (
          <>
            {hasReport ? (
              <>
                <Save className="h-6 w-6" />
                <span>Save Evaluation Report</span>
              </>
            ) : (
              <>
                <FileText className="h-6 w-6" />
                <span>Generate Detailed Evaluation Report</span>
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
};
