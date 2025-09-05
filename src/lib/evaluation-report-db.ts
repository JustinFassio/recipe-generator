/**
 * Evaluation Report Database Operations
 *
 * Handles saving and retrieving evaluation reports from Supabase database.
 * This replaces the localStorage-based storage for better persistence and sharing.
 */

import { supabase } from '@/lib/supabase';
import type { EvaluationReport } from './evaluation-report-storage';

export interface DatabaseEvaluationReport {
  id: string;
  user_id: string;
  report_id: string;
  evaluation_date: string;
  dietitian: string;
  report_version: string;
  report_data: EvaluationReport['user_evaluation_report'];
  created_at: string;
  updated_at: string;
}

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
