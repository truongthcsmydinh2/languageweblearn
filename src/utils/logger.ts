/**
 * Logger utility with timestamp support
 */

/**
 * Console log with timestamp
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function logWithTimestamp(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Console error with timestamp
 * @param message - The error message to log
 * @param error - Optional error object to log
 */
export function logErrorWithTimestamp(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  if (error !== undefined) {
    console.error(`[${timestamp}] ${message}`, error);
  } else {
    console.error(`[${timestamp}] ${message}`);
  }
}

/**
 * Console warn with timestamp
 * @param message - The warning message to log
 * @param data - Optional data to log
 */
export function logWarnWithTimestamp(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.warn(`[${timestamp}] ${message}`, data);
  } else {
    console.warn(`[${timestamp}] ${message}`);
  }
}

/**
 * Console info with timestamp
 * @param message - The info message to log
 * @param data - Optional data to log
 */
export function logInfoWithTimestamp(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.info(`[${timestamp}] ${message}`, data);
  } else {
    console.info(`[${timestamp}] ${message}`);
  }
}

/**
 * Console debug with timestamp
 * @param message - The debug message to log
 * @param data - Optional data to log
 */
export function logDebugWithTimestamp(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.debug(`[${timestamp}] ${message}`, data);
  } else {
    console.debug(`[${timestamp}] ${message}`);
  }
}