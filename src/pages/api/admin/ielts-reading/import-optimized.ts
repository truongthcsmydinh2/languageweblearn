import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, IeltsQuestionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Enhanced validation schemas with Zod
const ParagraphSchema = z.object({
  id: z.string(),
  content: z.string().min(1)
});

const QuestionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  content: z.string().optional(),
  questionText: z.string().optional(),
  answer: z.string(),
  guide: z.string().optional(),
  options: z.array(z.string()).optional()
});

const QuestionGroupSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  instructions: z.string().optional(),
  range: z.string().optional(),
  questions: z.array(QuestionSchema),
  options: z.union([
    z.array(z.string()),
    z.record(z.string()),
    z.array(z.object({ key: z.string(), value: z.string() }))
  ]).optional(),
  contentSegments: z.array(z.object({
    type: z.string(),
    value: z.string()
  })).optional(),
  content: z.string().optional()
});

const ReadingPassageSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  paragraphs: z.array(z.union([z.string(), ParagraphSchema]))
});

const MetadataSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().min(1),
  date: z.string().optional(),
  modified: z.string().optional(),
  slug: z.string().optional(),
  link: z.string().optional(),
  guid: z.string().optional()
});

const ContentSchema = z.object({
  readingPassage: ReadingPassageSchema,
  questionGroups: z.array(QuestionGroupSchema)
});

// New format schema
const NewFormatSchema = z.object({
  metadata: MetadataSchema,
  content: ContentSchema,
  summary: z.record(z.any()).optional()
});

// JsonImporter format schema
const JsonImporterSchema = z.object({
  passage: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    level: z.string().optional(),
    category: z.string().optional(),
    timeLimit: z.number().optional(),
    is_active: z.boolean().optional()
  }),
  questionGroups: z.array(QuestionGroupSchema)
});

// Union schema for all supported formats
const ImportDataSchema = z.union([NewFormatSchema, JsonImporterSchema]);

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

// Enhanced question type mapping
function mapQuestionType(type: string): IeltsQuestionType {
  const trimmedType = type?.trim() || '';
  const normalizedType = trimmedType.toLowerCase();
  
  const typeMap: { [key: string]: IeltsQuestionType } = {
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
    
    // Lowercase variants
    'multiple_choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    'multiple_choice_group': 'multiple_choice_group',
    'true_false_not_given': 'true_false_not_given',
    'yes_no_not_given': 'yes_no_not_given',
    'matching_headings': 'matching_headings',
    'matching_information': 'matching_information',
    'matching_features': 'matching_features',
    'matching_sentence_endings': 'matching_sentence_endings',
    'sentence_completion': 'sentence_completion',
    'summary_completion': 'summary_completion',
    'note_completion': 'note_completion',
    'table_completion': 'table_completion',
    'flow_chart_completion': 'flow_chart_completion',
    'diagram_labelling': 'diagram_labelling',
    'short_answer_questions': 'short_answer_questions',
    
    // Special combined completion types
    'note_table_flowchart_diagram_completion': 'note_completion',
    'NOTE_TABLE_FLOWCHART_DIAGRAM_COMPLETION': 'note_completion',
    
    // Common aliases
    'completion': 'summary_completion',
    'fill_in_blank': 'sentence_completion',
    'matching': 'matching_information',
    'short_answer': 'short_answer_questions'
  };
  
  const mappedType = typeMap[trimmedType] || typeMap[normalizedType];
  
  if (!mappedType) {
    logger.warn(`Unknown question type: "${type}", defaulting to multiple_choice`);
    return 'multiple_choice';
  }
  
  return mappedType;
}

// Process paragraphs to ensure consistent format
function processParagraphs(paragraphs: any[]): { id: string; content: string }[] {
  return paragraphs.map((p: any, index: number) => {
    if (typeof p === 'string') {
      const match = p.match(/^([A-Z])\. (.*)/);
      if (match) {
        return { id: match[1], content: match[2].trim() };
      }
      return { id: String.fromCharCode(65 + index), content: p };
    }
    return p;
  });
}

// Create passage content for display
function createPassageContent(paragraphs: { id: string; content: string }[]): string {
  return paragraphs.map(p => `[${p.id}] ${p.content}`).join('\n\n');
}

