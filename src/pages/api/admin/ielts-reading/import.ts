import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, IeltsQuestionType } from '@prisma/client';

// Helper function to build question text from contentSegments for completion questions
function buildQuestionTextFromContentSegments(contentSegments: any[], questionId: number): string {
  if (!Array.isArray(contentSegments)) return '';
  
  // Find the target blank and extract context around it
  let targetBlankIndex = -1;
  let blankCounter = 0;
  
  // First pass: find the target blank position
  for (let i = 0; i < contentSegments.length; i++) {
    const segment = contentSegments[i];
    if (segment.type === 'blank') {
      blankCounter++;
      if (segment.questionId === questionId) {
        targetBlankIndex = i;
        break;
      }
    }
  }
  
  if (targetBlankIndex === -1) return '';
  
  // Extract context: previous text + blank + next text
  let questionText = '';
  let contextStart = Math.max(0, targetBlankIndex - 1);
  let contextEnd = Math.min(contentSegments.length - 1, targetBlankIndex + 1);
  
  // Extend context to include more meaningful text
  while (contextStart > 0 && contentSegments[contextStart].type === 'text' && 
         contentSegments[contextStart].value && contentSegments[contextStart].value.length < 50) {
    contextStart--;
  }
  
  while (contextEnd < contentSegments.length - 1 && contentSegments[contextEnd].type === 'text' && 
         contentSegments[contextEnd].value && contentSegments[contextEnd].value.length < 50) {
    contextEnd++;
  }
  
  // Build the question text with context
  let currentBlankNumber = 0;
  for (let i = 0; i <= contextEnd; i++) {
    const segment = contentSegments[i];
    if (segment.type === 'blank') {
      currentBlankNumber++;
    }
    
    if (i >= contextStart) {
      if (segment.type === 'text') {
        questionText += segment.value || '';
      } else if (segment.type === 'blank') {
        if (segment.questionId === questionId) {
          questionText += `(${currentBlankNumber}) ______`;
        } else {
          questionText += `(${currentBlankNumber}) ______`;
        }
      }
    }
  }
  
  return questionText.trim();
}

const prisma = new PrismaClient();

