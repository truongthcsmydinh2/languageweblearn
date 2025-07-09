// Các hàm tiện ích cho việc học tập và ôn tập từ vựng

// Định nghĩa kiểu dữ liệu
export interface Term {
  id: number;
  vocab: string;
  meanings: string | string[];
  example_sentence?: string;
  notes?: string;
  level_en: number;
  level_vi: number;
  review_time_en: string | null; // yyyy-mm-dd
  review_time_vi: string | null; // yyyy-mm-dd
  last_review_en: number | null;
  last_review_vi: number | null;
  created_at: string;
  updated_at: string;
  status_learning_en?: string;
  status_learning_vi?: string;
}

export interface LearningItem {
  term: Term;
  mode: 'en_to_vi' | 'vi_to_en';
}

/**
 * Tính thời gian ôn tập tiếp theo dựa vào level
 * @param level Level hiện tại của từ vựng
 * @returns Ngày ôn tập tiếp theo dạng yyyy-mm-dd
 */
export function calculateNextReviewTime(level: number): string {
  const now = new Date();
  let next = new Date(now);
  
  switch (level) {
    case 0:
      return now.toISOString().slice(0, 10); // ngay lập tức
    case 1:
      next.setDate(now.getDate() + 1); break;
    case 2:
      next.setDate(now.getDate() + 2); break;
    case 3:
      next.setDate(now.getDate() + 3); break;
    case 4:
      next.setDate(now.getDate() + 4); break;
    case 5:
      next.setDate(now.getDate() + 7); break;
    case 6:
      next.setDate(now.getDate() + 14); break;
    case 7:
      next.setMonth(now.getMonth() + 1); break;
    case 8:
      next.setMonth(now.getMonth() + 2); break;
    case 9:
      next.setMonth(now.getMonth() + 3); break;
    case 10:
      next.setMonth(now.getMonth() + 6); break;
    default:
      return now.toISOString().slice(0, 10);
  }
  
  // Reset giờ, phút, giây để đảm bảo tính nhất quán
  next.setHours(0, 0, 0, 0);
  return next.toISOString().slice(0, 10);
}

/**
 * Chuyển đổi timestamp hoặc chuỗi ngày thành định dạng yyyy-mm-dd
 * @param ts Timestamp hoặc chuỗi ngày
 * @returns Chuỗi ngày dạng yyyy-mm-dd
 */
export function getDateString(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  return d.getFullYear() + '-' + 
    (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
    d.getDate().toString().padStart(2, '0');
}

/**
 * Chuyển đổi ngày về múi giờ GMT+7
 * @returns Chuỗi ngày dạng yyyy-mm-dd theo múi giờ GMT+7
 */
export function getTodayStrGMT7(): string {
  const now = new Date();
  // GMT+7 offset = 7*60 = 420 phút
  const gmt7 = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
  return gmt7.toISOString().slice(0, 10);
}

/**
 * Chuyển đổi về ngày local yyyy-mm-dd
 * @param dateValue Giá trị ngày (timestamp, string, Date)
 * @returns Chuỗi ngày dạng yyyy-mm-dd
 */
export function toLocalDateString(dateValue: any): string {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  const offset = d.getTimezoneOffset();
  d.setMinutes(d.getMinutes() - offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Loại bỏ dấu tiếng Việt
 * @param text Chuỗi cần loại bỏ dấu
 * @returns Chuỗi đã loại bỏ dấu
 */
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D');
}

/**
 * Chuẩn hóa chuỗi để so sánh
 * @param text Chuỗi cần chuẩn hóa
 * @returns Chuỗi đã chuẩn hóa (không dấu, viết thường, loại bỏ khoảng trắng thừa)
 */
export function normalizeForComparison(text: string): string {
  return removeDiacritics(text.toLowerCase().trim());
}

/**
 * Kiểm tra xem một chuỗi có chứa ký tự tiếng Việt có dấu hay không
 * @param text Chuỗi cần kiểm tra
 * @returns true nếu chuỗi chứa ký tự tiếng Việt có dấu
 */
export function containsVietnameseCharacters(text: string): boolean {
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnamesePattern.test(text);
}

/**
 * Định dạng thời gian còn lại
 * @param ms Thời gian còn lại (mili giây)
 * @returns Chuỗi thời gian định dạng
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Đã đến lúc ôn tập!';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return `${days} ngày ${hours} giờ`;
  } else if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  } else if (minutes > 0) {
    return `${minutes} phút ${seconds} giây`;
  } else {
    return `${seconds} giây`;
  }
}

/**
 * Xử lý an toàn cho trường meanings
 * @param meanings Nghĩa của từ vựng
 * @returns Chuỗi nghĩa an toàn
 */
export function safeMeanings(meanings: string | string[] | undefined): string {
  if (!meanings) return '';
  if (Array.isArray(meanings)) return meanings.join(', ');
  return meanings;
}

/**
 * Hàm debounce để tránh gọi hàm quá nhiều lần
 * @param func Hàm cần debounce
 * @param delay Thời gian delay (mili giây)
 * @returns Hàm đã được debounce
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
} 