// Process question groups with enhanced error handling
function processQuestionGroups(questionGroups: any[], passageId: number) {
  const groupsData = [];
  const questionsData = [];
  
  for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
    const group = questionGroups[groupIndex];
    
    if (!group.questions || !Array.isArray(group.questions)) {
      logger.warn(`Group ${groupIndex} has no questions, skipping`);
      continue;
    }
    
    // Process group options
    let groupOptions = null;
    if (group.options) {
      if (Array.isArray(group.options)) {
        groupOptions = group.options;
      } else if (typeof group.options === 'object') {
        groupOptions = Object.entries(group.options).map(([key, value]) => ({ key, value }));
      }
    }
    
    // Process group content
    let groupContent = null;
    if (group.contentSegments) {
      groupContent = group.contentSegments;
    } else if (group.content) {
      groupContent = group.content;
    }
    
    // Determine instructions
    let instructions = group.instructions;
    if (!instructions) {
      if (typeof group.content === 'string') {
        instructions = group.content;
      } else if (Array.isArray(group.contentSegments)) {
        instructions = group.contentSegments.map((seg: any) => seg.value || '').join(' ');
      } else {
        instructions = 'No instructions';
      }
    }
    
    const questionType = mapQuestionType(group.type);
    const groupId = `group_${passageId}_${groupIndex}`;
    
    const groupData = {
      id: groupId,
      instructions: instructions,
      question_type: questionType,
      display_order: parseInt(group.range?.split('-')[0] || String(groupIndex + 1)),
      passage_id: passageId,
      content: groupContent ? JSON.stringify(groupContent) : null,
      options: groupOptions ? JSON.stringify(groupOptions) : null
    };
    
    groupsData.push(groupData);
    
    // Process questions for this group
    for (let questionIndex = 0; questionIndex < group.questions.length; questionIndex++) {
      const question = group.questions[questionIndex];
      
      let questionText = '';
      switch (group.type) {
        case 'COMPLETION':
          questionText = '';
          break;
        default:
          questionText = question.content || question.questionText || '';
      }
      
      const questionData = {
        question_text: questionText,
        question_type: questionType,
        options: null, // Options stored at group level
        correct_answer: question.answer || '',
        explanation: question.guide || null,
        order_index: question.id || (questionIndex + 1),
        group_id: groupId
      };
      
      questionsData.push(questionData);
    }
  }
  
  return { groupsData, questionsData };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  logger.info('Import request started', { method: req.method });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use POST.' 
    });
  }

  // Authentication check
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized - Missing authentication' 
    });
  }

  // Admin check
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    return res.status(403).json({ 
      success: false,
      message: 'Forbidden - Admin access required' 
    });
  }

  try {
    const data = req.body;
    logger.info('Validating import data', {
      hasMetadata: !!data.metadata,
      hasContent: !!data.content,
      hasPassage: !!data.passage,
      hasQuestionGroups: !!data.questionGroups
    });
    
    // Validate input data with Zod
    const validationResult = ImportDataSchema.safeParse(data);
    
    if (!validationResult.success) {
      logger.error('Validation failed', validationResult.error.errors);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
    }
    
    const validatedData = validationResult.data;
    logger.info('Data validation successful');
    
    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let passageData: any;
      let questionGroups: any[];
      
      // Handle different data formats
      if ('metadata' in validatedData && 'content' in validatedData) {
        // New format
        const { metadata, content, summary } = validatedData;
        const { readingPassage } = content;
        
        const formattedParagraphs = processParagraphs(readingPassage.paragraphs);
        const passageContent = createPassageContent(formattedParagraphs);
        
        passageData = {
          title: readingPassage.title || metadata.title,
          content: passageContent,
          passage_data: {
            title: readingPassage.title,
            subtitle: readingPassage.subtitle,
            paragraphs: formattedParagraphs
          },
          summary: summary || {},
          level: 'intermediate' as const,
          category: metadata.title,
          time_limit: 60,
          is_active: true
        };
        
        questionGroups = content.questionGroups;
      } else {
        // JsonImporter format
        const { passage } = validatedData;
        
        passageData = {
          title: passage.title,
          content: passage.content,
          passage_data: {
            title: passage.title,
            content: passage.content,
            level: passage.level || 'intermediate',
            timeLimit: passage.timeLimit || 60
          },
          summary: {},
          level: (passage.level || 'intermediate') as const,
          category: passage.category || 'reading',
          time_limit: passage.timeLimit || 60,
          is_active: passage.is_active ?? true
        };
        
        questionGroups = validatedData.questionGroups;
      }
      
      logger.info('Creating passage', { title: passageData.title });
      
      // Create passage
      const passageRecord = await tx.ielts_reading_passages.create({
        data: passageData
      });
      
      logger.info('Passage created', { id: passageRecord.id });
      
      // Process question groups and questions
      const { groupsData, questionsData } = processQuestionGroups(questionGroups, passageRecord.id);
      
      logger.info('Creating question groups', { count: groupsData.length });
      
      // Create question groups in batch
      const createdGroups = await Promise.all(
        groupsData.map(groupData => 
          tx.ielts_reading_question_groups.create({ data: groupData })
        )
      );
      
      logger.info('Question groups created', { count: createdGroups.length });
      
      // Update questions data with actual group IDs
      const updatedQuestionsData = questionsData.map(questionData => {
        const groupIndex = groupsData.findIndex(g => g.id === questionData.group_id);
        return {
          ...questionData,
          group_id: createdGroups[groupIndex].id
        };
      });
      
      logger.info('Creating questions', { count: updatedQuestionsData.length });
      
      // Create questions in batch
      if (updatedQuestionsData.length > 0) {
        await tx.ielts_reading_questions.createMany({
          data: updatedQuestionsData,
          skipDuplicates: true
        });
      }
      
      logger.info('Questions created successfully');
      
      return {
        passage: passageRecord,
        groupsCreated: createdGroups.length,
        questionsCreated: updatedQuestionsData.length
      };
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info('Import completed successfully', {
      duration,
      passageId: result.passage.id,
      groupsCreated: result.groupsCreated,
      questionsCreated: result.questionsCreated,
      performance: {
        questionsPerSecond: result.questionsCreated / (duration / 1000)
      }
    });
    
    res.status(200).json({
      success: true,
      message: `Import thành công: 1 passage, ${result.questionsCreated} câu hỏi`,
      passage: {
        id: result.passage.id,
        title: result.passage.title,
        content: result.passage.content,
        level: result.passage.level,
        category: result.passage.category,
        time_limit: result.passage.time_limit,
        is_active: result.passage.is_active
      },
      stats: {
        passagesCreated: 1,
        questionsCreated: result.questionsCreated,
        groupsCreated: result.groupsCreated,
        duration
      }
    });
    
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
    
    res.status(500).json({
      success: false,
      message: 'Import thất bại',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}