// Structured logger
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Enhanced validation function
function validateImportData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Dữ liệu phải là một object');
    return { isValid: false, errors };
  }
  
  // Check for new format (with metadata and content)
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
  }
  // Check for JsonImporter format (with passage object and questionGroups)
  else if (data.passage && typeof data.passage === 'object' && data.questionGroups) {
    // JsonImporter format validation
    if (!data.passage.title || typeof data.passage.title !== 'string') {
      errors.push('Thiếu title trong passage');
    }
    
    if (!data.passage.content || typeof data.passage.content !== 'string') {
      errors.push('Thiếu content trong passage');
    }
    
    if (!Array.isArray(data.questionGroups)) {
      errors.push('questionGroups phải là array');
    } else if (data.questionGroups.length === 0) {
      errors.push('Phải có ít nhất 1 nhóm câu hỏi');
    }
  }
  // Legacy format validation
  else {
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
  const startTime = Date.now();
  logger.info('Import request started', { method: req.method });
  
  if (req.method !== 'POST') {
    logger.error('Method not allowed', { method: req.method });
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use POST.' 
    });
  }

  // Check authentication
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    logger.error('Unauthorized - missing firebase_uid');
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized - Missing authentication' 
    });
  }

  // Check if user is admin
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    logger.error('Forbidden - user is not admin');
    return res.status(403).json({ 
      success: false,
      message: 'Forbidden - Admin access required' 
    });
  }

  try {
    const data = req.body;
    logger.info('Import request received', {
      dataKeys: Object.keys(data),
      hasMetadata: !!data.metadata,
      hasContent: !!data.content,
      hasQuestionGroups: !!data.questionGroups,
      dataType: typeof data
    });
    
    // Validate input data
    const validation = validateImportData(data);
    logger.info('Validation result', validation);
    
    if (!validation.isValid) {
      logger.error('Validation failed', validation.errors);
      return res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ: ${validation.errors.join(', ')}`
      });
    }
    
    logger.info('Starting import process', {
      hasMetadata: !!data.metadata,
      hasImportMetadata: !!data.importMetadata,
      questionGroupsCount: data.content?.questionGroups?.length || data.questionGroups?.length || 0,
      source: data.importMetadata?.source || 'unknown'
    });
    
    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let passagesCreated = 0;
      let questionsCreated = 0;
      let passageRecord: any;

      // Handle JsonImporter format (data.passage object + data.questionGroups)
      if (data.passage && typeof data.passage === 'object' && data.questionGroups) {
        logger.info('Processing JsonImporter format');
        const passage = data.passage;
        const questionGroups = data.questionGroups;
        
        // Create passage record
        const passageToCreate = {
          title: passage.title,
          passage_data: {
            title: passage.title,
            content: passage.content,
            level: passage.level || 'intermediate',
            timeLimit: passage.timeLimit || 60
          },
          summary: data.metadata || {},
          level: passage.level || 'intermediate',
          category: passage.category || 'reading',
          time_limit: passage.timeLimit || 60,
          is_active: passage.is_active ?? true,
          content: passage.content
        };
        
        logger.info('Creating passage', { title: passageToCreate.title });
        const passageRecord = await tx.ielts_reading_passages.create({
          data: passageToCreate
        });
        passagesCreated++;
      
        // Process question groups
        for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
          const group = questionGroups[groupIndex];
          if (!group.questions || !Array.isArray(group.questions)) continue;
          
          logger.info('Processing question group', { type: group.type, questionsCount: group.questions.length });
          
          // Map question type
          const questionType = mapQuestionType(group.type);
          
          // Prepare group data
          const questionGroupData = {
            instructions: group.instructions || group.name || 'No instructions',
            question_type: questionType,
            display_order: groupIndex + 1, // Use sequential order to avoid conflicts
            passage_id: passageRecord.id,
            options: group.options ? JSON.stringify(group.options) : null,
            content: group.contentSegments ? JSON.stringify(group.contentSegments) : null
          };
          
          const groupRecord = await tx.ielts_reading_question_groups.create({
            data: questionGroupData
          });
          
          // Prepare questions for batch creation
          const questionsToCreate = group.questions.map((question: any, i: number) => {
            // Handle options conversion from object format to string array
            let processedOptions = null;
            if (Array.isArray(question.options)) {
              const convertedOptions = question.options.map((option: any) => {
                // If option is an object with value property, extract the value
                if (typeof option === 'object' && option !== null && option.value) {
                  return String(option.value);
                }
                // Otherwise, convert to string directly
                return String(option);
              });
              processedOptions = JSON.stringify(convertedOptions);
            } else if (question.options) {
              processedOptions = JSON.stringify(question.options);
            }
            
            return {
              group_id: groupRecord.id,
              question_text: question.questionText || '',
              question_type: questionType,
              options: processedOptions,
              correct_answer: question.answer || '',
              explanation: question.guide || null,
              order_index: question.questionNumber || (i + 1)
            };
          });
          
          // Create questions in batch
          if (questionsToCreate.length > 0) {
            await tx.ielts_reading_questions.createMany({
              data: questionsToCreate,
              skipDuplicates: true
            });
            questionsCreated += questionsToCreate.length;
          }
        }
        
        logger.info('JsonImporter format processing completed', {
          passagesCreated,
          questionsCreated
        });
        
        return {
          passageRecord,
          passagesCreated,
          questionsCreated
        };
      }
      // Handle new format (data.metadata + data.content)
      else if (data.metadata && data.content && data.content.readingPassage) {
        const metadata = data.metadata;
        const readingPassage = data.content.readingPassage;
        const questionGroups = data.content.questionGroups || [];
        
        logger.info('Processing new format', {
          title: metadata.title,
          level: metadata.level,
          questionGroupCount: questionGroups.length
        });
        
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
      
        // Log chi tiết dữ liệu trước khi lưu vào database
        logger.info('Import debug data', {
          passageData: readingPassage,
          content: data.content,
          summary: data.summary,
          questionGroups: questionGroups
        });

        // Chuẩn hóa paragraphs cho passage_data
        let formattedParagraphs = [];
        if (readingPassage.paragraphs && Array.isArray(readingPassage.paragraphs)) {
          formattedParagraphs = readingPassage.paragraphs.map((p: any, index: number) => {
            if (typeof p === 'string') {
              const match = p.match(/^([A-Z])\. *(.*)/); // Bỏ flag /s
              if (match) {
                return { id: match[1], content: match[2].trim() };
              }
              return { id: String.fromCharCode(65 + index), content: p };
            }
            // Nếu đã là object đúng chuẩn thì giữ nguyên
            return p;
          });
        } else if (readingPassage.content) {
          // Nếu không có paragraphs, tạo một paragraph từ content
          formattedParagraphs = [{ id: 'A', content: readingPassage.content }];
        }

        const passageToCreate = {
          title: readingPassage.title || metadata.title,
          passage_data: {
            title: readingPassage.title,
            subtitle: readingPassage.subtitle,
            paragraphs: formattedParagraphs,
          },
          summary: data.summary || {},
          level: 'intermediate' as any,
          category: metadata.title,
          time_limit: 60,
          is_active: true,
          content: passageContent,
        };

        passageRecord = await tx.ielts_reading_passages.create({
          data: passageToCreate,
        });
        passagesCreated++;
        
        logger.info('Created passage', { 
          id: passageRecord.id, 
          title: passageRecord.title 
        });

        // Xử lý các nhóm câu hỏi
        for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
          const group = questionGroups[groupIndex];
          if (!group.questions || !Array.isArray(group.questions)) continue;

          logger.info('Processing question group', {
            type: group.type,
            range: group.range,
            instructions: group.instructions,
            questionCount: group.questions.length
          });

          // Xử lý options cho mọi loại group
          let groupOptions = null;
          if (group.options) {
            if (Array.isArray(group.options)) {
              // Convert options from object format to string array if needed
              groupOptions = group.options.map((option: any) => {
                if (typeof option === 'object' && option !== null && option.value) {
                  return String(option.value);
                }
                return String(option);
              });
            } else if (typeof group.options === 'object') {
              // Chuyển object key-value thành mảng string
              groupOptions = Object.entries(group.options).map(([key, value]) => String(value));
            }
          } else if (group.questions && group.questions[0]?.options) {
            // Một số loại options nằm trong từng câu hỏi
            const qOpts = group.questions[0].options;
            if (Array.isArray(qOpts)) {
              groupOptions = qOpts.map((option: any) => {
                if (typeof option === 'object' && option !== null && option.value) {
                  return String(option.value);
                }
                return String(option);
              });
            } else if (typeof qOpts === 'object') {
              groupOptions = Object.entries(qOpts).map(([key, value]) => String(value));
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
          
          // Đặc biệt xử lý cho choose_two_letters - đảm bảo luôn có options
          if (questionType === 'choose_two_letters' && (!groupOptions || groupOptions.length === 0)) {
            // Tạo options mặc định A-E cho choose_two_letters
            groupOptions = ['A', 'B', 'C', 'D', 'E'];
            logger.info('Added default options for choose_two_letters', { groupOptions });
          }

          // Đảm bảo content và options luôn là string hoặc null
          let groupContentStr = groupContent;
          if (groupContentStr && typeof groupContentStr !== 'string') {
            groupContentStr = JSON.stringify(groupContentStr);
          }
          let groupOptionsStr = groupOptions;
          if (groupOptionsStr && typeof groupOptionsStr !== 'string') {
            groupOptionsStr = JSON.stringify(groupOptionsStr);
          }

          const questionGroupData = {
            instructions: instructions,
            question_type: questionType,
            display_order: groupIndex + 1, // Use sequential order to avoid conflicts
            passage_id: passageRecord.id,
            options: groupOptionsStr ?? null,
            content: groupContentStr ?? null
          };

          logger.info('Group data to save', { 
            questionGroupData,
            originalGroupOptions: groupOptions,
            processedGroupOptions: groupOptionsStr
          });

          const groupRecord = await tx.ielts_reading_question_groups.create({
            data: questionGroupData,
          });
          
          logger.info('Created question group', { 
            id: groupRecord.id, 
            type: groupRecord.question_type,
            questionCount: group.questions?.length || 0
          });

          // Tạo các câu hỏi con sử dụng strategy functions
          let questionsToCreate: any[] = [];
          
          // Sử dụng strategy functions để xử lý từng loại nhóm câu hỏi
          switch (group.type) {
            case 'note_table_flowchart_diagram_completion':
            case 'NOTE_TABLE_FLOWCHART_DIAGRAM_COMPLETION':
            case 'COMPLETION':
              questionsToCreate = processCompletionGroup(group, groupRecord.id);
              break;
            case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS':
              questionsToCreate = processMultipleAnswerGroup(group, groupRecord.id);
              break;
            case 'MATCHING_HEADINGS':
            case 'matching_headings':
              questionsToCreate = processMatchingHeadings(group, groupRecord.id);
              break;
            case 'MATCHING_FEATURES':
            case 'MATCHING_INFORMATION':
            case 'matching_features':
            case 'matching_information':
              questionsToCreate = processStandardMatchingGroup(group, groupRecord.id);
              break;
            default:
              questionsToCreate = processSimpleQuestionGroup(group, groupRecord.id);
              break;
          }

          if (questionsToCreate.length > 0) {
            logger.info('Creating questions for group', {
              questionCount: questionsToCreate.length,
              groupId: groupRecord.id
            });
            
            await tx.ielts_reading_questions.createMany({
              data: questionsToCreate,
            });
            questionsCreated += questionsToCreate.length;
            
            logger.info('Successfully created questions for group', {
              questionCount: questionsToCreate.length,
              groupId: groupRecord.id
            });
          }
        }
      
        return {
          passageRecord,
          passagesCreated,
          questionsCreated
        };
      } else {
        logger.error('Invalid data structure - missing required fields');
        throw new Error('Invalid data structure.');
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info('Import completed successfully', {
      duration,
      passagesCreated: result.passagesCreated,
      questionsCreated: result.questionsCreated,
      performance: {
        questionsPerSecond: result.questionsCreated / (duration / 1000)
      }
    });
    
    // Log import metadata if available
    if (data.importMetadata) {
      logger.info('Import metadata', {
        source: data.importMetadata.source,
        sourceUrl: data.importMetadata.sourceUrl,
        fileName: data.importMetadata.fileName,
        importedAt: data.importMetadata.importedAt
      });
    }

    const response = {
      success: true,
      message: `Import thành công: ${result.passagesCreated} passage, ${result.questionsCreated} câu hỏi`,
      passage: {
        id: result.passageRecord.id,
        title: result.passageRecord.title,
        content: result.passageRecord.content,
        summary: result.passageRecord.summary,
        level: result.passageRecord.level,
        category: result.passageRecord.category,
        time_limit: result.passageRecord.time_limit,
        is_active: result.passageRecord.is_active
      },
      stats: {
        passagesCreated: result.passagesCreated,
        questionsCreated: result.questionsCreated,
        duration
      },
      importMetadata: data.importMetadata || null
    };
    
    logger.info('Sending success response');
    res.status(200).json(response);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.error('Import failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu trùng lặp - passage hoặc question đã tồn tại',
          error: 'DUPLICATE_DATA'
        });
      }
      
      if (error.message.includes('P2003')) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu tham chiếu không hợp lệ',
          error: 'INVALID_REFERENCE'
        });
      }
    }
    
    const errorResponse = {
      success: false,
      message: 'Import thất bại',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
    
    logger.error('Sending error response');
    res.status(500).json(errorResponse);
  } finally {
    logger.info('Disconnecting from database');
    await prisma.$disconnect();
  }
}

// === STRATEGY FUNCTIONS ===
function processCompletionGroup(group: any, groupId: string) {
  return group.questions.map((q: any, idx: number) => {
    // Tạo question_text riêng cho từng câu hỏi dựa trên contentSegments
    let questionText = '';
    
    if (group.contentSegments && Array.isArray(group.contentSegments)) {
      // Sử dụng logic từ buildQuestionTextFromSegments để tạo context cho từng câu hỏi
      questionText = buildQuestionTextFromContentSegments(group.contentSegments, q.id);
    }
    
    // Fallback nếu không có contentSegments hoặc không tìm thấy context
    if (!questionText) {
      questionText = q.content || q.questionText || `Question ${q.id}: Fill in the blank`;
    }
    
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
      generatedQuestionText: questionText,
      hasContentSegments: !!group.contentSegments
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    
    return {
      question_text: questionText,
      question_type: mapQuestionType(group.type),
      options: null,
      correct_answer: q.answer,
      explanation: q.guide || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processMultipleAnswerGroup(group: any, groupId: string) {
  let options = Array.isArray(group.options)
    ? group.options
    : Object.values(group.options || {});
  
  // Convert options from object format to string array if needed
  if (Array.isArray(options)) {
    options = options.map((option: any) => {
      if (typeof option === 'object' && option !== null && option.value) {
        return String(option.value);
      }
      return String(option);
    });
  }
  
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
    
    // Serialize options if it's an object/array
    let serializedOptions = options;
    if (options && typeof options === 'object') {
      serializedOptions = JSON.stringify(options);
    }
    
    return {
      question_text: group.content || group.instructions || '',
      question_type: mapQuestionType(group.type),
      options: serializedOptions,
      correct_answer: correctAnswer,
      explanation: q.guide || group.guide || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processMatchingHeadings(group: any, groupId: string) {
  // Có thể có headingOptions
  let options = group.headingOptions || null;
  
  // Convert options from object format to string array if needed
  if (Array.isArray(options)) {
    options = options.map((option: any) => {
      if (typeof option === 'object' && option !== null && option.value) {
        return String(option.value);
      }
      return String(option);
    });
  }
  
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
    
    // Serialize options if it's an object/array
    let serializedOptions = options;
    if (options && typeof options === 'object') {
      serializedOptions = JSON.stringify(options);
    }
    
    return {
      question_text: q.content,
      question_type: mapQuestionType(group.type),
      options: serializedOptions,
      correct_answer: q.answer,
      explanation: q.guide || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processStandardMatchingGroup(group: any, groupId: string) {
  // Có thể có featureOptions hoặc các options khác
  let options = group.featureOptions || group.options || null;
  
  // Convert options from object format to string array if needed
  if (Array.isArray(options)) {
    options = options.map((option: any) => {
      if (typeof option === 'object' && option !== null && option.value) {
        return String(option.value);
      }
      return String(option);
    });
  }
  
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
    
    // Serialize options if it's an object/array
    let serializedOptions = options;
    if (options && typeof options === 'object') {
      serializedOptions = JSON.stringify(options);
    }
    
    return {
      question_text: q.content,
      question_type: mapQuestionType(group.type),
      options: serializedOptions,
      correct_answer: q.answer,
      explanation: q.guide || '',
      order_index: q.id || idx + 1,
      group_id: groupId,
    };
  });
}

function processSimpleQuestionGroup(group: any, groupId: string) {
  let options = group.options || null;
  
  // Convert options from object format to string array if needed
  if (Array.isArray(options)) {
    options = options.map((option: any) => {
      if (typeof option === 'object' && option !== null && option.value) {
        return String(option.value);
      }
      return String(option);
    });
  }
  
  // Auto-generate options for choose_two_letters if missing
  const questionType = mapQuestionType(group.type);
  if (questionType === 'choose_two_letters' && (!options || options.length === 0)) {
    options = ['A', 'B', 'C', 'D', 'E'];
    console.log(`[processSimpleQuestionGroup] Auto-generated options for choose_two_letters:`, options);
  }
  
  return group.questions.map((q: any, idx: number) => {
    // Use question-specific options if available, otherwise use group options
    let questionOptions = q.options || options;
    
    // Auto-generate options for individual choose_two_letters questions if missing
    if (questionType === 'choose_two_letters' && (!questionOptions || questionOptions.length === 0)) {
      questionOptions = ['A', 'B', 'C', 'D', 'E'];
      console.log(`[processSimpleQuestionGroup] Auto-generated question options for choose_two_letters question ${q.id}:`, questionOptions);
    }
    
    // Trong vòng lặp tạo từng câu hỏi (trước khi lưu vào DB)
    console.log('=== IMPORT QUESTION DEBUG ===');
    console.log({
      groupType: group.type,
      mappedType: questionType,
      groupId,
      questionId: q.id,
      content: q.content,
      answer: q.answer,
      groupOptions: options,
      questionOptions: questionOptions,
      finalOptions: questionOptions,
      guide: q.guide,
    });
    console.log('=== END IMPORT QUESTION DEBUG ===');
    
    // Serialize options if it's an object/array
    let serializedOptions = questionOptions;
    if (questionOptions && typeof questionOptions === 'object') {
      serializedOptions = JSON.stringify(questionOptions);
    }
    
    return {
      question_text: q.content,
      question_type: questionType,
      options: serializedOptions,
      correct_answer: q.answer,
      explanation: q.guide || '',
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
    
    // Special combined completion types
    'note_table_flowchart_diagram_completion': 'note_completion',
    'NOTE_TABLE_FLOWCHART_DIAGRAM_COMPLETION': 'note_completion',
    
    // Multiple choice types
    'multiple_choice': 'multiple_choice',
    'multiplechoice': 'multiple_choice',
    'mc': 'multiple_choice',
    'choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    'multiple_choice_group': 'multiple_choice_group',
    'multiple_choice_multiple_answers': 'multiple_choice_group',
    'choose_two_letters': 'choose_two_letters',
    'CHOOSE_TWO_LETTERS': 'choose_two_letters',
    
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
    'matching_phrases': 'matching_phrases',
    'MATCHING_PHRASES': 'matching_phrases',
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