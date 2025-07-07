# Hướng dẫn sử dụng tính năng Biên dịch câu hỏi IELTS Reading

## 🎯 Tính năng mới

Đã thêm nút **"🤖 Biên dịch câu hỏi"** vào trang admin IELTS Reading để tự động tạo câu hỏi từ nội dung bài đọc sử dụng Gemini AI.

## 📋 Các thay đổi đã thực hiện

### 1. Backend API
- ✅ Tạo API endpoint `/api/admin/ielts-reading/generate-questions`
- ✅ Sử dụng model `gemini-1.5-flash` để tạo câu hỏi
- ✅ Prompt tối ưu cho việc tạo câu hỏi IELTS Reading
- ✅ Xử lý JSON response và validation dữ liệu
- ✅ Error handling và fallback

### 2. Frontend
- ✅ Thêm nút "🤖 Biên dịch câu hỏi" trong form tạo đề IELTS Reading
- ✅ State management cho việc loading khi biên dịch
- ✅ Tự động cập nhật danh sách câu hỏi sau khi biên dịch
- ✅ Disable nút khi chưa có nội dung bài đọc
- ✅ Hiển thị loading spinner khi đang biên dịch

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
   - Nhập nội dung câu hỏi mẫu (tùy chọn)
   - Nhấn nút **"🤖 Biên dịch câu hỏi"**
5. Đợi kết quả biên dịch (có loading spinner)
6. Câu hỏi sẽ tự động được tạo và điền vào danh sách
7. Có thể chỉnh sửa hoặc thêm câu hỏi thủ công
8. Nhấn "Tạo đề IELTS Reading" để lưu

### 2. Tính năng của nút biên dịch
- ✅ Tự động tạo 5-10 câu hỏi phù hợp với bài đọc
- ✅ Hỗ trợ các loại câu hỏi: trắc nghiệm, đúng/sai, điền từ, nối câu
- ✅ Tự động phân loại loại câu hỏi dựa trên nội dung
- ✅ Tạo đáp án đúng và giải thích
- ✅ Hiển thị loading state khi đang biên dịch
- ✅ Xử lý lỗi và hiển thị thông báo

## 🎨 Giao diện

### Nút Biên dịch
- **Vị trí**: Bên cạnh nút "Thêm câu hỏi" trong mỗi Task
- **Màu**: Tím (bg-purple-600)
- **Icon**: 🤖
- **Text**: "Biên dịch câu hỏi"
- **Loading**: Spinner + "Đang biên dịch..."

### Trạng thái
- **Bình thường**: Nút tím, có thể click
- **Loading**: Nút xám, có spinner, không thể click
- **Disabled**: Khi chưa nhập nội dung bài đọc

## 🔍 Prompt được sử dụng

```
Bạn là một giáo viên IELTS chuyên nghiệp. Hãy tạo các câu hỏi IELTS Reading dựa trên nội dung bài đọc sau:

**Tiêu đề bài đọc**: [Tiêu đề]

**Nội dung bài đọc**:
[Nội dung bài đọc]

**Nội dung câu hỏi mẫu** (nếu có):
[Nội dung câu hỏi mẫu]

**Yêu cầu**:
1. Tạo 5-10 câu hỏi phù hợp với bài đọc
2. Các loại câu hỏi bao gồm: trắc nghiệm, đúng/sai, điền từ, nối câu
3. Mỗi câu hỏi phải có đáp án đúng
4. Câu hỏi phải dựa trên thông tin có trong bài đọc
5. Trả về kết quả dưới dạng JSON array

**Định dạng JSON trả về**:
[
  {
    "question_text": "Nội dung câu hỏi",
    "correct_answer": "Đáp án đúng",
    "explanation": "Giải thích đáp án (tùy chọn)",
    "question_type": "multiple_choice|true_false|fill_blank|matching",
    "options": ["A", "B", "C", "D"] (chỉ cho trắc nghiệm)
  }
]

**Lưu ý**: 
- Tất cả câu hỏi và đáp án phải bằng tiếng Anh
- Câu hỏi phải phù hợp với độ khó IELTS (B1-C1)
- Đảm bảo đáp án chính xác dựa trên nội dung bài đọc
```

**Model sử dụng**: `gemini-1.5-flash` (chính, quota cao)

## ✅ Kết quả

Sau khi biên dịch thành công:
- ✅ Tự động tạo 5-10 câu hỏi phù hợp
- ✅ Phân loại đúng loại câu hỏi
- ✅ Tạo đáp án đúng và giải thích
- ✅ Điền vào danh sách câu hỏi của Task
- ✅ Có thể chỉnh sửa hoặc thêm câu hỏi thủ công
- ✅ Loading state mượt mà
- ✅ Xử lý lỗi tốt

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **"Lỗi Gemini API"**: Kiểm tra API key trong file .env
2. **"Thiếu nội dung bài đọc"**: Nhập nội dung trước khi biên dịch
3. **"Không thể tạo câu hỏi"**: Kiểm tra nội dung bài đọc có đủ thông tin không
4. **"Lỗi server"**: Kiểm tra console log để debug

### Debug:
- Kiểm tra console browser để xem lỗi frontend
- Kiểm tra console server để xem lỗi backend
- Test API riêng tại `/api/admin/ielts-reading/generate-questions`

## 📈 Lưu ý

- API key Gemini chỉ được sử dụng ở backend
- Không expose API key ra frontend
- Mọi request đều qua API route Next.js
- Có validation và error handling đầy đủ
- Câu hỏi được tạo bằng tiếng Anh, phù hợp với IELTS
- Có thể chỉnh sửa câu hỏi sau khi biên dịch

## 🎯 Kết luận

✅ **Hoàn thành 100%** các yêu cầu:
- ✅ Tích hợp Gemini API để tạo câu hỏi
- ✅ Giao diện thân thiện với nút biên dịch
- ✅ Loading state và error handling
- ✅ Tự động cập nhật danh sách câu hỏi
- ✅ Hỗ trợ chỉnh sửa sau khi biên dịch
- ✅ Prompt tối ưu cho IELTS Reading

Hệ thống đã sẵn sàng để sử dụng tính năng biên dịch câu hỏi IELTS Reading với Gemini AI! 