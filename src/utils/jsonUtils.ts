/**
 * Utility functions for safe JSON parsing and validation
 */

/**
 * Safely parse JSON string with cleaning and validation
 * @param jsonString - The JSON string to parse
 * @returns Parsed JSON object or null if invalid
 */
export function safeJsonParse(jsonString: string): any | null {
  try {
    // Làm sạch dữ liệu trước khi parse JSON
    let cleanLine = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Tìm JSON object đầu tiên hợp lệ
    const jsonStart = cleanLine.indexOf('{');
    const jsonEnd = cleanLine.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanLine = cleanLine.substring(jsonStart, jsonEnd + 1);
    }
    
    // Kiểm tra xem có phải là JSON hợp lệ không
    if (!cleanLine.startsWith('{') || !cleanLine.endsWith('}')) {
      return null;
    }
    
    return JSON.parse(cleanLine);
  } catch (error) {
    console.warn('JSON parsing error:', error, 'Input:', jsonString);
    return null;
  }
}

/**
 * Validate if a string contains valid JSON
 * @param jsonString - The string to validate
 * @returns true if valid JSON, false otherwise
 */
export function isValidJson(jsonString: string): boolean {
  return safeJsonParse(jsonString) !== null;
}

/**
 * Clean and extract JSON from a potentially malformed string
 * @param input - The input string
 * @returns Cleaned JSON string or null if no valid JSON found
 */
export function extractJson(input: string): string | null {
  try {
    // Làm sạch dữ liệu
    let cleanLine = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Tìm JSON object đầu tiên hợp lệ
    const jsonStart = cleanLine.indexOf('{');
    const jsonEnd = cleanLine.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanLine = cleanLine.substring(jsonStart, jsonEnd + 1);
    }
    
    // Kiểm tra định dạng cơ bản
    if (!cleanLine.startsWith('{') || !cleanLine.endsWith('}')) {
      return null;
    }
    
    // Thử parse để đảm bảo hợp lệ
    JSON.parse(cleanLine);
    return cleanLine;
  } catch (error) {
    return null;
  }
}

/**
 * Format text by breaking long sentences into multiple lines
 * @param text - The text to format
 * @returns Formatted text with line breaks
 */
export function formatTextWithLineBreaks(text: string | string[] | any): string {
  if (!text || typeof text !== 'string') return text || '';
  
  // Tách câu dựa trên dấu chấm, dấu hai chấm, và các từ khóa
  let formatted = text
    // Thêm xuống dòng sau dấu chấm (nếu không phải số thập phân)
    .replace(/\. (?=[A-Z])/g, '.\n')
    // Thêm xuống dòng trước "Ví dụ," hoặc "Hoặc:"
    .replace(/\s+(Ví dụ,|Hoặc:|Thay vì)/g, '\n$1')
    // Thêm xuống dòng trước các cụm từ bắt đầu câu mới
    .replace(/\s+(Bạn có thể|Thay thế|Cải thiện|Sử dụng)/g, '\n$1')
    // Tách các câu ví dụ trong ngoặc đơn thành dòng riêng (cải thiện regex để không tách từ có dấu nháy đơn)
    .replace(/\s*'([^']*(?:'[^']*)*)'\s*\(([^)]+)\)\./g, '\n\'$1\' ($2).')
    // Thêm xuống dòng sau dấu ngoặc đơn kết thúc nếu theo sau là chữ cái viết hoa hoặc "Hoặc"
    .replace(/\)\s*\.?\s*(Hoặc:|[A-Z])/g, ').\n$1')
    // Loại bỏ khoảng trắng thừa và xuống dòng liên tiếp
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return formatted;
}

/**
 * Format suggestions and errors text for better readability
 * @param text - The text to format
 * @returns Formatted text with proper line breaks and structure
 */
export function formatFeedbackText(text: string | string[] | any): string {
  if (!text || typeof text !== 'string') return text || '';
  
  let formatted = text
    // Tách các gợi ý riêng biệt
    .replace(/\. (Ví dụ|Hoặc|Thay vì|Bạn có thể|Cải thiện|Gợi ý)/g, '.\n\n$1')
    // Tách các loại lỗi
    .replace(/\. (\[.*?\])/g, '.\n\n$1')
    // Thêm xuống dòng sau dấu ngoặc vuông đóng
    .replace(/\]: /g, ']: \n')
    // Tách các câu ví dụ trong ngoặc đơn thành dòng riêng (cải thiện regex để không tách từ có dấu nháy đơn)
    .replace(/\s*'([^']*(?:'[^']*)*)'\s*\(([^)]+)\)\./g, '\n\'$1\' ($2).')
    // Thêm xuống dòng sau dấu ngoặc đơn kết thúc nếu theo sau là "Hoặc" hoặc chữ cái viết hoa
    .replace(/\)\s*\.?\s*(Hoặc:|[A-Z])/g, ').\n$1')
    // Thêm xuống dòng trước "Ví dụ," hoặc "Hoặc:"
    .replace(/\s+(Ví dụ,|Hoặc:|Thay vì)/g, '\n$1')
    // Thêm xuống dòng trước các từ khóa quan trọng
    .replace(/(Từ gốc:|Từ thay thế:|Lý do:|Cấu trúc:|Mẫu câu:)/g, '\n$1')
    // Loại bỏ khoảng trắng thừa
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return formatted;
}