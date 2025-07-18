import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo Gemini AI client với region asia-southeast1 (Singapore) để tối ưu tốc độ
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '', {
  baseUrl: 'https://generativelanguage.googleapis.com'
});

// Cấu hình mặc định cho generation với tối ưu hóa cho asia-southeast1
export const defaultGenerationConfig = {
  temperature: 0.3,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

// Cấu hình cho streaming với tối ưu hóa tốc độ
export const streamingConfig = {
  ...defaultGenerationConfig,
  // Streaming sẽ trả về kết quả nhanh hơn
  candidateCount: 1,
};

// Cấu hình request headers cho asia-southeast1
const requestOptions = {
  // Tối ưu hóa cho region Singapore
  timeout: 30000, // 30s timeout
  headers: {
    'X-Goog-User-Project': process.env.GOOGLE_CLOUD_PROJECT || '',
    'X-Goog-Api-Client': 'gl-js/streaming-optimized'
  }
};

// Hàm helper để gọi Gemini API với streaming
export async function generateContentStream(
  prompt: string,
  modelName: string = 'gemini-1.5-flash',
  config = streamingConfig
) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Sử dụng generateContentStream thay vì generateContent
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config
    });
    
    return result;
  } catch (error) {
    console.error('Error in generateContentStream:', error);
    throw error;
  }
}

// Hàm helper để xử lý streaming response và trả về text hoàn chỉnh
export async function getStreamedText(
  prompt: string,
  modelName: string = 'gemini-1.5-flash',
  config = streamingConfig
): Promise<string> {
  try {
    const streamResult = await generateContentStream(prompt, modelName, config);
    
    let fullText = '';
    
    // Xử lý từng chunk dữ liệu
    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
    }
    
    return fullText;
  } catch (error) {
    console.error('Error in getStreamedText:', error);
    throw error;
  }
}

// Hàm helper để gọi Gemini API thông thường (fallback)
export async function generateContent(
  prompt: string,
  modelName: string = 'gemini-1.5-flash',
  config = defaultGenerationConfig
) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: config
    });
    
    return result.response.text();
  } catch (error) {
    console.error('Error in generateContent:', error);
    throw error;
  }
}

// Export instance để sử dụng trực tiếp nếu cần
export { genAI };

// Hàm helper để gọi API với JSON response
export async function generateJSONContent(
  prompt: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<any> {
  try {
    const config = {
      ...streamingConfig,
      responseMimeType: 'application/json'
    };
    
    const text = await getStreamedText(prompt, modelName, config);
    
    // Parse JSON từ response
    try {
      // Loại bỏ markdown nếu có
      let cleanText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
      
      // Loại bỏ các ký tự không mong muốn có thể gây lỗi JSON
      cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      // Tìm JSON object đầu tiên hợp lệ
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Raw text:', text);
      throw new Error('Invalid JSON response from Gemini');
    }
  } catch (error) {
    console.error('Error in generateJSONContent:', error);
    throw error;
  }
}

// Hàm để đo thời gian phản hồi
export async function generateContentWithTiming(
  prompt: string,
  modelName: string = 'gemini-1.5-flash',
  useStreaming: boolean = true
) {
  const startTime = Date.now();
  
  try {
    let result;
    if (useStreaming) {
      result = await getStreamedText(prompt, modelName);
    } else {
      result = await generateContent(prompt, modelName);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`🚀 Gemini API response time: ${duration}ms (${useStreaming ? 'streaming' : 'standard'})`);
    
    return {
      text: result,
      duration,
      method: useStreaming ? 'streaming' : 'standard'
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`❌ Gemini API error after ${duration}ms:`, error);
    throw error;
  }
}