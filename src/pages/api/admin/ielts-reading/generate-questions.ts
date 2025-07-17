import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

const prisma = new PrismaClient();

interface GeminiQuestion {
  questionText?: string;
  question_text?: string;
  question?: string;
  text?: string;
  correctAnswer?: string;
  correct_answer?: string;
  answer?: string;
  correct?: string;
  options?: any;
  explanation?: string;
  note?: string;
}

interface GeminiGroup {
  instructions?: string;
  instruction?: string;
  questionType?: string;
  question_type?: string;
  type?: string;
  questions?: GeminiQuestion[];
  question?: GeminiQuestion[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
      const { content, passage_title, raw_questions } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Thiếu nội dung bài đọc' });
      }

      if (!raw_questions) {
        return res.status(400).json({ error: 'Thiếu câu hỏi thô' });
      }

      // Tạo prompt cho Gemini để tạo cấu trúc groups
      const prompt = `
You are a professional IELTS teacher. Analyze the following reading text and raw questions to create a structured set of question groups.

**Passage Title**: ${passage_title || 'IELTS Reading Passage'}

**Reading Content**:
${content}

**Raw Questions (need to be organized into groups)**:
${raw_questions}

**CRITICAL INSTRUCTIONS**:
1. Analyze the raw questions and organize them into logical groups based on question type and instructions
2. Each group should have clear instructions and a specific question type
3. Extract ONLY the actual question statements, ignore instruction headers
4. Use NOTIFICATION-BASED logic: Each notification controls ALL questions until the next notification
5. Do NOT include instruction text like "Questions 1-7:", "Do the following statements agree", etc.
6. Do NOT include explanation text like "TRUE if...", "FALSE if...", etc.

**NOTIFICATION-BASED PROCESSING RULES**:
- When you see "Notification: [QuestionType]" → ALL questions below this belong to this type until next notification
- When you see "Note: [Instructions]" → ALL questions below this inherit this note until next notification
- Each notification controls ALL subsequent questions until a new notification appears
- The first notification applies to ALL questions if no specific notification is given

**Question Type Classification Based on Notifications**:
- "Notification: True_False_NotGiven" → ALL questions below are "true_false_not_given"
- "Notification: Yes_No_NotGiven" → ALL questions below are "yes_no_not_given"
- "Notification: Multiple Choice" → ALL questions below are "multiple_choice"
- "Notification: Choose TWO/THREE/FOUR" → ALL questions below are "multiple_choice"
- "Notification: Which TWO/THREE/FOUR of the following" → ALL questions below are "multiple_choice"
- "Notification: Matching Headings" → ALL questions below are "matching_headings"
- "Notification: Matching Information" → ALL questions below are "matching_information"
- "Notification: Matching Features" → ALL questions below are "matching_features"
- "Notification: Matching Sentence Endings" → ALL questions below are "matching_sentence_endings"
- "Notification: Sentence Completion" → ALL questions below are "sentence_completion"
- "Notification: Summary Completion" → ALL questions below are "summary_completion"
- "Notification: Note Completion" → ALL questions below are "note_completion"
- "Notification: Table Completion" → ALL questions below are "table_completion"
- "Notification: Flow-chart Completion" → ALL questions below are "flow_chart_completion"
- "Notification: Diagram Labelling" → ALL questions below are "diagram_labelling"
- "Notification: Short-Answer Questions" → ALL questions below are "short_answer_questions"
- "Notification: Complete the Notes" → ALL questions below are "note_completion"
- "Notification: Complete the Summary" → ALL questions below are "summary_completion"
- "Notification: Complete the Table" → ALL questions below are "table_completion"
- "Notification: Complete the Flow-chart" → ALL questions below are "flow_chart_completion"
- "Notification: Label the Diagram" → ALL questions below are "diagram_labelling"

**REQUIRED OUTPUT FORMAT**:
Return a single JSON object with a "groups" array. Each group must contain:
- "instructions": Clear instructions for this group of questions
- "questionType": The IELTS question type
- "questions": Array of question objects

**Example Output Format**:
{
  "groups": [
    {
      "instructions": "Questions 1-7: Do the following statements agree with the information given in the reading passage? Write TRUE, FALSE, or NOT GIVEN.",
      "questionType": "true_false_not_given",
      "questions": [
        {
          "questionText": "People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.",
          "correctAnswer": "NOT GIVEN"
        },
        {
          "questionText": "The change that Andy Murray made to his rackets attracted a lot of attention.",
          "correctAnswer": "TRUE"
        }
      ]
    },
    {
      "instructions": "Questions 8-13: Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.",
      "questionType": "note_completion",
      "questions": [
        {
          "questionText": "Mike and Bob Bryan made changes to the types of ________ used on their racket frames.",
          "correctAnswer": "strings"
        },
        {
          "questionText": "Players were not allowed to use the spaghetti-strung racket because of the amount ________ it created.",
          "correctAnswer": "spin"
        }
      ]
    }
  ]
}

**IMPORTANT RULES**:
- Extract ONLY numbered questions or statements (like "Q1. People had expected...", "Q2. The change that...")
- Do NOT extract instruction text (like "Notification:", "Note:", "Questions 1-7:")
- Do NOT extract explanation text (like "TRUE if...", "FALSE if...")
- For completion questions, extract the sentences with blanks (like "Q8. Mike and Bob Bryan made changes to the types of ________ used on their racket frames.")
- Each question should be a complete, standalone statement
- Apply the notification's question type to ALL questions in that section
- Apply the notification's notes to ALL questions in that section
- Group questions logically by their instructions and question type
- Include the "correctAnswer" field for each question (you can provide reasonable answers based on the text)
- All questions must be in English
- Questions must be appropriate for IELTS difficulty (B1-C1)
- Sort in logical order and easy to understand
- Use the exact IELTS question type names
- For multiple choice with multiple answers, keep the question intact
- For completion questions, keep the blank format (like "________")
- For completion questions, extract the sentences containing blanks
`;

