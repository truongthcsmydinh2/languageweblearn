import type { NextApiRequest, NextApiResponse } from 'next';
// Giả sử bạn có một hàm generateContentStream trong lib
import { generateContentStream } from '@/lib/gemini';
import { safeJsonParse, extractJson } from '@/utils/jsonUtils'; 

// Interface này đại diện cho đối tượng mà client sẽ TÁI TẠO LẠI từ stream
interface EvaluationResult {
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  correctAnswer: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [${requestId}] Starting translation evaluation API handler (STREAMING MODE)`);

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    console.log(`❌ [${requestId}] Missing firebase_uid in headers`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log(`✅ [${requestId}] Firebase UID authenticated`);

  try {
    const { word, meaning, example, userAnswer } = req.body;
    if (!word || !meaning || !example || !userAnswer) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    console.log(`✅ [${requestId}] All required fields present`);
    
    // *** PROMPT ĐƯỢC TỐI ƯU CHO STREAMING JSONL ***
    console.log(`🔧 [${requestId}] Creating prompt for Gemini API...`);
    const prompt = `
Bạn LÀ giáo viên tiếng Anh chuyên nghiệp, NGHIÊM KHẮC và CHÍNH XÁC trong việc chấm điểm. Nhiệm vụ của bạn là:
- PHÁT HIỆN MỌI LỖI SAI (ngữ pháp, từ vựng, nghĩa, cấu trúc)
- KHÔNG ĐƯỢC BỎ QUA hay GIẢM NHẸ bất kỳ lỗi nào
- ĐƯA RA GỢI Ý CỤ THỂ, KHẢ THI, KHÔNG CHUNG CHUNG
- SỬ DỤNG ngôn ngữ thân thiện nhưng chuyên nghiệp
Trả về kết quả dưới dạng một chuỗi sự kiện JSONL (mỗi JSON trên một dòng mới).

**BỐI CẢNH:**
- Từ vựng: "${word}"
- Ý nghĩa: "${meaning}"
- Câu ví dụ gốc: "${example}"
- Câu của học sinh: "${userAnswer}"

**YÊU CẦU (JSONL Stream):**
Sử dụng các key: \`e\` (event), \`k\` (key), \`c\` (content/chunk), \`v\` (value).

1.  **Bắt đầu:** Gửi ngay một sự kiện \`{"e": "start"}\`.
2.  **Điểm số tính trên thang 1-100 (IMPORTANCE):** Gửi ngay điểm số bằng \`{"e": "data", "k": "score", "v": number}\`.
3.  **Phản hồi (Chúng ta cần 1 feedback nêu rõ những điểm được và những điểm chưa được) (\`feedback\`):** Stream từng từ bằng \`{"e": "data", "k": "feedback", "c": "từng_từ_một"}\`.
4.  **Lỗi sai - PHÂN TÍCH BẮT BUỘC (\`errors\`):** Stream từng từ bằng \`{"e": "data", "k": "errors", "c": "từng_từ_một"}\`. BẮT BUỘC kiểm tra:
   - **Ngữ pháp:** Thì động từ, cấu trúc câu, giới từ, mạo từ
   - **Từ vựng:** Chính tả, cách dùng từ, collocation
   - **Nghĩa:** So sánh với câu gốc, có truyền tải đúng ý không
   - **Cấu trúc:** Trật tự từ, liên kết câu
   Định dạng: "[LOẠI LỖI] - [VỊ TRÍ CỤ THỂ]: [MÔ TẢ LỖI] → [CÁCH SỬA]". CHỈ viết "Không có lỗi đáng kể" khi đã kiểm tra kỹ lưỡng và thực sự không có lỗi nào.
5.  **Gợi ý Nâng cấp - PHẢI CỤ THỂ VÀ KHẢ THI (\`suggestions\`):** Stream từng từ bằng \`{"e": "data", "k": "suggestions", "c": "từng_từ_một"}\`. TUYỆT ĐỐI KHÔNG đưa ra gợi ý chung chung. Bắt buộc cung cấp:
   - **Từ vựng cụ thể:** "Thay '[từ_hiện_tại]' bằng '[từ_tốt_hơn]' vì [lý_do_rõ_ràng]"
   - **Cấu trúc câu thay thế:** "Thay vì viết '[câu_gốc]', hãy viết '[câu_cải_tiến_hoàn_chỉnh]'"
   - **Mẫu câu nâng cao:** Đưa ra 2-3 cách viết khác nhau cho cùng một ý với độ phức tạp tăng dần
   - **Lý do cải thiện:** Giải thích tại sao mỗi thay đổi làm câu tốt hơn (tự nhiên hơn, chính xác hơn, academic hơn)
6.  **Câu đúng (\`correctAnswer\`):** Stream từng từ bằng \`{"e": "data", "k": "correctAnswer", "c": "từng_từ_một"}\`.
7.  **Kết thúc:** Gửi một sự kiện \`{"e": "end"}\`.

**QUAN TRỌNG:** Mỗi đối tượng JSON phải nằm trên một dòng riêng biệt. KHÔNG sử dụng markdown code block (dấu \`\`\`). Tuyệt đối không thêm bất kỳ ký tự nào sau dấu \`}\` của một đối tượng JSON trên cùng một dòng.
`;
    console.log(`📝 [${requestId}] Prompt created, length: ${prompt.length} characters`);

