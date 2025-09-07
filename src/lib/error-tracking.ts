// Advanced error tracking and alerting system
export interface ErrorEvent {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  category: 'database' | 'auth' | 'api' | 'ui' | 'network' | 'performance';
  message: string;
  details: {
    error?: unknown;
    context?: Record<string, unknown>;
    userAgent?: string;
    url?: string;
    userId?: string;
    stackTrace?: string;
  };
  resolved: boolean;
  count: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    category?: string;
    level?: string;
    errorRate?: number; // Errors per minute
    timeWindow?: number; // Minutes
  };
  actions: Array<{
    type: 'console' | 'email' | 'webhook';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
}

class ErrorTracker {
  private errors: Map<string, ErrorEvent> = new Map();
  private alertRules: AlertRule[] = [];
  private alertHistory: Array<{
    ruleId: string;
    timestamp: number;
    triggered: boolean;
  }> = [];
  private maxErrors = 1000; // Maximum errors to keep in memory

  constructor() {
    this.setupDefaultAlertRules();
    this.setupGlobalErrorHandlers();
  }

  // Track an error event
  trackError(
    level: ErrorEvent['level'],
    category: ErrorEvent['category'],
    message: string,
    details: ErrorEvent['details'] = {}
  ): string {
    // Create unique error ID based on message and stack trace
    const errorKey = this.generateErrorKey(message, details.stackTrace);
    const existingError = this.errors.get(errorKey);

    if (existingError) {
      // Increment count for recurring error
      existingError.count++;
      existingError.timestamp = Date.now();
      existingError.resolved = false;
    } else {
      // Create new error entry
      const errorEvent: ErrorEvent = {
        id: errorKey,
        timestamp: Date.now(),
        level,
        category,
        message,
        details: {
          ...details,
          userAgent: navigator?.userAgent,
          url: window?.location?.href,
        },
        resolved: false,
        count: 1,
      };

      this.errors.set(errorKey, errorEvent);
    }

    // Check alert rules
    this.checkAlertRules(level, category);

    // Clean up old errors if we have too many
    this.cleanupOldErrors();

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const errorEvent = this.errors.get(errorKey)!;
      this.logError(errorEvent);
    }