      console.log('📤 Gửi yêu cầu tạo câu hỏi tới Gemini API với Streaming');
      console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
      
      let questionsText = '';
      
      try {
        // Sử dụng streaming API để tăng tốc độ phản hồi
        const result = await generateContentWithTiming(prompt, 'gemini-1.5-flash', true);
        console.log(`⚡ Thời gian phản hồi streaming: ${result.duration}ms`);
        
        questionsText = result.text;
        console.log('✅ Received response từ streaming API');
        
      } catch (streamingError) {
        console.error('❌ Lỗi streaming API:', streamingError);
        console.log('🔄 Fallback to standard API...');
        
        try {
          // Fallback to standard API
          const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
          console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
          
          questionsText = fallbackResult.text;
          console.log('✅ Received response từ fallback API');
          
        } catch (fallbackError) {
          console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
          return res.status(500).json({ error: 'Lỗi Gemini API', detail: String(fallbackError) });
        }
      }
      
      if (!questionsText) {
        console.error('❌ Không có text từ Gemini response');
        return res.status(500).json({ error: 'Gemini không trả về text' });
      }
      
      console.log('📝 Extracted text:', questionsText.substring(0, 200) + '...');

      // Parse JSON từ response
      let groups = [];
      try {
        // Tìm JSON object trong text
        const jsonMatch = questionsText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          groups = parsed.groups || [];
        } else {
          // Fallback: thử parse toàn bộ text
          const parsed = JSON.parse(questionsText);
          groups = parsed.groups || [];
        }
        
        // Đảm bảo groups là array
        if (!Array.isArray(groups)) {
          throw new Error('Response không phải array groups');
        }
        
        // Chuẩn hóa dữ liệu từ Gemini
        const normalizedGroups = groups.map((group: GeminiGroup) => {
          // Chuẩn hóa key bị cắt
          const normalizedGroup = {
            instructions: group.instructions || group.instruction || '',
            questionType: group.questionType || group.question_type || group.type || 'multiple_choice',
            questions: [] as any[]
          };
          
          // Chuẩn hóa questions array
          const questions = group.questions || group.question || [];
          if (Array.isArray(questions)) {
            normalizedGroup.questions = questions.map((q: GeminiQuestion) => ({
              questionText: q.questionText || q.question_text || q.question || q.text || '',
              correctAnswer: q.correctAnswer || q.correct_answer || q.answer || q.correct || '',
              options: q.options || null,
              explanation: q.explanation || null,
              note: q.note || null
            }));
          }
          
          return normalizedGroup;
        });
        
        console.log('✅ Parsed groups:', normalizedGroups.length);
        
        // Trả về cả cấu trúc groups và questions để tương thích
        const flattenedQuestions: any[] = [];
        normalizedGroups.forEach(group => {
          group.questions.forEach((question: any, index: number) => {
            flattenedQuestions.push({
              question_text: question.questionText,
              question_type: group.questionType,
              correct_answer: question.correctAnswer,
              options: question.options,
              explanation: question.explanation,
              note: question.note,
              order_index: flattenedQuestions.length + 1
            });
          });
        });
        
        return res.status(200).json({
          success: true,
          groups: normalizedGroups,
          questions: flattenedQuestions,
          rawResponse: questionsText
        });
        
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON groups:', parseError);
        console.error('❌ Raw text:', questionsText);
        return res.status(500).json({ error: 'Lỗi parse JSON groups từ Gemini', detail: questionsText });
      }

    } catch (error) {
      console.error('❌ Lỗi khi tạo câu hỏi với Gemini:', error);
      return res.status(500).json({ 
        error: 'Lỗi server',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}