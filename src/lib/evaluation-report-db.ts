/**
 * Evaluation Report Database Operations
 *
 * Handles saving and retrieving evaluation reports from Supabase database.
 * This replaces the localStorage-based storage for better persistence and sharing.
 */

import { supabase } from '@/lib/supabase';
import type {
  EvaluationReport,
  DatabaseEvaluationReport,
} from './evaluation-report-types';

/**
 * Save an evaluation report to the database
 */
export const saveEvaluationReportToDB = async (
  userId: string,
  report: EvaluationReport
): Promise<DatabaseEvaluationReport> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_reports')
      .upsert({
        user_id: userId,
        report_id: report.user_evaluation_report.report_id,
        evaluation_date: report.user_evaluation_report.evaluation_date,
        dietitian: report.user_evaluation_report.dietitian,
        report_version: report.user_evaluation_report.report_version,
        report_data: report.user_evaluation_report,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving evaluation report to database:', error);
      throw new Error(`Failed to save evaluation report: ${error.message}`);
    }

    console.log(
      `Evaluation report saved to database for user ${userId}:`,
      report.user_evaluation_report.report_id
    );

    return data;
  } catch (error) {
    console.error('Error saving evaluation report to database:', error);
    throw new Error('Failed to save evaluation report to database');
  }
};

/**
 * Get all evaluation reports for a user from the database
 */
export const getUserEvaluationReportsFromDB = async (
  userId: string
): Promise<EvaluationReport[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_reports')
      .select('*')
      .eq('user_id', userId)
      .order('evaluation_date', { ascending: false });

    if (error) {
      console.error('Error loading evaluation reports from database:', error);
      throw new Error(`Failed to load evaluation reports: ${error.message}`);
    }

    // Convert database format to EvaluationReport format
    const reports: EvaluationReport[] = data.map((dbReport) => ({
      user_evaluation_report: dbReport.report_data,
    }));

    return reports;
  } catch (error) {
    console.error('Error loading evaluation reports from database:', error);
    return [];
  }
};

/**
 * Get a specific evaluation report by ID from the database
 */
export const getEvaluationReportByIdFromDB = async (
  userId: string,
  reportId: string
): Promise<EvaluationReport | null> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error loading evaluation report from database:', error);
      throw new Error(`Failed to load evaluation report: ${error.message}`);
    }

    return {
      user_evaluation_report: data.report_data,
    };
  } catch (error) {
    console.error('Error loading evaluation report from database:', error);
    return null;
  }
};

/**
 * Delete an evaluation report from the database
 */
export const deleteEvaluationReportFromDB = async (
  userId: string,
  reportId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('evaluation_reports')
      .delete()
      .eq('user_id', userId)
      .eq('report_id', reportId);

    if (error) {
      console.error('Error deleting evaluation report from database:', error);
      throw new Error(`Failed to delete evaluation report: ${error.message}`);
    }

    console.log(
      `Evaluation report deleted from database for user ${userId}:`,
      reportId
    );
    return true;
  } catch (error) {
    console.error('Error deleting evaluation report from database:', error);
    return false;
  }
};

/**
 * Check if a user has any evaluation reports in the database
 */
export const hasEvaluationReportsInDB = async (
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_reports')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking evaluation reports in database:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking evaluation reports in database:', error);
    return false;
  }
};

/**
 * Get the most recent evaluation report for a user from the database
 */
export const getLatestEvaluationReportFromDB = async (
  userId: string
): Promise<EvaluationReport | null> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_reports')
      .select('*')
      .eq('user_id', userId)
      .order('evaluation_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error(
        'Error loading latest evaluation report from database:',
        error
      );
      throw new Error(
        `Failed to load latest evaluation report: ${error.message}`
      );
    }

    return {
      user_evaluation_report: data.report_data,
    };
  } catch (error) {
    console.error(
      'Error loading latest evaluation report from database:',
      error
    );
    return null;
  }
};

/**
 * Clear all evaluation reports for a user from the database
 */