    return errorKey;
  }

  // Generate consistent error key for deduplication
  private generateErrorKey(message: string, stackTrace?: string): string {
    const baseKey = message.substring(0, 100); // First 100 chars of message
    const stackKey = stackTrace
      ? stackTrace.split('\n')[0]?.substring(0, 50) || ''
      : ''; // First line of stack

    // Safely encode Unicode strings for base64.
    // Wrap in try/catch in case btoa is unavailable or throws.
    try {
      const safeString = unescape(encodeURIComponent(baseKey + stackKey));
      return btoa(safeString).substring(0, 16); // Base64 encoded, truncated
    } catch {
      // Fallback: simple non-cryptographic hash to ensure a stable key
      const input = `${baseKey}|${stackKey}`;
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      // Ensure positive and format as hex; pad to keep key length consistent enough
      const hex = (hash >>> 0).toString(16).padStart(8, '0');
      return hex.substring(0, 16);
    }
  }

  // Setup default alert rules
  private setupDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: {
          level: 'error',
          errorRate: 5, // 5 errors per minute
          timeWindow: 5,
        },
        actions: [{ type: 'console', config: { level: 'error' } }],
        enabled: true,
      },
      {
        id: 'database-errors',
        name: 'Database Errors',
        condition: {
          category: 'database',
          level: 'error',
          errorRate: 2,
          timeWindow: 5,
        },
        actions: [{ type: 'console', config: { level: 'error' } }],
        enabled: true,
      },
      {
        id: 'auth-failures',
        name: 'Authentication Failures',
        condition: {
          category: 'auth',
          level: 'error',
          errorRate: 3,
          timeWindow: 5,
        },
        actions: [{ type: 'console', config: { level: 'warn' } }],
        enabled: true,
      },
      {
        id: 'performance-issues',
        name: 'Performance Issues',
        condition: {
          category: 'performance',
          level: 'warning',
          errorRate: 10,
          timeWindow: 5,
        },
        actions: [{ type: 'console', config: { level: 'warn' } }],
        enabled: true,
      },
    ];
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('error', 'ui', event.message, {
        error: event.error,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stackTrace: event.error?.stack,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('error', 'api', 'Unhandled Promise Rejection', {
        error: event.reason,
        stackTrace: event.reason?.stack,
      });
    });

    // Catch React errors (if using error boundary)
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__ERROR_TRACKER__ = this;
    }
  }

  // Check if any alert rules should be triggered
  private checkAlertRules(
    level: ErrorEvent['level'],
    category: ErrorEvent['category']
  ) {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check if rule conditions match
      if (rule.condition.level && rule.condition.level !== level) continue;
      if (rule.condition.category && rule.condition.category !== category)
        continue;

      // Check error rate within time window
      if (rule.condition.errorRate && rule.condition.timeWindow) {
        const windowStart = now - rule.condition.timeWindow * 60 * 1000;
        const recentErrors = Array.from(this.errors.values()).filter(
          (error) =>
            error.timestamp >= windowStart &&
            (!rule.condition.level || error.level === rule.condition.level) &&
            (!rule.condition.category ||
              error.category === rule.condition.category)
        );

        const errorCount = recentErrors.reduce(
          (sum, error) => sum + error.count,
          0
        );
        const errorRate = errorCount / rule.condition.timeWindow;

        if (errorRate >= rule.condition.errorRate) {
          this.triggerAlert(rule, {
            errorRate,
            errorCount,
            timeWindow: rule.condition.timeWindow,
            recentErrors: recentErrors.slice(0, 5), // Include first 5 errors
          });
        }
      }
    }
  }

  // Trigger an alert
  private triggerAlert(rule: AlertRule, context: Record<string, unknown>) {
    // Check if we've already alerted for this rule recently (prevent spam)
    const recentAlert = this.alertHistory.find(
      (alert) =>
        alert.ruleId === rule.id && alert.timestamp > Date.now() - 5 * 60 * 1000 // Within last 5 minutes
    );

    if (recentAlert) return;

    // Record alert
    this.alertHistory.push({
      ruleId: rule.id,
      timestamp: Date.now(),
      triggered: true,
    });

    // Execute alert actions
    for (const action of rule.actions) {
      this.executeAlertAction(action, rule, context);
    }
  }

  // Execute an alert action
  private executeAlertAction(
    action: AlertRule['actions'][0],
    rule: AlertRule,
    context: Record<string, unknown>
  ) {
    switch (action.type) {
      case 'console': {
        const level = action.config.level || 'error';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (console as any)[level as string](`🚨 ALERT: ${rule.name}`, {
          rule: rule.name,
          condition: rule.condition,
          context,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'email':
        // Email alerting would require backend integration
        console.warn(
          'Email alerting not implemented - requires backend service'
        );
        break;

      case 'webhook':
        // Webhook alerting
        if (action.config.url) {
          fetch(action.config.url as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alert: rule.name,
              level: 'error',
              context,
              timestamp: Date.now(),
            }),
          }).catch((error) => {
            console.error('Webhook alert failed:', error);
          });
        }
        break;
    }
  }

  // Clean up old errors to prevent memory issues
  private cleanupOldErrors() {
    if (this.errors.size <= this.maxErrors) return;

    // Convert to array and sort by timestamp
    const errorArray = Array.from(this.errors.entries()).sort(
      ([, a], [, b]) => b.timestamp - a.timestamp
    );

    // Keep only the most recent errors
    const toKeep = errorArray.slice(0, this.maxErrors);

    this.errors.clear();
    toKeep.forEach(([key, error]) => {
      this.errors.set(key, error);
    });
  }

  // Log error to console with formatting
  private logError(error: ErrorEvent) {
    const emoji = {
      error: '🔴',
      warning: '🟡',
      info: '🔵',
    }[error.level];

    const category = error.category.toUpperCase();

    console.group(`${emoji} ${category} [${error.count}x]`);
    console.error(error.message);
    if (error.details.error) {
      console.error('Error Details:', error.details.error);
    }
    if (error.details.context) {
      console.log('Context:', error.details.context);
    }
    if (error.details.stackTrace) {
      console.trace('Stack Trace:', error.details.stackTrace);
    }
    console.groupEnd();
  }

  // Get error summary for monitoring
  getErrorSummary(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByLevel: Record<string, number>;
    topErrors: ErrorEvent[];
    recentErrors: ErrorEvent[];
    errorRate: number; // Errors per minute in last hour
  } {
    const errors = Array.from(this.errors.values());
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Count errors by category and level
    const errorsByCategory: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};

    errors.forEach((error) => {
      errorsByCategory[error.category] =
        (errorsByCategory[error.category] || 0) + error.count;
      errorsByLevel[error.level] =
        (errorsByLevel[error.level] || 0) + error.count;
    });

    // Get top errors by count
    const topErrors = errors.sort((a, b) => b.count - a.count).slice(0, 10);

    // Get recent errors
    const recentErrors = errors
      .filter((error) => error.timestamp > oneHourAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    // Calculate error rate (errors per minute in last hour)
    const recentErrorCount = recentErrors.reduce(
      (sum, error) => sum + error.count,
      0
    );
    const errorRate = recentErrorCount / 60; // Per minute

    return {
      totalErrors: errors.reduce((sum, error) => sum + error.count, 0),
      errorsByCategory,
      errorsByLevel,
      topErrors,
      recentErrors,
      errorRate,
    };
  }

  // Mark an error as resolved
  resolveError(errorId: string) {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
    }
  }

  // Get specific error details
  getError(errorId: string): ErrorEvent | undefined {
    return this.errors.get(errorId);
  }

  // Add custom alert rule
  addAlertRule(rule: AlertRule) {
    this.alertRules.push(rule);
  }

  // Update alert rule
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex((rule) => rule.id === ruleId);
    if (ruleIndex >= 0) {
      this.alertRules[ruleIndex] = {
        ...this.alertRules[ruleIndex],
        ...updates,
      };
    }
  }

  // Get all alert rules
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Helper functions for easy error tracking
export const trackDatabaseError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) => {
  return errorTracker.trackError('error', 'database', message, {
    error,
    context,
  });
};

export const trackAuthError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) => {
  return errorTracker.trackError('error', 'auth', message, { error, context });
};

export const trackAPIError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) => {
  return errorTracker.trackError('error', 'api', message, { error, context });
};

export const trackPerformanceWarning = (
  message: string,
  context?: Record<string, unknown>
) => {
  return errorTracker.trackError('warning', 'performance', message, {
    context,
  });
};

export const trackUIError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) => {
  return errorTracker.trackError('error', 'ui', message, { error, context });
};

// React Error Boundary integration
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string
  ) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

export const trackReactError = (
  error: Error,
  errorInfo: { componentStack?: string }
) => {
  return errorTracker.trackError('error', 'ui', error.message, {
    error,
    context: { componentStack: errorInfo.componentStack },
    stackTrace: error.stack,
  });
};
