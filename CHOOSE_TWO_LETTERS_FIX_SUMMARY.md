# Tóm tắt sửa lỗi Choose Two Letters Import

## 🐛 Vấn đề ban đầu
Khi import dữ liệu với `question_type` là "choose_two_letters", các tùy chọn (options) của nhóm câu hỏi không được lưu vào database, dẫn đến việc không hiển thị đủ 6 tùy chọn A-F trên giao diện.

## 🔧 Nguyên nhân
1. **Logic xử lý group options bị lỗi**: Trong file `import.ts`, logic xử lý và lưu `groupOptions` vào database có vấn đề ở thứ tự xử lý.
2. **Thiếu options mặc định**: Không có logic tự động tạo options mặc định A-F cho loại câu hỏi `choose_two_letters` khi dữ liệu import không có options.

## ✅ Giải pháp đã thực hiện

### 1. Sửa logic xử lý group options trong import.ts
**File**: `/home/vps/vocab-app-new/src/pages/api/admin/ielts-reading/import.ts`

**Thay đổi chính**:
- Sửa thứ tự xử lý: xử lý `groupOptions` và `groupContent` trước khi tạo `questionGroupData`
- Đảm bảo stringify đúng cách trước khi lưu vào database
- Thêm debug logs chi tiết

```typescript
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
  display_order: groupIndex + 1,
  passage_id: passageRecord.id,
  options: groupOptionsStr ?? null,
  content: groupContentStr ?? null
};
```

### 2. Thêm logic tạo options mặc định
**Thêm vào import.ts**:
```typescript
// Đặc biệt xử lý cho choose_two_letters - đảm bảo luôn có options
if (questionType === 'choose_two_letters' && !groupOptions) {
  // Tạo options mặc định A-F cho choose_two_letters
  groupOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
  logger.info('Added default options for choose_two_letters', { groupOptions });
}
```

### 3. Logic hiển thị frontend đã có sẵn
**File**: `/home/vps/vocab-app-new/src/pages/learning/ielts-reading.tsx`

Logic hiển thị đã được cập nhật trước đó để:
- Kiểm tra cả `question.options` và `group.options`
- Hiển thị checkbox cho từng option
- Giới hạn chọn tối đa 2 đáp án
- Xử lý đúng format dữ liệu

## 🧪 Testing

### 1. Test logic xử lý
```bash
node test-choose-two-letters-import.js
```

### 2. Test dữ liệu mẫu
```bash
node test-import-final.js
```

### 3. File dữ liệu test
- `test-choose-two-letters-data.json`: Dữ liệu mẫu hoàn chỉnh cho import
- Có thể import qua admin panel tại `/admin/ielts-reading`

## 📊 Kết quả mong đợi

### Database Structure
**ielts_reading_question_groups table**:
```sql
question_type: 'choose_two_letters'
instructions: 'Choose TWO letters, A-F. Which TWO paragraphs contain the following information?'
options: '["A","B","C","D","E","F"]'
```

**ielts_reading_questions table**:
```sql
question_text: 'Which TWO paragraphs discuss the benefits of technology in education?'
question_type: 'choose_two_letters'
correct_answer: 'A,C'
options: null (inherited from group)
```

### Frontend Display
- Hiển thị 6 checkbox với labels A, B, C, D, E, F
- Cho phép chọn tối đa 2 options
- Lưu đáp án dưới dạng "A,C", "B,D", etc.

## 🎯 Cách sử dụng

### 1. Import dữ liệu có options
```json
{
  "type": "choose_two_letters",
  "instructions": "Choose TWO letters, A-F.",
  "options": ["A", "B", "C", "D", "E", "F"],
  "questions": [...]
}
```

### 2. Import dữ liệu không có options (sẽ tự động tạo A-F)
```json
{
  "type": "choose_two_letters",
  "instructions": "Choose TWO letters, A-F.",
  "questions": [...]
}
```

## ✅ Checklist hoàn thành
- [x] Sửa logic xử lý group options trong import.ts
- [x] Thêm logic tạo options mặc định cho choose_two_letters
- [x] Test logic xử lý với dữ liệu có và không có options
- [x] Tạo dữ liệu test mẫu
- [x] Xác nhận frontend hiển thị đúng
- [x] Tạo documentation

## 🚀 Triển khai
Tất cả thay đổi đã được áp dụng và sẵn sàng sử dụng. Server đang chạy tại `http://localhost:3030`.

**Admin Panel**: `http://localhost:3030/admin/ielts-reading`
**Learning Page**: `http://localhost:3030/learning/ielts-reading`