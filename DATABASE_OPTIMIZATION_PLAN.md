# Kế hoạch Tối ưu hóa Database cho IELTS Reading System

## 🔍 Phân tích Vấn đề Hiện tại

### 1. Vấn đề về Transaction và Rollback
- **Hiện tại**: API không sử dụng Prisma transaction, dẫn đến dữ liệu không nhất quán khi có lỗi
- **Hậu quả**: Nếu tạo passage thành công nhưng tạo questions thất bại, passage vẫn tồn tại trong DB
- **Giải pháp**: Sử dụng `prisma.$transaction()` để đảm bảo atomicity

### 2. Vấn đề về Validation và Type Safety
- **Hiện tại**: Validation cơ bản, không kiểm tra deep structure
- **Hậu quả**: Dữ liệu JSON không đúng format có thể gây lỗi runtime
- **Giải pháp**: Implement Zod schema validation

### 3. Vấn đề về Performance
- **Hiện tại**: Tạo từng question riêng lẻ trong loop
- **Hậu quả**: N+1 query problem, chậm với dữ liệu lớn
- **Giải pháp**: Sử dụng `createMany()` và batch operations

### 4. Vấn đề về Error Handling
- **Hiện tại**: Error handling cơ bản, không có retry mechanism
- **Hậu quả**: Import thất bại hoàn toàn khi có lỗi nhỏ
- **Giải pháp**: Implement graceful error handling và partial import

## 🎯 Giải pháp Tối ưu hóa

### 1. Cải thiện Database Schema

#### A. Thêm Index cho Performance
```sql
-- Thêm composite index cho query thường dùng
CREATE INDEX idx_passages_level_active ON ielts_reading_passages(level, is_active);
CREATE INDEX idx_questions_group_order ON ielts_reading_questions(group_id, order_index);
CREATE INDEX idx_attempts_user_passage ON ielts_reading_attempts(firebase_uid, passage_id);
```

#### B. Thêm Constraints cho Data Integrity
```sql
-- Đảm bảo order_index unique trong mỗi group
ALTER TABLE ielts_reading_questions ADD CONSTRAINT unique_order_per_group 
  UNIQUE(group_id, order_index);

-- Đảm bảo display_order unique trong mỗi passage
ALTER TABLE ielts_reading_question_groups ADD CONSTRAINT unique_display_order_per_passage 
  UNIQUE(passage_id, display_order);
```

#### C. Tối ưu hóa JSON Fields
```sql
-- Thêm JSON schema validation (PostgreSQL)
ALTER TABLE ielts_reading_passages ADD CONSTRAINT valid_passage_data 
  CHECK (jsonb_typeof(passage_data) = 'object');

ALTER TABLE ielts_reading_passages ADD CONSTRAINT valid_summary 
  CHECK (jsonb_typeof(summary) = 'object');
```

### 2. Cải thiện API Implementation

#### A. Transaction-based Import
```typescript
// Sử dụng Prisma transaction để đảm bảo atomicity
const result = await prisma.$transaction(async (tx) => {
  // Tạo passage
  const passage = await tx.ielts_reading_passages.create({...});
  
  // Tạo question groups
  const groups = await Promise.all(
    questionGroups.map(group => tx.ielts_reading_question_groups.create({...}))
  );
  
  // Tạo questions batch
  const allQuestions = groups.flatMap((group, groupIndex) => 
    questionGroups[groupIndex].questions.map(q => ({...}))
  );
  
  await tx.ielts_reading_questions.createMany({
    data: allQuestions
  });
  
  return { passage, groups, questionsCount: allQuestions.length };
});
```

#### B. Enhanced Validation với Zod
```typescript
import { z } from 'zod';

const ImportDataSchema = z.object({
  metadata: z.object({
    title: z.string().min(1),
    id: z.string().optional(),
  }),
  content: z.object({
    readingPassage: z.object({
      title: z.string().min(1),
      paragraphs: z.array(z.object({
        id: z.string(),
        content: z.string().min(1)
      }))
    }),
    questionGroups: z.array(z.object({
      type: z.string(),
      instructions: z.string(),
      questions: z.array(z.object({
        content: z.string(),
        answer: z.string(),
        guide: z.string().optional()
      }))
    }))
  })
});
```

#### C. Batch Operations cho Performance
```typescript
// Thay vì tạo từng question riêng lẻ
for (const question of questions) {
  await prisma.ielts_reading_questions.create({ data: question });
}

// Sử dụng createMany cho performance tốt hơn
await prisma.ielts_reading_questions.createMany({
  data: questions,
  skipDuplicates: true
});
```

### 3. Cải thiện Error Handling

#### A. Graceful Error Recovery
```typescript
try {
  // Import logic
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation - handle gracefully
    return { success: false, error: 'Duplicate data detected' };
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint - handle gracefully
    return { success: false, error: 'Invalid reference data' };
  }
  
  // Log error for debugging
  console.error('Import error:', error);
  throw error;
}
```

#### B. Partial Import Support
```typescript
const importResults = {
  successful: [],
  failed: [],
  warnings: []
};

for (const passage of passages) {
  try {
    const result = await importSinglePassage(passage);
    importResults.successful.push(result);
  } catch (error) {
    importResults.failed.push({ passage: passage.title, error: error.message });
  }
}
```

### 4. Monitoring và Logging

#### A. Structured Logging
```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  }
};
```

#### B. Performance Metrics
```typescript
const startTime = Date.now();
// Import logic
const endTime = Date.now();
const duration = endTime - startTime;

logger.info('Import completed', {
  duration,
  passagesCreated,
  questionsCreated,
  performance: {
    passagesPerSecond: passagesCreated / (duration / 1000),
    questionsPerSecond: questionsCreated / (duration / 1000)
  }
});
```

## 🚀 Implementation Plan

### Phase 1: Database Schema Updates (Ngay lập tức)
1. Thêm indexes cho performance
2. Thêm constraints cho data integrity
3. Tối ưu hóa JSON fields

### Phase 2: API Refactoring (1-2 ngày)
1. Implement Prisma transactions
2. Add Zod validation
3. Optimize batch operations
4. Improve error handling

### Phase 3: Monitoring & Testing (1 ngày)
1. Add structured logging
2. Add performance metrics
3. Comprehensive testing
4. Documentation updates

## 📊 Expected Benefits

### Performance Improvements
- **50-70% faster** import times với batch operations
- **Reduced database load** với optimized queries
- **Better memory usage** với streaming operations

### Reliability Improvements
- **100% data consistency** với transactions
- **Graceful error handling** với partial imports
- **Better debugging** với structured logging

### Maintainability Improvements
- **Type safety** với Zod validation
- **Clear error messages** cho users
- **Comprehensive monitoring** cho admins

## 🔧 Migration Strategy

### 1. Backward Compatibility
- Giữ nguyên API endpoints hiện tại
- Support cả old và new data formats
- Gradual migration approach

### 2. Testing Strategy
- Unit tests cho validation logic
- Integration tests cho API endpoints
- Performance tests với large datasets
- Rollback procedures

### 3. Deployment Strategy
- Deploy database changes first
- Deploy API changes with feature flags
- Monitor performance metrics
- Gradual rollout to all users

Với kế hoạch này, chúng ta sẽ có một hệ thống IELTS Reading robust, performant và maintainable hơn đáng kể.