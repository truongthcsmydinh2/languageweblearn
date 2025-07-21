import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, IeltsQuestionType } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced validation function
function validateImportData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Dữ liệu phải là một object');
    return { isValid: false, errors };
  }
  
  // Check for new format (with metadata)
   if (data.metadata && data.content) {
     // New format validation
     if (!data.content.readingPassage) {
       errors.push('Thiếu readingPassage trong content');
     } else if (!data.content.readingPassage.title || typeof data.content.readingPassage.title !== 'string') {
       errors.push('Thiếu title trong readingPassage');
     }
     
     if (!Array.isArray(data.content.questionGroups)) {
       errors.push('questionGroups phải là array');
     } else if (data.content.questionGroups.length === 0) {
       errors.push('Phải có ít nhất 1 nhóm câu hỏi');
     }
   } else {
    // Legacy format validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Thiếu title');
    }
    
    if (!data.passage || typeof data.passage !== 'string') {
      errors.push('Thiếu passage');
    }
    
    if (!Array.isArray(data.questionGroups)) {
      errors.push('questionGroups phải là array');
    } else if (data.questionGroups.length === 0) {
      errors.push('Phải có ít nhất 1 nhóm câu hỏi');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
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
    const data = req.body;
    
    // Validate input data
    const validation = validateImportData(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ: ${validation.errors.join(', ')}`
      });
    }
    
    console.log('Received valid import data:', {
      hasMetadata: !!data.metadata,
      hasImportMetadata: !!data.importMetadata,
      questionGroupsCount: data.content?.questionGroups?.length || data.questionGroups?.length || 0,
      source: data.importMetadata?.source || 'unknown'
    });
    console.log('=== IMPORTING IELTS READING DATA ===');
    let passagesCreated = 0;
    let questionsCreated = 0;

    if (data.metadata && data.content && data.content.readingPassage) {
      const metadata = data.metadata;
      const readingPassage = data.content.readingPassage;
      const questionGroups = data.content.questionGroups || [];
      // Tạo passage với cấu trúc JSON mới
      const passageTitle = readingPassage.title || metadata.title || 'Imported Reading Passage';
      
      // Xử lý content cho hiển thị (giữ lại định dạng cũ để tương thích)
      let passageContent = '';
      if (Array.isArray(readingPassage.paragraphs)) {
        passageContent = readingPassage.paragraphs.map((p: any) => {
          const paragraphId = p.id ? `[${p.id}] ` : '';
          return paragraphId + p.content;
        }).join('\n\n');
              } else {
        passageContent = readingPassage.content || '';
      }
      
      // Trước khi lưu vào database, log chi tiết dữ liệu
      console.log('=== IMPORT DEBUG ===');
      console.log('passage_data:', JSON.stringify(readingPassage, null, 2));
      console.log('content:', data.content);
      console.log('summary:', JSON.stringify(data.summary, null, 2));
      console.log('question_groups:', JSON.stringify(questionGroups, null, 2));
      console.log('=== END IMPORT DEBUG ===');

      // Chuẩn hóa paragraphs cho passage_data
      const formattedParagraphs = readingPassage.paragraphs.map((p: any, index: number) => {
        if (typeof p === 'string') {
          const match = p.match(/^([A-Z])\.\s*(.*)/); // Bỏ flag /s
          if (match) {
            return { id: match[1], content: match[2].trim() };
          }
          return { id: String.fromCharCode(65 + index), content: p };
        }
        // Nếu đã là object đúng chuẩn thì giữ nguyên
        return p;
      });

      const passageToCreate = {
        title: readingPassage.title || metadata.title,
        passage_data: {
          title: readingPassage.title,
          subtitle: readingPassage.subtitle,
          paragraphs: formattedParagraphs,
        },
        summary: data.summary || {},
        level: 'intermediate' as any, // Fix type cho level
        category: metadata.title,
        time_limit: 60,
        is_active: true,
        content: '',
      };

      const passageRecord = await prisma.ielts_reading_passages.create({
        data: passageToCreate,
      });
      passagesCreated++;

      // Xử lý các nhóm câu hỏi
      for (const group of questionGroups) {
        if (!group.questions || !Array.isArray(group.questions)) continue;

        console.log('=== PROCESSING GROUP ===');
        console.log('Group type:', group.type);
        console.log('Group range:', group.range);
        console.log('Group instructions:', group.instructions);
        console.log('Questions count:', group.questions.length);

        // Xử lý options cho mọi loại group
        let groupOptions = null;
        if (group.options) {
          if (Array.isArray(group.options)) {
            groupOptions = group.options;
          } else if (typeof group.options === 'object') {
            // Chuyển object key-value thành mảng {key, value}
            groupOptions = Object.entries(group.options).map(([key, value]) => ({ key, value }));
          }
        } else if (group.questions && group.questions[0]?.options) {
          // Một số loại options nằm trong từng câu hỏi
          const qOpts = group.questions[0].options;
          if (Array.isArray(qOpts)) {
            groupOptions = qOpts;
          } else if (typeof qOpts === 'object') {
            groupOptions = Object.entries(qOpts).map(([key, value]) => ({ key, value }));
          }
        }

        // Xử lý content/contentSegments cho các loại completion, note, table, diagram, summary
        let groupContent = null;
        if (group.contentSegments) {
          groupContent = group.contentSegments;
        } else if (group.content) {
          groupContent = group.content;
        }

        // Đảm bảo luôn có instructions, ưu tiên trường instructions, sau đó content, sau đó contentSegments
        let instructions = group.instructions;
        if (!instructions) {
          if (typeof group.content === 'string') {
            instructions = group.content;
          } else if (Array.isArray(group.contentSegments)) {
            instructions = group.contentSegments.map((seg: any) => seg.value || '').join(' ');
          } else if (group.questions && group.questions[0]?.content) {
            instructions = group.questions[0].content;
          } else {
            instructions = 'No instructions';
          }
        }

        // Chuẩn hóa question_type cho mọi loại
        const questionType = mapQuestionType(group.type);

        const questionGroupData = {
          instructions: instructions,
          question_type: questionType,
          display_order: parseInt(group.range?.split('-')[0] || '0'),
          passage_id: passageRecord.id,
          options: groupOptions ? groupOptions : undefined,
          content: groupContent ? groupContent : undefined
        };

        console.log('=== GROUP DATA TO SAVE ===');
        console.log('Group data:', JSON.stringify(questionGroupData, null, 2));

        // Đảm bảo content và options luôn là string hoặc null
        let groupContentStr = questionGroupData.content;
        if (groupContentStr && typeof groupContentStr !== 'string') {
          groupContentStr = JSON.stringify(groupContentStr);
        }
        let groupOptionsStr = questionGroupData.options;
        if (groupOptionsStr && typeof groupOptionsStr !== 'string') {
          groupOptionsStr = JSON.stringify(groupOptionsStr);
        }
        // Gán lại vào object lưu DB
        questionGroupData.content = groupContentStr ?? null;
        questionGroupData.options = groupOptionsStr ?? null;

        const groupRecord = await prisma.ielts_reading_question_groups.create({
          data: questionGroupData,
        });

        // Tạo các câu hỏi con
        const questionsToCreate = group.questions.map((q: any) => {
          let questionText = '';
          
          // Xử lý question_text theo loại
          switch (group.type) {
            case 'COMPLETION':
              // Với completion, question_text có thể rỗng vì content đã ở group
              questionText = '';
              break;
            case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS':
              // Với multiple choice, lấy content từ question
              questionText = q.content || '';
              break;
            default:
              // Các loại khác
              questionText = q.content || '';
          }

          return {
            question_text: questionText,
            question_type: mapQuestionType(group.type),
            options: null, // Options được lưu ở group level
            correct_answer: q.answer,
            explanation: q.guide,
            order_index: q.id,
            group_id: groupRecord.id,
          };
        });

        if (questionsToCreate.length > 0) {
          await prisma.ielts_reading_questions.createMany({
            data: questionsToCreate,
          });
          questionsCreated += questionsToCreate.length;
          console.log(`Created ${questionsToCreate.length} questions for group ${groupRecord.id}`);
        }
      }
    } else {
      throw new Error('Invalid data structure.');
    }
    console.log('=== IMPORT COMPLETED ===');
    console.log(`Created ${passagesCreated} passages and ${questionsCreated} questions`);
    
    // Log import metadata if available
    if (data.importMetadata) {
      console.log('Import metadata:', {
        source: data.importMetadata.source,
        sourceUrl: data.importMetadata.sourceUrl,
        fileName: data.importMetadata.fileName,
        importedAt: data.importMetadata.importedAt
      });
    }

    res.status(200).json({
      success: true,
      message: 'Import successful',
      passagesCreated,
      questionsCreated,
      importMetadata: data.importMetadata || null
    });
  } catch (error) {
    console.error('=== IMPORT ERROR ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

// === STRATEGY FUNCTIONS ===
function processCompletionGroup(group: any, groupId: string) {
  // Tạo text hoàn chỉnh với các blank
  const fullText = group.contentSegments
    ? group.contentSegments.map((seg: any) => seg.type === 'text' ? seg.value : '________').join('')
    : '';
  return group.questions.map((q: any, idx: number) => {
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      options: q.options,
      guide: q.guide,
      // ... các trường khác nếu có ...
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    return {
      question_text: fullText,
      question_type: mapQuestionType(group.type),
      options: null,
      correct_answer: q.answer,
      explanation: q.guide || '',
      note: group.name || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processMultipleAnswerGroup(group: any, groupId: string) {
  const options = Array.isArray(group.options)
    ? group.options
    : Object.values(group.options || {});
  const correctAnswer = Array.isArray(group.answers)
    ? group.answers.join(', ')
    : group.answers || '';
  return group.questions.map((q: any, idx: number) => {
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      options: q.options,
      guide: q.guide,
      // ... các trường khác nếu có ...
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    return {
      question_text: group.content || group.instructions || '',
      question_type: mapQuestionType(group.type),
      options,
      correct_answer: correctAnswer,
      explanation: q.guide || group.guide || '',
      note: group.name || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processMatchingHeadings(group: any, groupId: string) {
  // Có thể có headingOptions
  const options = group.headingOptions || null;
  return group.questions.map((q: any, idx: number) => {
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      options: q.options,
      guide: q.guide,
      // ... các trường khác nếu có ...
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    return {
      question_text: q.content,
      question_type: mapQuestionType(group.type),
      options,
      correct_answer: q.answer,
      explanation: q.guide || '',
      note: group.name || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processStandardMatchingGroup(group: any, groupId: string) {
  // Có thể có featureOptions hoặc các options khác
  const options = group.featureOptions || group.options || null;
  return group.questions.map((q: any, idx: number) => {
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      options: q.options,
      guide: q.guide,
      // ... các trường khác nếu có ...
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    return {
      question_text: q.content,
      question_type: mapQuestionType(group.type),
      options,
      correct_answer: q.answer,
      explanation: q.guide || '',
      note: group.name || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processSimpleQuestionGroup(group: any, groupId: string) {
  const options = group.options || null;
  return group.questions.map((q: any, idx: number) => {
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      options: q.options,
      guide: q.guide,
      // ... các trường khác nếu có ...
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    return {
      question_text: q.content,
      question_type: mapQuestionType(group.type),
      options,
      correct_answer: q.answer,
      explanation: q.guide || '',
      note: group.name || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

// Enhanced helper function to map and validate question types
function mapQuestionType(type: string): string {
  // Trim input but preserve case for uppercase variants
  const trimmedType = type?.trim() || '';
  const normalizedType = trimmedType.toLowerCase();
  
  // Comprehensive type mapping with aliases - mapped to actual Prisma enum values
  const typeMap: { [key: string]: string } = {
    // Uppercase variants (from JSON files)
    'MATCHING_INFORMATION': 'matching_information',
    'MULTIPLE_CHOICE_MULTIPLE_ANSWERS': 'multiple_choice_group',
    'COMPLETION': 'summary_completion',
    'TRUE_FALSE_NOT_GIVEN': 'true_false_not_given',
    'YES_NO_NOT_GIVEN': 'yes_no_not_given',
    'MATCHING_HEADINGS': 'matching_headings',
    'MATCHING_FEATURES': 'matching_features',
    'MATCHING_SENTENCE_ENDINGS': 'matching_sentence_endings',
    'SENTENCE_COMPLETION': 'sentence_completion',
    'NOTE_COMPLETION': 'note_completion',
    'TABLE_COMPLETION': 'table_completion',
    'FLOW_CHART_COMPLETION': 'flow_chart_completion',
    'DIAGRAM_LABELLING': 'diagram_labelling',
    'SHORT_ANSWER_QUESTIONS': 'short_answer_questions',
    'MULTIPLE_CHOICE': 'multiple_choice',
    'MULTIPLE_CHOICE_5': 'multiple_choice_5',
    
    // Multiple choice types
    'multiple_choice': 'multiple_choice',
    'multiplechoice': 'multiple_choice',
    'mc': 'multiple_choice',
    'choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    'multiple_choice_group': 'multiple_choice_group',
    'multiple_choice_multiple_answers': 'multiple_choice_group',
    
    // True/False/Not Given
    'true_false_not_given': 'true_false_not_given',
    'true/false/not given': 'true_false_not_given',
    'tfng': 'true_false_not_given',
    'truefalse': 'true_false_not_given',
    
    // Yes/No/Not Given
    'yes_no_not_given': 'yes_no_not_given',
    'yes/no/not given': 'yes_no_not_given',
    'ynng': 'yes_no_not_given',
    'yesno': 'yes_no_not_given',
    
    // Completion types
    'completion': 'summary_completion',
    'sentence_completion': 'sentence_completion',
    'fill_in_blank': 'sentence_completion',
    'fill_blank': 'sentence_completion',
    'blank': 'sentence_completion',
    'gap_fill': 'sentence_completion',
    'summary_completion': 'summary_completion',
    'note_completion': 'note_completion',
    'table_completion': 'table_completion',
    'flow_chart_completion': 'flow_chart_completion',
    
    // Matching types
    'matching_headings': 'matching_headings',
    'matching headings': 'matching_headings',
    'headings': 'matching_headings',
    'matching_information': 'matching_information',
    'matching_features': 'matching_features',
    'matching_sentence_endings': 'matching_sentence_endings',
    'matching': 'matching_information',
    'match': 'matching_information',
    
    // Short answer
    'short_answer': 'short_answer_questions',
    'short answer': 'short_answer_questions',
    'shortanswer': 'short_answer_questions',
    'short': 'short_answer_questions',
    'short_answer_questions': 'short_answer_questions',
    
    // Diagram labelling
    'diagram_labelling': 'diagram_labelling',
    'diagram': 'diagram_labelling',
    'labelling': 'diagram_labelling'
  };
  
  // Try exact match first (for uppercase variants), then lowercase match
  const mappedType = typeMap[trimmedType] || typeMap[normalizedType];
  
  if (!mappedType) {
    console.warn(`Unknown question type: "${type}", defaulting to multiple_choice`);
    return 'multiple_choice';
  }
  
  return mappedType;
}