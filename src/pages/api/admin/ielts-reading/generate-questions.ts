import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

      // Tạo prompt cho Gemini để sắp xếp và định dạng câu hỏi
      const prompt = `
You are a professional IELTS teacher. Here are raw questions that need to be sorted and formatted. Your task is to extract ONLY the actual questions, not the instruction headers.

**Passage Title**: ${passage_title || 'IELTS Reading Passage'}

**Reading Content**:
${content}

**Raw Questions (need sorting and formatting)**:
${raw_questions}

**CRITICAL INSTRUCTIONS - NOTIFICATION-BASED LOGIC**:
1. Extract ONLY the actual question statements, ignore all instruction headers
2. Use NOTIFICATION-BASED logic: Each notification controls ALL questions until the next notification
3. Do NOT include instruction text like "Questions 1-7:", "Do the following statements agree", etc.
4. Do NOT include explanation text like "TRUE if...", "FALSE if...", etc.
5. Extract only the numbered questions or statements that need answers

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

**IMPORTANT RULES**:
- Each notification controls ALL questions until the next notification appears
- Extract ONLY numbered questions or statements (like "Q1. People had expected...", "Q2. The change that...")
- Do NOT extract instruction text (like "Notification:", "Note:", "Questions 1-7:")
- Do NOT extract explanation text (like "TRUE if...", "FALSE if...")
- For completion questions, extract the sentences with blanks (like "Q8. Mike and Bob Bryan made changes to the types of ________ used on their racket frames.")
- Each question should be a complete, standalone statement
- Apply the notification's question type to ALL questions in that section
- Apply the notification's notes to ALL questions in that section

**Example Processing**:
Input: "Notification: True_False_NotGiven

Q1. People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.

Q2. The change that Andy Murray made to his rackets attracted a lot of attention.

Q3. Most of the world's top players take a professional racket stringer on tour with them.

Q4. Mike and Bob Bryan use rackets that are light in comparison to the majority of rackets.

Q5. Werner Fischer played with a spaghetti-strung racket that he designed himself.

Q6. The weather can affect how professional players adjust the strings on their rackets.

Q7. It was believed that the change Pete Sampras made to his rackets contributed to his strong serve.

Notification: Complete the Notes

Note: Choose ONE WORD ONLY from the passage for each answer.

Q8. Mike and Bob Bryan made changes to the types of ________ used on their racket frames.

Q9. Players were not allowed to use the spaghetti-strung racket because of the amount ________ it created.

Q10. Changes to rackets can be regarded as being as important as players' diets or the ________ they do.

Q11. All rackets used to have natural strings made from the ________ of animals.

Q12. Pete Sampras had metal ________ put into the frames of his rackets.

Q13. Gonçalo Oliveira changed ________ on his racket handles."

Output: [
  {
    "question_text": "People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "The change that Andy Murray made to his rackets attracted a lot of attention.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "Most of the world's top players take a professional racket stringer on tour with them.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "Mike and Bob Bryan use rackets that are light in comparison to the majority of rackets.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "Werner Fischer played with a spaghetti-strung racket that he designed himself.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "The weather can affect how professional players adjust the strings on their rackets.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "It was believed that the change Pete Sampras made to his rackets contributed to his strong serve.",
    "question_type": "true_false_not_given"
  },
  {
    "question_text": "Mike and Bob Bryan made changes to the types of ________ used on their racket frames.",
    "question_type": "note_completion"
  },
  {
    "question_text": "Players were not allowed to use the spaghetti-strung racket because of the amount ________ it created.",
    "question_type": "note_completion"
  },
  {
    "question_text": "Changes to rackets can be regarded as being as important as players' diets or the ________ they do.",
    "question_type": "note_completion"
  },
  {
    "question_text": "All rackets used to have natural strings made from the ________ of animals.",
    "question_type": "note_completion"
  },
  {
    "question_text": "Pete Sampras had metal ________ put into the frames of his rackets.",
    "question_type": "note_completion"
  },
  {
    "question_text": "Gonçalo Oliveira changed ________ on his racket handles.",
    "question_type": "note_completion"
  }
]

**JSON Format**:
[
  {
    "question_text": "Formatted question text",
    "question_type": "multiple_choice|true_false_not_given|yes_no_not_given|matching_headings|matching_information|matching_features|matching_sentence_endings|sentence_completion|summary_completion|note_completion|table_completion|flow_chart_completion|diagram_labelling|short_answer_questions",
    "options": ["A", "B", "C", "D"] (only for multiple_choice),
    "note": "Note text if applicable" (only for questions that have notes)
  }
]

**Notes**: 
- All questions must be in English
- Questions must be appropriate for IELTS difficulty (B1-C1)
- Sort in logical order and easy to understand
- Return only formatted questions, no answers needed
- Use notification-based logic to determine question type accurately
- Keep the exact IELTS question type names
- Each notification controls ALL questions until the next notification
- For multiple choice with multiple answers, keep the question intact
- For completion questions, keep the blank format (like "________")
- For completion questions, extract the sentences containing blanks
- Extract ONLY numbered questions or statements, ignore all instruction text
- Apply the notification's question type to ALL questions in that section
- Apply the notification's notes to ALL questions in that section
- Include the "note" field for questions that inherit notes from their notification
- For example: If notification has "Note: Choose ONE WORD ONLY", then ALL questions in that section should have "note": "Choose ONE WORD ONLY"
`;

      console.log('📤 Gửi yêu cầu tạo câu hỏi tới Gemini API');
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('❌ Gemini API error:', errorText);
        return res.status(500).json({ error: 'Lỗi Gemini API', detail: errorText });
      }

      const geminiData = await geminiRes.json();
      console.log('📥 Gemini response received');
      
      let questionsText = '';
      
      try {
        questionsText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Fallback: thử các cấu trúc khác
        if (!questionsText) {
          questionsText = geminiData?.candidates?.[0]?.content?.text || '';
        }
        if (!questionsText) {
          questionsText = geminiData?.text || '';
        }
        
        console.log('📝 Extracted text:', questionsText.substring(0, 200) + '...');
      } catch (parseError) {
        console.error('❌ Lỗi parse response:', parseError);
        return res.status(500).json({ error: 'Lỗi parse response từ Gemini', detail: String(parseError) });
      }

      if (!questionsText) {
        console.error('❌ Không tìm thấy text trong response');
        return res.status(500).json({ error: 'Gemini không trả về câu hỏi', detail: JSON.stringify(geminiData) });
      }

      // Parse JSON từ response
      let questions = [];
      try {
        // Tìm JSON array trong text
        const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: thử parse toàn bộ text
          questions = JSON.parse(questionsText);
        }
        
        // Đảm bảo questions là array
        if (!Array.isArray(questions)) {
          throw new Error('Response không phải array');
        }
        
        // Validate và format questions
        questions = questions.map((q, index) => ({
          question_text: q.question_text || '',
          question_type: q.question_type || 'multiple_choice',
          options: q.options || ['A', 'B', 'C', 'D'],
          note: q.note || null,
          order_index: index + 1
        })).filter(q => q.question_text);
        
        console.log('✅ Parsed questions:', questions.length);
        
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON questions:', parseError);
        console.error('❌ Raw text:', questionsText);
        return res.status(500).json({ error: 'Lỗi parse JSON câu hỏi từ Gemini', detail: questionsText });
      }

      return res.status(200).json({
        success: true,
        questions: questions,
        rawResponse: questionsText
      });

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