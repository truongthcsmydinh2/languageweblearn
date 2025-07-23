# Phương án xây dựng lại IELTS Reading Admin từ đầu

## 1. Phân tích vấn đề hiện tại

### Vấn đề của file hiện tại (`ielts-reading.tsx`):

* **Quá dài**: 2442 dòng code trong một file duy nhất

* **Quá nhiều state**: Hơn 20 state variables khác nhau

* **Logic phức tạp**: Nhiều chức năng khác nhau được trộn lẫn

* **Khó bảo trì**: Khó tìm và sửa lỗi

* **Khó mở rộng**: Thêm tính năng mới rất khó khăn

* **Performance kém**: Re-render không cần thiết

### Các chức năng chính hiện tại:

1. Quản lý danh sách passages (CRUD)
2. Quản lý câu hỏi cho từng passage
3. Tạo đề IELTS Reading hoàn chỉnh
4. Import/Export từ JSON/URL
5. Tự động sinh câu hỏi bằng AI
6. Quản lý nhóm câu hỏi
7. Bulk operations (nhập đáp án hàng loạt)

## 2. Kiến trúc mới được đề xuất

### 2.1 Cấu trúc thư mục

```
src/
├── pages/admin/
│   └── ielts-reading.tsx                 # Main page (chỉ layout và routing)
├── components/admin/ielts-reading/
│   ├── index.ts                          # Export tất cả components
│   ├── IeltsReadingDashboard.tsx         # Main dashboard component
│   ├── PassageManagement/
│   │   ├── PassageList.tsx               # Danh sách passages
│   │   ├── PassageForm.tsx               # Form thêm/sửa passage
│   │   ├── PassageCard.tsx               # Card hiển thị passage
│   │   └── PassageActions.tsx            # Actions (edit, delete, etc.)
│   ├── QuestionManagement/
│   │   ├── QuestionList.tsx              # Danh sách câu hỏi
│   │   ├── QuestionForm.tsx              # Form thêm/sửa câu hỏi
│   │   ├── QuestionGroup.tsx             # Nhóm câu hỏi
│   │   ├── QuestionTypeSelector.tsx      # Chọn loại câu hỏi
│   │   └── BulkAnswerForm.tsx            # Nhập đáp án hàng loạt
│   ├── TestCreation/
│   │   ├── TestBuilder.tsx               # Tạo đề thi hoàn chỉnh
│   │   ├── TestPreview.tsx               # Preview đề thi
│   │   ├── PassageBuilder.tsx            # Tạo passage trong đề thi
│   │   └── GroupBuilder.tsx              # Tạo nhóm câu hỏi
│   ├── ImportExport/
│   │   ├── ImportForm.tsx                # Form import
│   │   ├── ImportPreview.tsx             # Preview dữ liệu import
│   │   ├── ExportOptions.tsx             # Tùy chọn export
│   │   └── FileUpload.tsx                # Upload file
│   ├── AIGeneration/
│   │   ├── QuestionGenerator.tsx         # Sinh câu hỏi bằng AI
│   │   ├── AnswerGenerator.tsx           # Sinh đáp án bằng AI
│   │   └── GenerationProgress.tsx        # Progress indicator
│   └── Common/
│       ├── LoadingSpinner.tsx            # Loading component
│       ├── ConfirmDialog.tsx             # Confirm dialog
│       ├── Toast.tsx                     # Toast notifications
│       └── ErrorBoundary.tsx             # Error handling
├── hooks/ielts-reading/
│   ├── usePassages.ts                    # Hook quản lý passages
│   ├── useQuestions.ts                   # Hook quản lý questions
│   ├── useTestBuilder.ts                 # Hook tạo đề thi
│   ├── useImportExport.ts                # Hook import/export
│   ├── useAIGeneration.ts                # Hook AI generation
│   └── useIeltsReadingContext.ts         # Context hook
├── services/ielts-reading/
│   ├── passageService.ts                 # API calls cho passages
│   ├── questionService.ts                # API calls cho questions
│   ├── testService.ts                    # API calls cho tests
│   ├── importService.ts                  # Import logic
│   ├── exportService.ts                  # Export logic
│   └── aiService.ts                      # AI generation calls
├── types/ielts-reading/
│   ├── passage.types.ts                  # Types cho passages
│   ├── question.types.ts                 # Types cho questions
│   ├── test.types.ts                     # Types cho tests
│   ├── import.types.ts                   # Types cho import
│   └── index.ts                          # Export tất cả types
└── utils/ielts-reading/
    ├── validation.ts                     # Validation functions
    ├── formatting.ts                     # Format data functions
    ├── constants.ts                      # Constants
    └── helpers.ts                        # Helper functions
```

