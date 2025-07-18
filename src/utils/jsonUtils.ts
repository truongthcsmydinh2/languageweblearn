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