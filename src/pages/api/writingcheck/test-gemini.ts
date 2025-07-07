import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAnswer, originalSentence } = req.body;

  if (!userAnswer || !originalSentence) {
    return res.status(400).json({ error: 'Thiếu dữ liệu cần thiết' });
  }

  try {
    // Tạo prompt đơn giản để test
    const prompt = `
Bạn là một giáo viên tiếng Anh. Hãy đánh giá bản dịch tiếng Anh của học sinh.

Câu gốc (tiếng Việt): "${originalSentence}"
Bản dịch của học sinh (tiếng Anh): "${userAnswer}"

Hãy trả về kết quả theo định dạng JSON sau:
{
  "score": số điểm từ 1-10,
  "feedback": "nhận xét tổng quan",
  "errors": ["danh sách lỗi cụ thể"],
  "suggestions": ["gợi ý sửa lỗi"],
  "corrected_version": "bản dịch đúng hoặc gợi ý",
  "advice": "lời khuyên để cải thiện"
}
`;

    // Gọi Gemini API
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { 
            role: 'user', 
            parts: [{ text: prompt }] 
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorText);
      throw new Error(`Gemini API error: ${geminiRes.status} - ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini response:', responseText);

    // Parse JSON response từ Gemini
    let parsedResponse;
    try {
      // Tìm JSON trong response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback nếu không parse được JSON
        parsedResponse = {
          score: 5,
          feedback: responseText || 'Không thể đánh giá',
          errors: ['Không thể phân tích chi tiết'],
          suggestions: ['Hãy thử lại'],
          corrected_version: '',
          advice: 'Hãy kiểm tra lại ngữ pháp và từ vựng'
        };
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      parsedResponse = {
        score: 5,
        feedback: responseText || 'Không thể đánh giá',
        errors: ['Lỗi phân tích phản hồi'],
        suggestions: ['Hãy thử lại'],
        corrected_version: '',
        advice: 'Hãy kiểm tra lại ngữ pháp và từ vựng'
      };
    }

    return res.status(200).json({
      success: true,
      rawResponse: responseText,
      ...parsedResponse
    });

  } catch (error) {
    console.error('Error testing Gemini:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 