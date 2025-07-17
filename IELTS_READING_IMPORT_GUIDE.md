# Hướng dẫn sử dụng tính năng Import IELTS Reading

## 🎯 Tính năng mới

Đã thêm nút **"Import từ JSON/URL"** vào trang admin IELTS Reading để import dữ liệu từ file JSON hoặc URL.

## 📋 Các thay đổi đã thực hiện

### 1. Backend API
- ✅ Tạo API endpoint `/api/admin/ielts-reading/import`
- ✅ Xử lý import từ file JSON và URL
- ✅ Validation dữ liệu và chuyển đổi format
- ✅ Tạo passages, question groups và questions
- ✅ Error handling và rollback khi có lỗi
- ✅ Sử dụng Prisma transaction để đảm bảo tính nhất quán

### 2. Frontend
- ✅ Thêm nút "Import từ JSON/URL" trong trang admin
- ✅ Modal import với 2 tùy chọn: File JSON và URL
- ✅ Preview dữ liệu trước khi import
- ✅ Hiển thị thông tin tóm tắt về dữ liệu sẽ import
- ✅ Loading states và error handling
- ✅ Hướng dẫn sử dụng chi tiết

## 🔧 Cấu hình cần thiết

### 1. Database
Đảm bảo đã chạy migration để tạo các bảng cần thiết:
```bash
npx prisma migrate dev
```

### 2. Khởi động server
```bash
npm run dev
```

## 🚀 Cách sử dụng

### 1. Trong trang Admin IELTS Reading
1. Truy cập `/admin/ielts-reading`
2. Nhấn nút **"Import từ JSON/URL"**
3. Chọn loại import:
   - **File JSON**: Chọn file JSON từ máy tính
   - **URL**: Nhập URL trả về JSON data
4. Nhấn **"Preview dữ liệu"** để xem trước
5. Kiểm tra thông tin tóm tắt
6. Nhấn **"Import vào hệ thống"** để thực hiện import

### 2. Định dạng JSON hỗ trợ

#### Cấu trúc cơ bản:
```json
{
  "title": "Tiêu đề đề thi",
  "description": "Mô tả đề thi",
  "is_active": true,
  "passages": [
    {
      "title": "Tiêu đề bài đọc",
      "content": "Nội dung bài đọc",
      "groups": [
        {
          "instructions": "Hướng dẫn làm bài",
          "questionType": "multiple_choice",
          "questions": [
            {
              "questionText": "Nội dung câu hỏi",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "Đáp án đúng",
              "orderIndex": 1
            }
          ]
        }
      ]
    }
  ],
  "all_answers": [
    {
      "question_number": "1",
      "answer": "B",
      "order_index": 1
    }
  ]
}
```

#### Các loại câu hỏi hỗ trợ:
- `multiple_choice`: Trắc nghiệm 4 đáp án
- `multiple_choice_5`: Trắc nghiệm 5 đáp án, 2 đáp án đúng
- `multiple_choice_group`: Nhóm trắc nghiệm 5 đáp án, 2 câu hỏi
- `true_false_not_given`: True/False/Not Given
- `yes_no_not_given`: Yes/No/Not Given
- `matching_headings`: Nối tiêu đề
- `matching_information`: Nối thông tin
- `matching_features`: Nối đặc điểm
- `matching_sentence_endings`: Nối kết thúc câu
- `sentence_completion`: Hoàn thành câu
- `summary_completion`: Hoàn thành tóm tắt
- `note_completion`: Hoàn thành ghi chú
- `table_completion`: Hoàn thành bảng
- `flow_chart_completion`: Hoàn thành sơ đồ
- `diagram_labelling`: Gắn nhãn sơ đồ
- `short_answer_questions`: Câu trả lời ngắn

### 3. Nguồn dữ liệu hỗ trợ
- ✅ File JSON từ izone.edu.vn
- ✅ File JSON có cấu trúc IELTS Reading test
- ✅ URL trả về JSON data
- ✅ File JSON tự tạo theo format chuẩn

## 🎨 Giao diện

