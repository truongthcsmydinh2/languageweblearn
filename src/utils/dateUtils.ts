/**
 * Utility functions for handling dates and timestamps
 */

/**
 * Format timestamp to Vietnamese date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string or fallback text
 */
export function formatTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) {
    return 'Chưa có lịch';
  }
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Chưa có lịch';
    }
    return date.toLocaleDateString('vi-VN');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Chưa có lịch';
  }
}

/**
 * Format timestamp to Vietnamese date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string or fallback text
 */
export function formatTimestampWithTime(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) {
    return 'Chưa có lịch';
  }
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Chưa có lịch';
    }
    return date.toLocaleString('vi-VN');
  } catch (error) {
    console.error('Error formatting timestamp with time:', error);
    return 'Chưa có lịch';
  }
}

/**
 * Check if a timestamp is overdue (past current time)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns true if overdue, false otherwise
 */
export function isOverdue(timestamp: number | null | undefined): boolean {
  if (!timestamp || timestamp <= 0) {
    return false;
  }
  
  try {
    const now = Date.now();
    return timestamp < now;
  } catch (error) {
    console.error('Error checking if overdue:', error);
    return false;
  }
}

/**
 * Get relative time string (e.g., "2 giờ trước", "3 ngày trước")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) {
    return 'Chưa có lịch';
  }
  
  try {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else if (minutes > 0) {
      return `${minutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Chưa có lịch';
  }
}

/**
 * Get status text for review time
 * @param reviewTime - Review timestamp
 * @param lastReviewTime - Last review timestamp
 * @returns Status text
 */
export function getReviewStatus(reviewTime: number | null | undefined, lastReviewTime: number | null | undefined): string {
  if (!reviewTime || reviewTime <= 0) {
    return 'Mới';
  }
  
  if (isOverdue(reviewTime)) {
    return 'Quá hạn';
  }
  
  if (!lastReviewTime || lastReviewTime <= 0) {
    return 'Chưa học';
  }
  
  return 'Đã học';
}

/**
 * Get level display text
 * @param level - Level number
 * @returns Level display text
 */
export function getLevelText(level: number | null | undefined): string {
  if (!level || level <= 0) {
    return 'Mới (0)';
  }
  
  return `Cấp ${level}`;
} 