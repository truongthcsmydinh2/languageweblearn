# IELTS Reading Refactor Summary

## Tổng quan
Đã hoàn thành việc tái cấu trúc hệ thống lưu trữ câu hỏi IELTS Reading để xử lý chính xác các cụm câu hỏi (question groups). Hệ thống mới đảm bảo mỗi cụm câu hỏi có phần chỉ dẫn (instructions) riêng và được quản lý một cách nhất quán.

## Thay đổi chính

### 1. Database Schema (prisma/schema.prisma)

#### Model mới: `ielts_reading_question_groups`
```prisma
model ielts_reading_question_groups {
  id           String  @id @default(cuid())
  instructions String  @db.Text
  question_type String
  display_order Int     @default(0)
  created_at   DateTime @default(now())
  updated_at   DateTime @default(now()) @updatedAt

  // Quan hệ: Thuộc về 1 bài đọc
  passage    ielts_reading_passages @relation(fields: [passage_id], references: [id], onDelete: Cascade)
  passage_id Int

  // Quan hệ: Có nhiều câu hỏi
  questions  ielts_reading_questions[]

  @@index([passage_id], map: "ielts_reading_question_groups_passage_id_fkey")
}
```

#### Thay đổi trong `ielts_reading_passages`
- ❌ Xóa: `questions_content String? @db.Text`
- ✅ Thêm: `question_groups ielts_reading_question_groups[]`

#### Thay đổi trong `ielts_reading_questions`
- ❌ Xóa: `passage_id Int` và quan hệ với `ielts_reading_passages`
- ✅ Thêm: `group_id String` và quan hệ với `ielts_reading_question_groups`

### 2. Migration
- Migration: `20250707041258_refactor_ielts_question_structure`
- Xử lý dữ liệu hiện có: Tạo các group mặc định cho các câu hỏi đã tồn tại
- Đảm bảo không mất dữ liệu trong quá trình chuyển đổi

### 3. API Changes

#### API mới: `generate-questions.ts`
- Cập nhật prompt để yêu cầu AI trả về cấu trúc `groups`
- Format mới:
```json
{
  "groups": [
    {
      "instructions": "Questions 1-5: Do the following statements agree...",
      "questionType": "true_false_not_given",
      "questions": [
        {
          "questionText": "The statement text...",
          "correctAnswer": "TRUE"
        }
      ]
    }
  ]
}
```

#### API mới: `save-questions.ts`
- Lưu trữ câu hỏi với cấu trúc QuestionGroup
- Sử dụng transaction để đảm bảo tính nhất quán
- Xóa dữ liệu cũ trước khi tạo mới

#### API mới: `get-passage-with-groups.ts`
- Lấy passage với cấu trúc QuestionGroup hoàn chỉnh
- Bao gồm instructions và questions được sắp xếp theo thứ tự

#### API cập nhật: `complete-test.ts`
- Cập nhật để sử dụng cấu trúc `groups` thay vì `questions`
- Validation cho cấu trúc mới
- Tạo Task 3 answers với cấu trúc mới

### 4. Lợi ích của cấu trúc mới

#### ✅ Ưu điểm
1. **Tính nhất quán**: Mỗi nhóm câu hỏi có instructions rõ ràng
2. **Dễ bảo trì**: Cấu trúc quan hệ rõ ràng, không có dữ liệu JSON phức tạp
3. **Hiệu suất**: Truy vấn dữ liệu nhanh hơn với quan hệ database
4. **Mở rộng**: Dễ dàng thêm tính năng mới cho từng nhóm câu hỏi
5. **Validation**: Kiểm tra dữ liệu chặt chẽ hơn

#### ❌ Vấn đề cũ đã được giải quyết
1. **Mất cấu trúc nhóm**: Trước đây câu hỏi được lưu riêng lẻ
2. **Phức tạp JSON**: Không còn sử dụng `questions_content` JSON
3. **Khó bảo trì**: Cấu trúc cũ khó quản lý và mở rộng
4. **Thiếu instructions**: Không có cách lưu trữ instructions cho từng nhóm

### 5. Testing

#### Script test: `scripts/test-ielts-structure.js`
- ✅ Tạo passage với cấu trúc mới
- ✅ Tạo question groups
- ✅ Tạo questions trong groups
- ✅ Lấy dữ liệu với cấu trúc mới
- ✅ Xóa dữ liệu test

### 6. Các bước tiếp theo

#### Cần cập nhật:
1. **Frontend components**: Cập nhật UI để hiển thị cấu trúc groups
2. **API endpoints**: Cập nhật các API khác để sử dụng cấu trúc mới
3. **Validation**: Thêm validation cho cấu trúc groups
4. **Documentation**: Cập nhật tài liệu API

#### Migration dữ liệu:
- ✅ Dữ liệu hiện có đã được chuyển đổi an toàn
- ✅ Các câu hỏi cũ được gán vào "legacy groups"
- ✅ Không mất dữ liệu trong quá trình chuyển đổi

### 7. Cấu trúc dữ liệu mới

#### Passage với Groups:
```typescript
{
  id: number,
  title: string,
  content: string,
  groups: [
    {
      id: string,
      instructions: string,
      question_type: string,
      display_order: number,
      questions: [
        {
          id: number,
          question_text: string,
          question_type: string,
          correct_answer: string,
          options?: Json,
          explanation?: string,
          note?: string,
          order_index: number
        }
      ]
    }
  ]
}
```

## Kết luận
Việc tái cấu trúc đã hoàn thành thành công. Hệ thống mới cung cấp:
- Cấu trúc dữ liệu rõ ràng và nhất quán
- Khả năng mở rộng tốt hơn
- Hiệu suất truy vấn tốt hơn
- Dễ bảo trì và phát triển

Tất cả dữ liệu hiện có đã được bảo toàn và chuyển đổi an toàn sang cấu trúc mới. 