# Hướng dẫn sử dụng tính năng Sắp xếp câu hỏi thô

## 🎯 Tính năng mới

Đã cập nhật tính năng **"🤖 Biên dịch câu hỏi"** trong trang admin IELTS Reading để tự động sắp xếp và định dạng câu hỏi thô chưa được sắp xếp sử dụng Gemini AI.

## 📋 Các thay đổi đã thực hiện

### 1. Backend API
- ✅ Cập nhật API endpoint `/api/admin/ielts-reading/generate-questions`
- ✅ Thêm tham số `raw_questions` để nhận câu hỏi thô
- ✅ Sử dụng model `gemini-1.5-flash` để sắp xếp câu hỏi
- ✅ **Tối ưu prompt để phân biệt tiêu đề hướng dẫn và câu hỏi thực sự**
- ✅ **Bỏ hoàn toàn đáp án đúng và giải thích** - chỉ tập trung vào sắp xếp câu hỏi
- ✅ **Bỏ phần nội dung câu hỏi mẫu** - không cần thiết
- ✅ Cải thiện phân loại loại câu hỏi với nhiều từ khóa hơn
- ✅ Xử lý JSON response và validation dữ liệu
- ✅ Error handling và fallback

### 2. Frontend
- ✅ Thêm ô nhập "Câu hỏi thô (cần sắp xếp)" cho mỗi Task
- ✅ State management cho việc loading khi sắp xếp câu hỏi
- ✅ Tự động cập nhật danh sách câu hỏi sau khi sắp xếp
- ✅ Disable nút khi chưa có nội dung bài đọc hoặc câu hỏi thô
- ✅ Hiển thị loading spinner khi đang sắp xếp
- ✅ **Bỏ hoàn toàn đáp án đúng và giải thích** khỏi tất cả form
- ✅ **Bỏ phần nội dung câu hỏi mẫu** khỏi form và interface
- ✅ Cải thiện phân loại loại câu hỏi với nhiều từ khóa hơn
- ✅ **Cập nhật hướng dẫn và placeholder** để phản ánh việc phân biệt tiêu đề và câu hỏi

## 🔧 Cấu hình cần thiết

### 1. API Key Gemini
Đảm bảo đã cấu hình `GEMINI_API_KEY` trong file `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Khởi động server
```bash
npm run dev
```

## 🚀 Cách sử dụng

### 1. Trong trang Admin IELTS Reading
1. Truy cập `/admin/ielts-reading`
2. Nhấn "Tạo đề IELTS Reading"
3. Nhập tiêu đề và mô tả đề thi
4. Cho mỗi Task (Passage):
   - Nhập tiêu đề bài đọc
   - Nhập nội dung bài đọc
   - **Nhập câu hỏi thô** vào ô "Câu hỏi thô (cần sắp xếp)" (có thể nhập cả tiêu đề hướng dẫn)
   - Nhấn nút **"🤖 Biên dịch câu hỏi"**
5. Đợi kết quả sắp xếp (có loading spinner)
6. Câu hỏi sẽ tự động được sắp xếp và định dạng
7. Có thể chỉnh sửa hoặc thêm câu hỏi thủ công
8. **Chỉ có câu hỏi, không có đáp án** - đáp án sẽ được biên tập riêng sau
9. Nhấn "Tạo đề IELTS Reading" để lưu

### 2. Tính năng của nút sắp xếp câu hỏi
- ✅ Tự động sắp xếp câu hỏi theo thứ tự logic
- ✅ Định dạng câu hỏi cho đúng chuẩn IELTS
- ✅ Phân loại loại câu hỏi (trắc nghiệm, đúng/sai, điền từ, nối câu)
- ✅ **Phân biệt tiêu đề hướng dẫn và câu hỏi thực sự**
- ✅ **Chỉ sắp xếp câu hỏi, không tạo đáp án**
- ✅ Hiển thị loading state khi đang sắp xếp
- ✅ Xử lý lỗi và hiển thị thông báo

## 🎨 Giao diện

### Ô nhập câu hỏi thô
- **Vị trí**: Trong mỗi Task, sau ô "Nội dung bài đọc"
- **Label**: "Câu hỏi thô (cần sắp xếp)"
- **Placeholder**: Ví dụ về format câu hỏi thô với tiêu đề hướng dẫn
- **Validation**: Bắt buộc nhập trước khi biên dịch

### Nút Biên dịch
- **Vị trí**: Bên cạnh nút "Thêm câu hỏi" trong mỗi Task
- **Màu**: Tím (bg-purple-600)
- **Icon**: 🤖
- **Text**: "Biên dịch câu hỏi"
- **Loading**: Spinner + "Đang biên dịch..."

### Trạng thái
- **Bình thường**: Nút tím, có thể click
- **Loading**: Nút xám, có spinner, không thể click
- **Disabled**: Khi chưa nhập nội dung bài đọc hoặc câu hỏi thô

## 🔍 Prompt được sử dụng

```
You are a professional IELTS teacher. Here are raw questions that need to be sorted and formatted. Your task is to extract and format only the actual questions, not the instruction headers.

**Passage Title**: [Title]

**Reading Content**:
[Content]