### 2.2 Context và State Management

```typescript
// Context cho toàn bộ IELTS Reading module
interface IeltsReadingContextType {
  // Passages
  passages: Passage[];
  selectedPassage: Passage | null;
  
  // Questions
  questions: Question[];
  selectedQuestions: Question[];
  
  // Test Builder
  currentTest: IeltsTest | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  actions: {
    passages: PassageActions;
    questions: QuestionActions;
    tests: TestActions;
    import: ImportActions;
  };
}
```

## 3. Implementation Plan

### Phase 1: Chuẩn bị và Types (1-2 ngày)

1. Tạo cấu trúc thư mục mới
2. Định nghĩa tất cả types và interfaces
3. Tạo constants và helper functions
4. Setup Context và Provider

### Phase 2: Core Components (3-4 ngày)

1. Tạo PassageManagement components
2. Tạo QuestionManagement components
3. Implement hooks cho passages và questions
4. Tạo services cho API calls

### Phase 3: Advanced Features (2-3 ngày)

1. TestCreation components
2. ImportExport functionality
3. AI Generation features
4. Error handling và loading states

### Phase 4: Integration và Testing (1-2 ngày)

1. Tích hợp tất cả components
2. Testing và bug fixes
3. Performance optimization
4. Documentation

## 4. Lợi ích của kiến trúc mới

### 4.1 Maintainability

* Mỗi component có trách nhiệm rõ ràng

* Dễ tìm và sửa lỗi

* Code reusable

### 4.2 Scalability

* Dễ thêm tính năng mới

* Có thể mở rộng từng module độc lập

* Separation of concerns

### 4.3 Performance

* Chỉ re-render components cần thiết

* Lazy loading cho các components lớn

* Optimized state management

### 4.4 Developer Experience

* Code dễ đọc và hiểu

* TypeScript support tốt hơn

* Better debugging experience

## 5. Migration Strategy

### 5.1 Approach

* **Big Bang**: Thay thế hoàn toàn file cũ

* **Incremental**: Từng bước migrate từng phần

**Đề xuất**: Sử dụng Big Bang approach vì:

* File hiện tại quá phức tạp để migrate từng phần

* Có thể backup file cũ

* Thời gian development ngắn hơn

### 5.2 Steps

1. Backup file hiện tại
2. Tạo branch mới cho refactor
3. Implement kiến trúc mới
4. Testing thoroughly
5. Deploy và monitor

## 6. Risk Mitigation

### 6.1 Potential Risks

* Mất tính năng trong quá trình migrate

* Performance regression

* Breaking changes cho users

### 6.2 Mitigation Strategies

* Comprehensive testing

* Feature parity checklist

* Gradual rollout

* Rollback plan

## 7. Success Metrics

* **Code Quality**: Giảm từ 2442 dòng xuống < 500 dòng per file

* **Maintainability**: Thời gian fix bug giảm 50%

* **Performance**: Page load time cải thiện

* **Developer Experience**: Thời gian develop tính năng mới giảm 40%

## 8. Next Steps

1. **Review và approve** phương án này
2. **Estimate effort** chi tiết cho từng phase
3. **Create tickets** trong project management tool
4. **Start implementation** với Phase 1

NOTE mọi thay đổi đều nằm trên 2 trang \
1\. admin : /admin/ielts-reading

2.trang chính để học ielts reading (luyện tập) /ielts-reading

***

**Kết luận**: Việc refactor này sẽ giúp codebase trở nên maintainable, scalable và performant hơn đáng kể. Mặc dù cần đầu tư thời gian ban đầu, nhưng sẽ tiết kiệm rất nhiều thời gian trong tương lai.
