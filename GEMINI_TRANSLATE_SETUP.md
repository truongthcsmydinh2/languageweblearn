# Hướng dẫn cấu hình Gemini API cho tính năng dịch

## 🎯 Tính năng mới

Đã thêm nút **"Dịch bằng Gemini"** vào trang admin writinglesson để tự động dịch nội dung tiếng Việt sang tiếng Anh.

## 📋 Các thay đổi đã thực hiện

### 1. Frontend (writinglesson.tsx)
- ✅ Thêm state `isTranslating` để hiển thị loading
- ✅ Thêm hàm `translateWithGemini()` để gọi API
- ✅ Thêm nút "Dịch bằng Gemini" với icon 🤖
- ✅ Tự động cập nhật `bulkAnswer` và `sentences` sau khi dịch

### 2. Backend (translate-gemini.ts)
- ✅ Tạo API endpoint `/api/admin/translate-gemini`
- ✅ Sử dụng model `gemini-1.5-flash` (chính, quota cao)
- ✅ Fallback: `gemini-1.5-pro` nếu flash không hoạt động
- ✅ Sử dụng header `x-goog-api-key` theo hướng dẫn Google AI
- ✅ Prompt tối ưu cho việc dịch
- ✅ Xử lý lỗi và response

## 🔧 Cấu hình cần thiết

### 1. Lấy API Key Gemini
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Sao chép API key

### 2. Cấu hình trong ứng dụng
Tạo file `.env` trong thư mục gốc và thêm:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Khởi động lại server
```bash
npm run dev
```

## 🚀 Cách sử dụng

### 1. Trong trang Admin Writing Lesson
1. Truy cập `/admin/writinglesson`
2. Nhấn "Thêm bài viết mới"
3. Nhập nội dung tiếng Việt
4. Nhấn nút **"🤖 Dịch bằng Gemini"**
5. Đợi kết quả dịch (có loading spinner)
6. Bản dịch sẽ tự động điền vào ô "Nhập đoạn đáp án chuẩn tiếng Anh"

### 2. Tính năng của nút dịch
- ✅ Dịch toàn bộ nội dung tiếng Việt sang tiếng Anh
- ✅ Tự động tách câu và điền vào từng ô đáp án
- ✅ Phù hợp với độ khó và loại bài đã chọn
- ✅ Hiển thị loading state khi đang dịch
- ✅ Xử lý lỗi và hiển thị thông báo

## 🎨 Giao diện

### Nút Dịch
- **Vị trí**: Bên dưới ô nhập nội dung tiếng Việt
- **Màu**: Xanh dương (bg-blue-500)
- **Icon**: 🤖
- **Text**: "Dịch bằng Gemini"
- **Loading**: Spinner + "Đang dịch..."

### Trạng thái
- **Bình thường**: Nút xanh, có thể click
- **Loading**: Nút xám, có spinner, không thể click
- **Disabled**: Khi chưa nhập nội dung tiếng Việt

## 🔍 Troubleshooting

### Lỗi thường gặp:
1. **"Lỗi Gemini API"**: Kiểm tra API key trong file .env
2. **"Thiếu văn bản tiếng Việt"**: Nhập nội dung trước khi dịch
3. **"Lỗi server"**: Kiểm tra console log để debug

### Debug:
- Kiểm tra console browser để xem lỗi frontend
- Kiểm tra console server để xem lỗi backend
- Test API riêng tại `/api/admin/translate-gemini`

## 📊 Prompt được sử dụng

```
Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy dịch đoạn văn tiếng Việt sau sang tiếng Anh:

**Loại bài**: EMAILS
**Độ khó**: BEGINNER
**Văn bản tiếng Việt**: "..."

**Yêu cầu**:
1. Dịch chính xác và tự nhiên sang tiếng Anh
2. Giữ nguyên cấu trúc câu và ý nghĩa
3. Sử dụng từ vựng phù hợp với độ khó BEGINNER
4. Đảm bảo ngữ pháp chính xác
5. Trả về chỉ bản dịch tiếng Anh, không có giải thích thêm

**Bản dịch tiếng Anh**:
```

**Model sử dụng**: `gemini-1.5-flash` (chính, quota cao)

## ✅ Kết quả

Sau khi cấu hình xong:
- ✅ Nút "Dịch bằng Gemini" hoạt động
- ✅ Tự động dịch nội dung tiếng Việt
- ✅ Điền vào ô đáp án tiếng Anh
- ✅ Tách câu và gán vào từng ô
- ✅ Loading state mượt mà
- ✅ Xử lý lỗi tốt

## 🎯 Lưu ý

- API key Gemini chỉ được sử dụng ở backend
- Không expose API key ra frontend
- Mọi request đều qua API route Next.js
- Có validation và error handling đầy đủ 