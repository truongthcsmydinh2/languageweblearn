# IELTS Reading System - Hướng dẫn sử dụng

## Tổng quan

Hệ thống IELTS Reading đã được tích hợp vào ứng dụng vocab-app với các tính năng sau:

### Trang người dùng
- **URL**: `http://192.168.99.166:3030/learning/ielts-reading`
- **Chức năng**: Luyện tập IELTS Reading với các bài đọc và câu hỏi

### Trang quản lý (Admin)
- **URL**: `http://192.168.99.166:3030/admin/ielts-reading`
- **Chức năng**: Quản lý bài đọc và câu hỏi

## Cấu trúc Database

### Bảng `ielts_reading_passages`
- `id`: ID bài đọc
- `title`: Tiêu đề bài đọc
- `content`: Nội dung bài đọc
- `level`: Cấp độ (beginner/intermediate/advanced)
- `category`: Danh mục
- `time_limit`: Thời gian làm bài (phút)
- `is_active`: Trạng thái hoạt động
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

### Bảng `ielts_reading_questions`
- `id`: ID câu hỏi
- `passage_id`: ID bài đọc
- `question_text`: Nội dung câu hỏi
- `question_type`: Loại câu hỏi (multiple_choice/true_false/fill_blank/matching)
- `options`: Các lựa chọn (JSON)
- `correct_answer`: Đáp án đúng
- `explanation`: Giải thích
- `order_index`: Thứ tự câu hỏi
- `created_at`: Thời gian tạo

### Bảng `ielts_reading_attempts`
- `id`: ID lần làm bài
- `firebase_uid`: ID người dùng
- `passage_id`: ID bài đọc
- `score`: Điểm số
- `total_questions`: Tổng số câu hỏi
- `correct_answers`: Số câu đúng
- `time_taken`: Thời gian làm bài
- `answers`: Các câu trả lời (JSON)
- `completed_at`: Thời gian hoàn thành

## Tính năng chính

### Trang người dùng
1. **Danh sách bài đọc**: Hiển thị các bài đọc có sẵn với thông tin cấp độ, thời gian, số câu hỏi
2. **Làm bài thi**: 
   - Giao diện chia đôi: bài đọc bên trái, câu hỏi bên phải
   - Đếm ngược thời gian
   - Điều hướng giữa các câu hỏi
   - Hỗ trợ nhiều loại câu hỏi: trắc nghiệm, đúng/sai, điền từ
3. **Kết quả**: Hiển thị điểm số, số câu đúng, thời gian làm bài

### Trang quản lý
1. **Quản lý bài đọc**:
   - Thêm/sửa/xóa bài đọc
   - Thiết lập cấp độ, thời gian, danh mục
   - Bật/tắt trạng thái hoạt động
2. **Quản lý câu hỏi**:
   - Thêm/sửa/xóa câu hỏi cho từng bài đọc
   - Hỗ trợ 4 loại câu hỏi
   - Thiết lập thứ tự câu hỏi
   - Thêm giải thích cho đáp án

## API Endpoints

### Public APIs (cho người dùng)
- `GET /api/ielts-reading/passages` - Lấy danh sách bài đọc
- `GET /api/ielts-reading/questions/[id]` - Lấy câu hỏi của bài đọc
- `POST /api/ielts-reading/submit` - Nộp kết quả bài thi

### Admin APIs
- `GET /api/admin/ielts-reading/passages` - Lấy danh sách bài đọc (admin)
- `POST /api/admin/ielts-reading/passages` - Tạo bài đọc mới
- `PUT /api/admin/ielts-reading/passages/[id]` - Cập nhật bài đọc
- `DELETE /api/admin/ielts-reading/passages/[id]` - Xóa bài đọc
- `GET /api/admin/ielts-reading/questions/[id]` - Lấy câu hỏi (admin)
- `POST /api/admin/ielts-reading/questions` - Tạo câu hỏi mới
- `PUT /api/admin/ielts-reading/questions/update/[id]` - Cập nhật câu hỏi
- `DELETE /api/admin/ielts-reading/questions/update/[id]` - Xóa câu hỏi

## Dữ liệu mẫu

Hệ thống đã được thêm 2 bài đọc mẫu với 5 câu hỏi mỗi bài:

1. **"The Future of Renewable Energy"** (Cấp độ: Intermediate)
   - 5 câu hỏi hỗn hợp (trắc nghiệm, đúng/sai, điền từ)
   - Thời gian: 20 phút

2. **"The Impact of Social Media on Modern Communication"** (Cấp độ: Advanced)
   - 5 câu hỏi hỗn hợp
   - Thời gian: 25 phút

## Cách sử dụng

### Cho người dùng
1. Truy cập `http://192.168.99.166:3030/learning/ielts-reading`
2. Chọn bài đọc muốn làm
3. Đọc kỹ bài đọc và trả lời các câu hỏi
4. Nộp bài và xem kết quả

### Cho admin
1. Truy cập `http://192.168.99.166:3030/admin/ielts-reading`
2. Thêm bài đọc mới hoặc chỉnh sửa bài đọc có sẵn
3. Thêm câu hỏi cho từng bài đọc
4. Quản lý trạng thái hoạt động của bài đọc

## Lưu ý kỹ thuật

- Hệ thống sử dụng Prisma ORM để quản lý database
- Authentication được thực hiện qua Firebase
- Admin access được kiểm tra qua field `is_admin` trong bảng `users`
- Giao diện responsive, hỗ trợ mobile và desktop
- Timer tự động kết thúc bài thi khi hết thời gian

## Troubleshooting

Nếu gặp lỗi:
1. Kiểm tra kết nối database
2. Chạy `npx prisma generate` để cập nhật Prisma client
3. Chạy `npx prisma migrate reset` nếu cần reset database
4. Kiểm tra logs trong console để debug 