    // Thiết lập headers cho streaming
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    console.log(`✅ [${requestId}] Streaming headers set`);

    const startTime = Date.now();
    console.log(`📤 [${requestId}] Calling generateContentStream...`);
    
    // Gọi API streaming
    const streamResult = await generateContentStream(prompt, 'gemini-1.5-flash');
    
    let buffer = '';
    let chunkCounter = 0;

    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      console.log(`🔍 [${requestId}] RAW Gemini chunk:`, JSON.stringify(chunkText));
      
      buffer += chunkText;
      
      // Xử lý trường hợp Gemini trả về nhiều JSON trên cùng một dòng bằng cách chèn newline
      // Đây là bước quan trọng để phòng trường hợp nhiều JSON object liền nhau
      buffer = buffer.replace(/}\s*{/g, '}\n{');
      console.log(`📋 [${requestId}] Buffer after processing:`, JSON.stringify(buffer));

      let lines = buffer.split('\n');
      
      // Giữ lại dòng cuối (có thể chưa hoàn chỉnh) trong buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;

        // Kiểm tra và bỏ qua mọi dòng định dạng markdown (```json, ```jsonl, ```)
        // Logic này giúp làm sạch stream trước khi gửi về client.
        if (trimmedLine.startsWith('```')) {
          console.log(`🔄 [${requestId}] Skipping markdown wrapper: "${trimmedLine}"`);
          continue; // Bỏ qua, không gửi dòng này về client
        }
        
        chunkCounter++;
        
        // Validate JSON before sending to client using utility function
        const cleanJson = extractJson(trimmedLine);
        if (cleanJson) {
          const jsonData = safeJsonParse(cleanJson);
          if (jsonData && jsonData.e === 'data' && jsonData.k === 'score') {
            console.log(`🔢 [${requestId}] Streamed score: ${jsonData.v}`);
          }
          
          // Chỉ gửi về client nếu JSON hợp lệ
          res.write(cleanJson + '\n');
        } else {
          console.warn(`⚠️ [${requestId}] Chunk #${chunkCounter} is not valid JSON, skipping: "${trimmedLine}"`);
        }
      }
    }

    // Xử lý phần còn lại trong buffer sau khi stream kết thúc
    const finalTrimmedLine = buffer.trim();
    if (finalTrimmedLine !== '') {
      // Đảm bảo không gửi dòng markdown cuối cùng nếu có
      if (!finalTrimmedLine.startsWith('```')) {
        res.write(finalTrimmedLine + '\n');
        console.log(`🔄 [${requestId}] Wrote final buffer content: "${finalTrimmedLine}"`);
      } else {
        console.log(`🔄 [${requestId}] Skipping final markdown wrapper: "${finalTrimmedLine}"`);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Total streaming and processing time: ${totalDuration}ms`);
    
    res.end(); // Kết thúc response
    console.log(`✅ [${requestId}] Stream completed and response ended.`);

  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in stream handler:`, error);
    if (!res.writableEnded) {
      res.status(500).json({ error: 'Internal server error', detail: String(error) });
    } else {
      res.end(); // Đảm bảo đóng kết nối nếu có lỗi xảy ra sau khi đã gửi dữ liệu
    }
  }
}