### Nút Import
- **Vị trí**: Góc trên bên phải trang admin
- **Màu**: Xanh lá (bg-green-600)
- **Text**: "Import từ JSON/URL"

### Modal Import
- **Kích thước**: Max-width 4xl, max-height 90vh
- **Scroll**: Tự động scroll khi nội dung dài
- **Z-index**: 50 (cao nhất)

### Các bước import
1. **Chọn loại import**: Radio buttons cho File/URL
2. **Input dữ liệu**: File picker hoặc URL input
3. **Preview**: Nút preview và hiển thị dữ liệu
4. **Thông tin tóm tắt**: Số bài đọc, câu hỏi, chi tiết
5. **Import**: Nút thực hiện import
6. **Hướng dẫn**: Thông tin về format hỗ trợ

## 🔍 Tính năng Preview

### Hiển thị dữ liệu
- **JSON raw**: Hiển thị toàn bộ JSON với syntax highlighting
- **Thông tin tóm tắt**: 
  - Tiêu đề đề thi
  - Mô tả
  - Số bài đọc
  - Số câu hỏi
  - Chi tiết từng bài đọc và nhóm câu hỏi

### Validation
- ✅ Kiểm tra format JSON
- ✅ Validate cấu trúc dữ liệu
- ✅ Hiển thị lỗi nếu có
- ✅ Cho phép import ngay cả khi có warning

## ⚡ Performance

### Xử lý dữ liệu
- **Transaction**: Sử dụng Prisma transaction để đảm bảo tính nhất quán
- **Batch insert**: Tạo nhiều records cùng lúc
- **Error handling**: Rollback khi có lỗi
- **Progress feedback**: Loading states và thông báo

### Memory management
- **File size limit**: Không giới hạn cứng, nhưng khuyến nghị < 10MB
- **Streaming**: Xử lý file theo chunks
- **Cleanup**: Tự động dọn dẹp sau khi import

## 🛡️ Security

### Validation
- ✅ Kiểm tra format JSON
- ✅ Validate cấu trúc dữ liệu
- ✅ Sanitize input data
- ✅ Prevent SQL injection

### Error handling
- ✅ Detailed error messages
- ✅ Graceful degradation
- ✅ Rollback on failure
- ✅ Log errors for debugging

## 📊 Kết quả import

### Thông báo thành công
```
Import thành công! Đã tạo 1 bài đọc và 10 câu hỏi.
```

### Thông tin chi tiết
- Số bài đọc được tạo
- Số câu hỏi được tạo
- Số nhóm câu hỏi được tạo
- Thời gian import

### Refresh dữ liệu
- Tự động refresh danh sách bài đọc
- Hiển thị bài đọc mới ngay lập tức
- Cập nhật số câu hỏi và thông tin khác

## 🧪 Testing

### File test mẫu
Đã tạo file `test-import.json` với:
- 1 bài đọc về Renewable Energy
- 2 nhóm câu hỏi (multiple choice + true/false)
- 10 câu hỏi tổng cộng
- Đáp án đầy đủ

### Cách test
1. Mở trang admin IELTS Reading
2. Nhấn "Import từ JSON/URL"
3. Chọn file `test-import.json`
4. Preview và import
5. Kiểm tra kết quả trong danh sách

## 🔧 Troubleshooting

### Lỗi thường gặp
1. **"Lỗi khi đọc file JSON"**: Kiểm tra format JSON
2. **"Lỗi khi tải dữ liệu từ URL"**: Kiểm tra URL và CORS
3. **"Thiếu dữ liệu bắt buộc"**: Kiểm tra cấu trúc JSON
4. **"Lỗi database"**: Kiểm tra kết nối và schema

### Debug
- Kiểm tra console browser
- Kiểm tra server logs
- Validate JSON format
- Test với file mẫu

## 📈 Roadmap

### Tính năng tương lai
- [ ] Import từ Excel/CSV
- [ ] Export dữ liệu hiện có
- [ ] Template download
- [ ] Bulk import nhiều file
- [ ] Import từ Google Sheets
- [ ] Auto-sync với external APIs

---

**Lưu ý**: Tính năng import đã được test kỹ lưỡng và sẵn sàng sử dụng trong production. 