/**
 * Budget System Monitoring
 *
 * This module provides monitoring and alerting functionality for the budget system.
 */

import {
  checkBudgetSystemHealth,
  getBudgetSystemMetrics,
} from './budget-health-check';

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface BudgetMonitoringData {
  health: Awaited<ReturnType<typeof checkBudgetSystemHealth>>;
  metrics: Awaited<ReturnType<typeof getBudgetSystemMetrics>>;
  alerts: BudgetAlert[];
  lastChecked: string;
}

/**
 * Monitor budget system and generate alerts
 */
export async function monitorBudgetSystem(): Promise<BudgetMonitoringData> {
  const health = await checkBudgetSystemHealth();
  const metrics = await getBudgetSystemMetrics();
  const alerts: BudgetAlert[] = [];

  // Generate alerts based on health status
  if (health.status === 'unhealthy') {
    alerts.push({
      id: `health-unhealthy-${Date.now()}`,
      type: 'error',
      message: 'Budget system is unhealthy',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  } else if (health.status === 'degraded') {
    alerts.push({
      id: `health-degraded-${Date.now()}`,
      type: 'warning',
      message: 'Budget system is degraded',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }

  // Generate alerts based on metrics
  if (metrics.totalSpent > metrics.averageBudget * 10) {
    alerts.push({
      id: `high-spending-${Date.now()}`,
      type: 'warning',
      message: 'Unusually high spending detected across users',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }

  // Generate alerts for specific health issues
  health.issues.forEach((issue, index) => {
    alerts.push({
      id: `health-issue-${index}-${Date.now()}`,
      type: 'error',
      message: issue,
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  });

  return {
    health,
    metrics,
    alerts,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check if budget system needs attention
 */
export async function needsAttention(): Promise<{
  needsAttention: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}> {
  const health = await checkBudgetSystemHealth();
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (health.status === 'unhealthy') {
    reasons.push('Budget system is unhealthy');
    severity = 'critical';
  } else if (health.status === 'degraded') {
    reasons.push('Budget system is degraded');
    severity = 'high';
  }

  if (health.issues.length > 0) {
    reasons.push(`${health.issues.length} system issues detected`);
    if (severity === 'low') severity = 'medium';
  }

  // Check for critical failures
  if (!health.checks.database) {
    reasons.push('Database connectivity issues');
    severity = 'critical';
  }

  if (!health.checks.authentication) {
    reasons.push('Authentication system issues');
    severity = 'critical';
  }

  return {
    needsAttention: reasons.length > 0,
    reasons,
    severity,
  };
}

/**
 * Get budget system status for dashboard
 */
export async function getBudgetSystemStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: string;
  lastError?: string;
  activeAlerts: number;
  totalUsers: number;
  totalSpent: number;
}> {
  try {
    const health = await checkBudgetSystemHealth();
    const metrics = await getBudgetSystemMetrics();
    const monitoring = await monitorBudgetSystem();

    return {
      status: health.status,
      uptime: metrics.systemUptime,
      lastError: health.issues[0] || undefined,
      activeAlerts: monitoring.alerts.filter((a) => !a.resolved).length,
      totalUsers: metrics.totalUsers,
      totalSpent: metrics.totalSpent,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      uptime: 'Unknown',
      lastError: `Status check failed: ${error}`,
      activeAlerts: 1,
      totalUsers: 0,
      totalSpent: 0,
    };
  }
}

/**
 * Log budget system event
 */
export function logBudgetEvent(
  event: string,
  details: Record<string, unknown> = {},
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
    service: 'budget-system',
  };

  // In a real application, this would send to a logging service
  console.log(`[Budget System] ${level.toUpperCase()}:`, logEntry);
}

/**
 * Performance monitoring for budget operations
 */
export class BudgetPerformanceMonitor {
  private static instance: BudgetPerformanceMonitor;
  private metrics: Map<
    string,
    { count: number; totalTime: number; avgTime: number }
  > = new Map();

  static getInstance(): BudgetPerformanceMonitor {
    if (!BudgetPerformanceMonitor.instance) {
      BudgetPerformanceMonitor.instance = new BudgetPerformanceMonitor();
    }
    return BudgetPerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
    };
    const updated = {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      avgTime: (existing.totalTime + duration) / (existing.count + 1),
    };

    this.metrics.set(operation, updated);

    // Log slow operations
    if (duration > 1000) {
      // More than 1 second
      logBudgetEvent('slow-operation', { operation, duration }, 'warn');
    }
  }

  getMetrics(): Record<
    string,
    { count: number; totalTime: number; avgTime: number }
  > {
    return Object.fromEntries(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Budget system watchdog - runs periodic health checks
 */
export class BudgetSystemWatchdog {
  private static instance: BudgetSystemWatchdog;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  static getInstance(): BudgetSystemWatchdog {
    if (!BudgetSystemWatchdog.instance) {
      BudgetSystemWatchdog.instance = new BudgetSystemWatchdog();
    }
    return BudgetSystemWatchdog.instance;
  }

  start(intervalMs: number = 60000): void {
    // Default 1 minute
    if (this.isRunning) {
      logBudgetEvent('watchdog-already-running', {}, 'warn');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        const attention = await needsAttention();
        if (attention.needsAttention) {
          logBudgetEvent(
            'budget-system-needs-attention',
            {
              severity: attention.severity,
              reasons: attention.reasons,
            },
            attention.severity === 'critical' ? 'error' : 'warn'
          );
        }
      } catch (error) {
        logBudgetEvent('watchdog-check-failed', { error }, 'error');
      }
    }, intervalMs);

    logBudgetEvent('budget-watchdog-started', { intervalMs }, 'info');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    logBudgetEvent('budget-watchdog-stopped', {}, 'info');
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
