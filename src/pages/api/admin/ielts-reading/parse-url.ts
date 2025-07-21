import { NextApiRequest, NextApiResponse } from 'next';

interface ParsedData {
  metadata: {
    title: string;
    source: string;
    parsedAt: string;
    contentType: 'json' | 'html';
  };
  content: {
    title: string;
    passage: string;
    questionGroups: any[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate URL format và accessibility
function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL phải sử dụng giao thức HTTP hoặc HTTPS');
    }
    
    // Check if it's a valid domain
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      errors.push('Tên miền không hợp lệ');
    }
    
  } catch (error) {
    errors.push('URL không đúng định dạng');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate JSON data structure
function validateJsonData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Check if it's an object
  if (!data || typeof data !== 'object') {
    errors.push('Dữ liệu phải là một object JSON');
    return { isValid: false, errors };
  }
  
  // Check for new format (with metadata)
  if (data.metadata && data.content) {
    // New format validation
    if (!data.content.title || typeof data.content.title !== 'string') {
      errors.push('Thiếu hoặc sai định dạng title trong content');
    }
    
    if (!data.content.passage || typeof data.content.passage !== 'string') {
      errors.push('Thiếu hoặc sai định dạng passage trong content');
    }
    
    if (!Array.isArray(data.content.questionGroups)) {
      errors.push('questionGroups phải là một array');
    }
  } else {
    // Legacy format validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Thiếu hoặc sai định dạng title');
    }
    
    if (!data.passage || typeof data.passage !== 'string') {
      errors.push('Thiếu hoặc sai định dạng passage');
    }
    
    if (!Array.isArray(data.questionGroups)) {
      errors.push('questionGroups phải là một array');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fetch content from URL with proper error handling
async function fetchUrlContent(url: string): Promise<{ content: string; contentType: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IELTS-Reading-Parser/1.0)',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();
    
    if (!content || content.trim().length === 0) {
      throw new Error('Nội dung URL trống hoặc không thể đọc được');
    }
    
    return { content, contentType };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể truy cập URL: ${error.message}`);
    }
    throw new Error('Lỗi không xác định khi truy cập URL');
  }
}

// Parse JSON content
function parseJsonContent(content: string, url: string): ParsedData {
  try {
    const jsonData = JSON.parse(content);
    
    // Validate JSON structure
    const validation = validateJsonData(jsonData);
    if (!validation.isValid) {
      throw new Error(`Cấu trúc JSON không hợp lệ: ${validation.errors.join(', ')}`);
    }
    
    // Convert to new format if it's legacy format
    if (!jsonData.metadata) {
      return {
        metadata: {
          title: jsonData.title || 'Untitled',
          source: url,
          parsedAt: new Date().toISOString(),
          contentType: 'json'
        },
        content: {
          title: jsonData.title || 'Untitled',
          passage: jsonData.passage || '',
          questionGroups: jsonData.questionGroups || []
        }
      };
    }
    
    // Already in new format
    return {
      ...jsonData,
      metadata: {
        ...jsonData.metadata,
        source: url,
        parsedAt: new Date().toISOString(),
        contentType: 'json'
      }
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Nội dung không phải là JSON hợp lệ');
    }
    throw error;
  }
}

// Parse HTML content (basic implementation without cheerio)
function parseHtmlContent(content: string, url: string): ParsedData {
  // Basic HTML parsing without external dependencies
  // Extract title using regex
  let title = 'Untitled';
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                    content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  // Extract passage content using basic text extraction
  let passage = '';
  
  // Remove script and style tags
  const cleanContent = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                             .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Try to extract main content
  const contentMatches = [
    cleanContent.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
    cleanContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i),
    cleanContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  ];
  
  for (const match of contentMatches) {
    if (match && match[1]) {
      // Remove HTML tags and get text content
      passage = match[1].replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
      if (passage.length > 100) {
        break;
      }
    }
  }
  
  // Basic question extraction
  const questionGroups: any[] = [];
  const questionMatches = cleanContent.match(/\d+\.[^\d]*\?/g);
  
  if (questionMatches) {
    questionMatches.forEach((questionText: string, index: number) => {
      questionGroups.push({
        type: 'simple_question',
        title: `Question Group ${index + 1}`,
        questions: [{
          id: `q_${index + 1}`,
          text: questionText.trim(),
          type: 'simple_question',
          answer: '',
          explanation: ''
        }]
      });
    });
  }
  
  if (!passage || passage.length < 50) {
    throw new Error('Không thể trích xuất nội dung bài đọc từ HTML. Vui lòng kiểm tra URL hoặc sử dụng file JSON.');
  }
  
  return {
    metadata: {
      title,
      source: url,
      parsedAt: new Date().toISOString(),
      contentType: 'html'
    },
    content: {
      title,
      passage,
      questionGroups
    }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }
  
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'URL is required and must be a string'
      });
    }
    
    // Validate URL
    const urlValidation = validateUrl(url.trim());
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `URL không hợp lệ: ${urlValidation.errors.join(', ')}`
      });
    }
    
    console.log('Parsing URL:', url);
    
    // Fetch content
    const { content, contentType } = await fetchUrlContent(url.trim());
    
    let parsedData: ParsedData;
    
    // Determine content type and parse accordingly
    if (contentType.includes('application/json') || 
        (content.trim().startsWith('{') && content.trim().endsWith('}'))) {
      // JSON content
      parsedData = parseJsonContent(content, url);
    } else if (contentType.includes('text/html')) {
      // HTML content
      parsedData = parseHtmlContent(content, url);
    } else {
      throw new Error('Định dạng nội dung không được hỗ trợ. Chỉ hỗ trợ JSON và HTML.');
    }
    
    console.log('Successfully parsed URL:', {
      url,
      contentType: parsedData.metadata.contentType,
      title: parsedData.content.title,
      passageLength: parsedData.content.passage.length,
      questionGroupsCount: parsedData.content.questionGroups.length
    });
    
    return res.status(200).json({
      success: true,
      data: parsedData
    });
    
  } catch (error) {
    console.error('Error parsing URL:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}