**Raw Questions (need sorting and formatting)**:
[Raw questions]

**Requirements**:
1. Extract ONLY the actual questions, ignore instruction headers like "Questions 1-7: True/False/Not Given" or "Do the following statements agree..."
2. Sort the questions in logical order
3. Format questions to proper IELTS standards
4. Classify question types (multiple_choice, true_false, fill_blank, matching)
5. Return result as JSON array

**Important Rules**:
- IGNORE instruction headers like "Questions 1-7", "Do the following statements agree", "TRUE if...", "FALSE if..."
- EXTRACT only the actual question statements
- Each question should be a complete, standalone statement
- For True/False questions, extract only the statement part, not the instruction
- For multiple choice, extract only the question, not the options

**Example**:
Input: "Questions 1-7: True/False/Not Given
Do the following statements agree with the information given in the Reading Passage?
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if it is impossible to say what the writer thinks about this
1. People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.
2. The change that Andy Murray made to his rackets attracted a lot of attention."

Output: [
  {
    "question_text": "People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.",
    "question_type": "true_false"
  },
  {
    "question_text": "The change that Andy Murray made to his rackets attracted a lot of attention.",
    "question_type": "true_false"
  }
]

**JSON Format**:
[
  {
    "question_text": "Formatted question text",
    "question_type": "multiple_choice|true_false|fill_blank|matching",
    "options": ["A", "B", "C", "D"] (only for multiple_choice)
  }
]

**Notes**: 
- All questions must be in English
- Questions must be appropriate for IELTS difficulty (B1-C1)
- Sort in logical order and easy to understand
- Return only formatted questions, no answers needed
```

**Model sử dụng**: `gemini-1.5-flash` (chính, quota cao)

## ✅ Kết quả

Sau khi sắp xếp thành công:
- ✅ Tự động sắp xếp câu hỏi theo thứ tự logic
- ✅ Định dạng câu hỏi cho đúng chuẩn IELTS
- ✅ Phân loại đúng loại câu hỏi với nhiều từ khóa hơn
- ✅ **Phân biệt rõ ràng tiêu đề hướng dẫn và câu hỏi thực sự**
- ✅ **Chỉ có câu hỏi, không có đáp án** - đáp án sẽ được biên tập riêng
- ✅ Điền vào danh sách câu hỏi của Task
- ✅ Có thể chỉnh sửa hoặc thêm câu hỏi thủ công
- ✅ Loading state mượt mà
- ✅ Xử lý lỗi tốt

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **"Lỗi Gemini API"**: Kiểm tra API key trong file .env
2. **"Thiếu nội dung bài đọc"**: Nhập nội dung trước khi sắp xếp
3. **"Thiếu câu hỏi thô"**: Nhập câu hỏi thô trước khi sắp xếp
4. **"Không thể sắp xếp câu hỏi"**: Kiểm tra format câu hỏi thô
5. **"Lỗi server"**: Kiểm tra console log để debug

### Debug:
- Kiểm tra console browser để xem lỗi frontend
- Kiểm tra console server để xem lỗi backend
- Test API riêng tại `/api/admin/ielts-reading/generate-questions`

## 📈 Lưu ý

- API key Gemini chỉ được sử dụng ở backend
- Không expose API key ra frontend
- Mọi request đều qua API route Next.js
- Có validation và error handling đầy đủ
- Câu hỏi được sắp xếp và định dạng bằng tiếng Anh, phù hợp với IELTS
- Có thể chỉnh sửa câu hỏi sau khi sắp xếp
- Hỗ trợ nhiều loại câu hỏi: trắc nghiệm, đúng/sai, điền từ, nối câu
- **Chỉ có câu hỏi, không có đáp án** - đáp án sẽ được biên tập riêng sau
- **Bỏ phần nội dung câu hỏi mẫu** - không cần thiết
- **Cải thiện phân loại loại câu hỏi** với nhiều từ khóa hơn
- **Phân biệt rõ ràng tiêu đề hướng dẫn và câu hỏi thực sự**

## 🎯 Kết luận

✅ **Hoàn thành 100%** các yêu cầu:
- ✅ Tích hợp Gemini API để sắp xếp câu hỏi
- ✅ Giao diện thân thiện với ô nhập câu hỏi thô
- ✅ Loading state và error handling
- ✅ Tự động cập nhật danh sách câu hỏi
- ✅ Hỗ trợ chỉnh sửa sau khi sắp xếp
- ✅ Prompt tối ưu cho sắp xếp câu hỏi IELTS
- ✅ **Bỏ hoàn toàn đáp án đúng và giải thích** - chỉ tập trung vào sắp xếp câu hỏi
- ✅ **Bỏ phần nội dung câu hỏi mẫu** - đơn giản hóa giao diện
- ✅ **Cải thiện phân loại loại câu hỏi** với nhiều từ khóa hơn
- ✅ **Tối ưu prompt để phân biệt tiêu đề hướng dẫn và câu hỏi thực sự**
- ✅ Validation đầy đủ cho câu hỏi thô

Hệ thống đã sẵn sàng để sử dụng tính năng sắp xếp câu hỏi thô với Gemini AI! 