export const clearAllEvaluationReportsFromDB = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('evaluation_reports')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing evaluation reports from database:', error);
      return false;
    }

    console.log(
      `All evaluation reports cleared from database for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error('Error clearing evaluation reports from database:', error);
    return false;
  }
};

// High-level functions with localStorage fallback for compatibility

/**
 * Save an evaluation report with localStorage fallback
 */
export const saveEvaluationReport = async (
  userId: string,
  report: EvaluationReport
): Promise<void> => {
  try {
    // Try to save to database first
    await saveEvaluationReportToDB(userId, report);

    // Also save to localStorage as backup
    const storageKey = `evaluation_reports_${userId}`;
    const existingReports = localStorage.getItem(storageKey);

    let reports: EvaluationReport[] = [];
    if (existingReports) {
      reports = JSON.parse(existingReports);
    }

    // Check if this report already exists (by report_id)
    const existingIndex = reports.findIndex(
      (r) =>
        r.user_evaluation_report.report_id ===
        report.user_evaluation_report.report_id
    );

    if (existingIndex >= 0) {
      // Update existing report
      reports[existingIndex] = report;
    } else {
      // Add new report
      reports.push(report);
    }

    // Sort by evaluation date (newest first)
    reports.sort(
      (a, b) =>
        new Date(b.user_evaluation_report.evaluation_date).getTime() -
        new Date(a.user_evaluation_report.evaluation_date).getTime()
    );

    localStorage.setItem(storageKey, JSON.stringify(reports));

    console.log(
      `Evaluation report saved for user ${userId}:`,
      report.user_evaluation_report.report_id
    );
  } catch (error) {
    console.error('Error saving evaluation report:', error);
    throw new Error('Failed to save evaluation report');
  }
};

/**
 * Get all evaluation reports for a user with localStorage fallback
 */
export const getUserEvaluationReports = async (
  userId: string
): Promise<EvaluationReport[]> => {
  try {
    // Try to get from database first
    const dbReports = await getUserEvaluationReportsFromDB(userId);

    if (dbReports.length > 0) {
      return dbReports;
    }

    // Fallback to localStorage
    const storageKey = `evaluation_reports_${userId}`;
    const storedReports = localStorage.getItem(storageKey);

    if (!storedReports) {
      return [];
    }

    const reports: EvaluationReport[] = JSON.parse(storedReports);

    // Sort by evaluation date (newest first)
    return reports.sort(
      (a, b) =>
        new Date(b.user_evaluation_report.evaluation_date).getTime() -
        new Date(a.user_evaluation_report.evaluation_date).getTime()
    );
  } catch (error) {
    console.error('Error loading evaluation reports:', error);
    return [];
  }
};

/**
 * Get a specific evaluation report by ID with localStorage fallback
 */
export const getEvaluationReportById = async (
  userId: string,
  reportId: string
): Promise<EvaluationReport | null> => {
  try {
    // Try to get from database first
    const dbReport = await getEvaluationReportByIdFromDB(userId, reportId);
    if (dbReport) {
      return dbReport;
    }

    // Fallback to localStorage
    const reports = await getUserEvaluationReports(userId);
    return (
      reports.find(
        (report) => report.user_evaluation_report.report_id === reportId
      ) || null
    );
  } catch (error) {
    console.error('Error loading evaluation report:', error);
    return null;
  }
};

/**
 * Delete an evaluation report with localStorage cleanup
 */
export const deleteEvaluationReport = async (
  userId: string,
  reportId: string
): Promise<boolean> => {
  try {
    // Try to delete from database first
    const dbSuccess = await deleteEvaluationReportFromDB(userId, reportId);

    // Also delete from localStorage
    const storageKey = `evaluation_reports_${userId}`;
    const existingReports = localStorage.getItem(storageKey);

    if (existingReports) {
      let reports: EvaluationReport[] = JSON.parse(existingReports);
      reports = reports.filter(
        (report) => report.user_evaluation_report.report_id !== reportId
      );
      localStorage.setItem(storageKey, JSON.stringify(reports));
    }

    console.log(`Evaluation report deleted for user ${userId}:`, reportId);
    return dbSuccess;
  } catch (error) {
    console.error('Error deleting evaluation report:', error);
    return false;
  }
};

/**
 * Clear all evaluation reports for a user from both database and localStorage
 */
export const clearAllEvaluationReports = async (
  userId: string
): Promise<boolean> => {
  try {
    // Clear from database first
    const dbSuccess = await clearAllEvaluationReportsFromDB(userId);

    // Clear from localStorage
    const storageKey = `evaluation_reports_${userId}`;
    localStorage.removeItem(storageKey);

    if (dbSuccess) {
      console.log(`All evaluation reports cleared for user ${userId}`);
      return true;
    } else {
      console.warn(
        `Database clear failed, but localStorage cleared for user ${userId}`
      );
      return false;
    }
  } catch (error) {
    console.error('Error clearing evaluation reports:', error);
    return false;
  }
};

/**
 * Check if a user has any evaluation reports
 */
export const hasEvaluationReports = async (
  userId: string
): Promise<boolean> => {
  try {
    // Try database first
    const dbHasReports = await hasEvaluationReportsInDB(userId);
    if (dbHasReports) {
      return true;
    }

    // Fallback to localStorage
    const reports = await getUserEvaluationReports(userId);
    return reports.length > 0;
  } catch (error) {
    console.error('Error checking evaluation reports:', error);
    return false;
  }
};

/**
 * Get the most recent evaluation report for a user
 */
export const getLatestEvaluationReport = async (
  userId: string
): Promise<EvaluationReport | null> => {
  try {
    // Try database first
    const dbReport = await getLatestEvaluationReportFromDB(userId);
    if (dbReport) {
      return dbReport;
    }

    // Fallback to localStorage
    const reports = await getUserEvaluationReports(userId);
    return reports.length > 0 ? reports[0] : null;
  } catch (error) {
    console.error('Error getting latest evaluation report:', error);
    return null;
  }
};

/**
 * Export evaluation report as JSON file
 */
export const exportEvaluationReport = (
  report: EvaluationReport,
  filename?: string
): void => {
  try {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download =
      filename ||
      `evaluation_report_${report.user_evaluation_report.report_id}.json`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting evaluation report:', error);
    throw new Error('Failed to export evaluation report');
  }
};

/**
 * Import evaluation report from JSON file
 */
export const importEvaluationReport = async (
  file: File
): Promise<EvaluationReport> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const report: EvaluationReport = JSON.parse(content);

          // Basic validation
          if (
            !report.user_evaluation_report ||
            !report.user_evaluation_report.report_id
          ) {
            throw new Error('Invalid evaluation report format');
          }

          resolve(report);
        } catch (parseError) {
          console.error('Error parsing evaluation report JSON:', parseError);
          reject(
            new Error(
              `Invalid JSON file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    } catch (fileError) {
      console.error('Error processing evaluation report file:', fileError);
      reject(
        new Error(
          `Failed to process file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        )
      );
    }
  });
};
