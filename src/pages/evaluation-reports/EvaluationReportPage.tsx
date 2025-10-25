import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getUserEvaluationReports,
  deleteEvaluationReport,
  exportEvaluationReport,
} from '@/lib/evaluation-report-db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, BookOpen, RefreshCw } from 'lucide-react';

// Import components
import { ReportsList } from './components/ReportsList';
import { ReportActions } from './components/ReportActions';
import { TabNavigation } from './components/TabNavigation';
import { OverviewTab } from './components/OverviewTab';
import { SafetyTab } from './components/SafetyTab';
import { PersonalizationTab } from './components/PersonalizationTab';
import { NutritionTab } from './components/NutritionTab';
import { RecommendationsTab } from './components/RecommendationsTab';
import { ProgressTab } from './components/ProgressTab';
import { RawContentTab } from './components/RawContentTab';

// Import types and utilities
import type { EvaluationReport, TabType } from './types';
import { formatDate, isFallbackReport } from './utils';

export default function EvaluationReportPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EvaluationReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const loadUserReports = useCallback(async () => {
    try {
      if (user?.id) {
        const userReports = await getUserEvaluationReports(user.id);
        setReports(userReports);
        if (userReports.length > 0) {
          setSelectedReport(userReports[0]);
        }
      }
    } catch (error) {
      console.error('Error loading evaluation reports:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadUserReports();
    }
  }, [user?.id, loadUserReports]);

  // Handle refresh parameter from navigation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && user?.id) {
      // Force reload reports when coming from report generation
      setLoading(true);
      loadUserReports();

      // Clean up the URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('refresh');
      const searchParamsString = newSearchParams.toString();
      const newUrl = `${window.location.pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, user?.id, loadUserReports]);

  const downloadReport = (report: EvaluationReport) => {
    try {
      exportEvaluationReport(report);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const shareReport = async (report: EvaluationReport) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Health Evaluation Report',
          text: `Health evaluation report by ${report.user_evaluation_report.dietitian}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDeleteReport = async (report: EvaluationReport) => {
    if (
      user?.id &&
      window.confirm(
        'Are you sure you want to delete this evaluation report? This action cannot be undone.'
      )
    ) {
      try {
        const success = await deleteEvaluationReport(
          user.id,
          report.user_evaluation_report.report_id
        );
        if (success) {
          await loadUserReports();
          if (selectedReport === report) {
            setSelectedReport(null);
          }
        }
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  // Reset active tab when report changes
  useEffect(() => {
    setActiveTab('overview');
  }, [selectedReport]);

  const renderTabContent = () => {
    if (!selectedReport) return null;

    if (isFallbackReport(selectedReport)) {
      return <RawContentTab report={selectedReport} />;
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab report={selectedReport} />;
      case 'safety':
        return <SafetyTab report={selectedReport} />;
      case 'personalization':
        return <PersonalizationTab report={selectedReport} />;
      case 'nutrition':
        return <NutritionTab report={selectedReport} />;
      case 'recommendations':
        return <RecommendationsTab report={selectedReport} />;
      case 'progress':
        return <ProgressTab report={selectedReport} />;
      default:
        return <OverviewTab report={selectedReport} />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading evaluation reports...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Health Evaluation Reports
            </h2>
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Evaluation Reports Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                You haven't completed a health evaluation with Dr. Luna
                Clearwater yet.
              </p>
              <Button asChild>
                <Link to="/coach-chat?persona=drLunaClearwater">
                  Start Health Evaluation
                </Link>
              </Button>
              <Button asChild variant="outline" className="ml-2">
                <Link to="/health-coaches">Browse Health Coaches</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-2">Health Evaluation Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive health assessments and personalized recommendations
            from Dr. Luna Clearwater
          </p>
        </div>
        <div className="mt-1">
          <Button asChild variant="outline">
            <Link to="/health-coaches">Browse Health Coaches</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ReportsList
          reports={reports}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
        />

        <div className="lg:col-span-3">
          {selectedReport && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="card-title flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Health Evaluation Report
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated by{' '}
                      {selectedReport.user_evaluation_report.dietitian} on{' '}
                      {formatDate(
                        selectedReport.user_evaluation_report.evaluation_date
                      )}
                    </p>
                    {isFallbackReport(selectedReport) ? (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Raw Report Format
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <ReportActions
                    report={selectedReport}
                    onDownload={downloadReport}
                    onShare={shareReport}
                    onDelete={handleDeleteReport}
                  />
                </div>

                {isFallbackReport(selectedReport) ? (
                  <RawContentTab report={selectedReport} />
                ) : (
                  <>
                    <TabNavigation
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                    {renderTabContent()}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
