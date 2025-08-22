/**
 * Logger utility for controlled logging in development and production
 * Respects environment variables to control log output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
}

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  if (import.meta.env.DEV) {
    return 'debug';
  }
  // In production, only show warnings and errors by default
  return 'warn';
};

const config: LoggerConfig = {
  level: getLogLevel(),
  enableDebug: getLogLevel() === 'debug',
  enableInfo: ['debug', 'info'].includes(getLogLevel()),
  enableWarn: ['debug', 'info', 'warn'].includes(getLogLevel()),
  enableError: true, // Always enable error logging
};

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (config.enableDebug) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (config.enableInfo) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (config.enableWarn) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (config.enableError) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Convenience method for auth-related logging
  auth(message: string, ...args: unknown[]): void {
    this.debug(`🔐 ${message}`, ...args);
  }

  // Convenience method for database-related logging
  db(message: string, ...args: unknown[]): void {
    this.debug(`🗃️ ${message}`, ...args);
  }

  // Convenience method for user-related logging
  user(message: string, ...args: unknown[]): void {
    this.debug(`👤 ${message}`, ...args);
  }

  // Convenience method for success logging
  success(message: string, ...args: unknown[]): void {
    this.info(`✅ ${message}`, ...args);
  }

  // Convenience method for failure logging
  failure(message: string, ...args: unknown[]): void {
    this.warn(`❌ ${message}`, ...args);
  }
}

// Create default logger instance
export const logger = new Logger();

// Create logger factory for components with specific prefixes
export const createLogger = (prefix: string): Logger => new Logger(prefix);

// Export logger class for direct use if needed
export { Logger };
