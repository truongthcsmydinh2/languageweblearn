# Hướng dẫn sử dụng tính năng Biên dịch đáp án Task 3

## 🎯 Tính năng mới

Đã thêm tính năng **"🤖 Biên dịch đáp án"** cho Task 3 trong trang admin IELTS Reading để tự động biên dịch và sắp xếp đáp án từ tiếng Việt sang tiếng Anh sử dụng Gemini AI.

## 📋 Các thay đổi đã thực hiện

### 1. Backend API
- ✅ Tạo API endpoint `/api/admin/ielts-reading/generate-answers`
- ✅ Sử dụng model `gemini-1.5-flash` để biên dịch đáp án
- ✅ Prompt tối ưu cho việc biên dịch và sắp xếp đáp án
- ✅ Xử lý JSON response và validation dữ liệu
- ✅ Error handling và fallback

### 2. Frontend
- ✅ Thêm phần "Đáp án Task 3" trong form tạo đề IELTS Reading
- ✅ State management cho việc loading khi biên dịch đáp án
- ✅ Tự động cập nhật danh sách đáp án sau khi biên dịch
- ✅ Disable nút khi chưa có nội dung bài đọc hoặc đáp án thô
- ✅ Hiển thị loading spinner khi đang biên dịch

### 3. Database
- ✅ Cập nhật API complete-test để lưu đáp án Task 3
- ✅ Lưu đáp án dưới dạng JSON trong trường questions_content
- ✅ Tạo passage riêng cho đáp án Task 3 (is_active: false)

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
4. Hoàn thành 3 Task (Passage) với câu hỏi
5. Cuộn xuống phần **"Đáp án Task 3"**
6. Nhập đáp án thô vào ô "Đáp án thô (cần biên dịch)"
7. Nhấn nút **"🤖 Biên dịch đáp án"**
8. Đợi kết quả biên dịch (có loading spinner)
9. Đáp án sẽ tự động được biên dịch và hiển thị
10. Nhấn "Tạo đề IELTS Reading" để lưu

### 2. Tính năng của nút biên dịch đáp án
- ✅ Tự động biên dịch đáp án từ tiếng Việt sang tiếng Anh
- ✅ Sắp xếp đáp án theo thứ tự câu hỏi
- ✅ Format đáp án rõ ràng, dễ hiểu
- ✅ Tạo giải thích cho từng đáp án (tùy chọn)
- ✅ Hiển thị loading state khi đang biên dịch
- ✅ Xử lý lỗi và hiển thị thông báo

## 🎨 Giao diện

### Phần Đáp án Task 3
- **Vị trí**: Cuối form tạo đề IELTS Reading
- **Layout**: 2 cột (đáp án thô + đáp án đã biên dịch)
- **Màu**: Vàng (bg-yellow-600) cho nút biên dịch
- **Icon**: 🤖
- **Text**: "Biên dịch đáp án"
- **Loading**: Spinner + "Đang biên dịch..."

### Trạng thái
- **Bình thường**: Nút vàng, có thể click
- **Loading**: Nút xám, có spinner, không thể click
- **Disabled**: Khi chưa nhập nội dung bài đọc hoặc đáp án thô

## 🔍 Prompt được sử dụng

```
Bạn là một giáo viên IELTS chuyên nghiệp. Hãy biên dịch và sắp xếp đáp án cho bài IELTS Reading dựa trên nội dung sau:

**Tiêu đề bài đọc**: [Tiêu đề]

**Nội dung bài đọc**:
[Nội dung bài đọc]

**Nội dung câu hỏi mẫu** (nếu có):
[Nội dung câu hỏi mẫu]

**Đáp án thô (cần biên dịch và sắp xếp)**:
[Đáp án thô]

**Yêu cầu**:
1. Biên dịch đáp án thô thành tiếng Anh chính xác
2. Sắp xếp đáp án theo thứ tự câu hỏi
3. Đảm bảo đáp án phù hợp với nội dung bài đọc
4. Format đáp án rõ ràng, dễ hiểu
5. Trả về kết quả dưới dạng JSON array

**Định dạng JSON trả về**:
[
  {
    "question_number": "Câu hỏi số mấy",
    "answer": "Đáp án đã biên dịch",
    "explanation": "Giải thích đáp án (tùy chọn)"
  }
]

**Lưu ý**: 
- Tất cả đáp án phải bằng tiếng Anh
- Đáp án phải chính xác dựa trên nội dung bài đọc
- Sắp xếp theo thứ tự câu hỏi
- Format rõ ràng, dễ đọc
```

**Model sử dụng**: `gemini-1.5-flash` (chính, quota cao)

## ✅ Kết quả

Sau khi biên dịch thành công:
- ✅ Tự động biên dịch đáp án sang tiếng Anh
- ✅ Sắp xếp theo thứ tự câu hỏi
- ✅ Format rõ ràng, dễ hiểu
- ✅ Hiển thị trong ô "Đáp án đã biên dịch"
- ✅ Có thể xem giải thích cho từng đáp án
- ✅ Loading state mượt mà
- ✅ Xử lý lỗi tốt

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **"Lỗi Gemini API"**: Kiểm tra API key trong file .env
2. **"Thiếu nội dung bài đọc"**: Nhập nội dung Task 3 trước khi biên dịch
3. **"Thiếu đáp án thô"**: Nhập đáp án thô trước khi biên dịch
4. **"Không thể biên dịch đáp án"**: Kiểm tra format đáp án thô
5. **"Lỗi server"**: Kiểm tra console log để debug

### Debug:
- Kiểm tra console browser để xem lỗi frontend
- Kiểm tra console server để xem lỗi backend
- Test API riêng tại `/api/admin/ielts-reading/generate-answers`

## 📈 Lưu ý

- API key Gemini chỉ được sử dụng ở backend
- Không expose API key ra frontend
- Mọi request đều qua API route Next.js
- Có validation và error handling đầy đủ
- Đáp án được biên dịch sang tiếng Anh, phù hợp với IELTS
- Có thể chỉnh sửa đáp án sau khi biên dịch
- Đáp án Task 3 được lưu riêng biệt trong database

## 🎯 Kết luận

✅ **Hoàn thành 100%** các yêu cầu:
- ✅ Tích hợp Gemini API để biên dịch đáp án
- ✅ Giao diện thân thiện với phần đáp án Task 3
- ✅ Loading state và error handling
- ✅ Tự động cập nhật danh sách đáp án
- ✅ Hỗ trợ chỉnh sửa sau khi biên dịch
- ✅ Prompt tối ưu cho biên dịch đáp án IELTS
- ✅ Lưu trữ đáp án trong database

Hệ thống đã sẵn sàng để sử dụng tính năng biên dịch đáp án Task 3 với Gemini AI! 