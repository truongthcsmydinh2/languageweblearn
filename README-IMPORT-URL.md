# Hướng dẫn Import từ URL - IELTS Reading

## Tổng quan

Tính năng import từ URL cho phép tự động lấy và parse dữ liệu từ các trang web WordPress (đặc biệt là izone.edu.vn) để tạo bài đọc IELTS Reading trong hệ thống.

## Các loại URL được hỗ trợ

### 1. URL WordPress (HTML)
- **Định dạng:** URL trang web WordPress thông thường
- **Ví dụ:** `https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/`
- **Cách hoạt động:** Hệ thống sẽ tự động parse HTML và trích xuất:
  - Bài đọc từ các section/toggle
  - Câu hỏi từ các heading
  - Giải thích từ bảng
  - Đáp án từ script tags

### 2. URL WordPress JSON API
- **Định dạng:** URL API WordPress trả về JSON
- **Ví dụ:** `https://www.izone.edu.vn/wp-json/wp/v2/test/68166`
- **Cách hoạt động:** Hệ thống sẽ xử lý JSON data trực tiếp

### 3. URL JSON thông thường
- **Định dạng:** URL trả về file JSON
- **Ví dụ:** `https://api.example.com/ielts-data.json`
- **Cách hoạt động:** Hệ thống sẽ parse JSON và chuyển đổi sang định dạng phù hợp

## Cách sử dụng

### Trong Admin Panel

1. **Truy cập trang admin:** `/admin/ielts-reading`
2. **Nhấn nút "Import từ JSON/URL"**
3. **Chọn loại import:** Chọn "URL"
4. **Nhập URL:** Dán URL cần import
5. **Nhấn "Test Import từ URL"** để kiểm tra
6. **Xem kết quả:** Hệ thống sẽ hiển thị thông tin import

### Test trực tiếp

1. **Truy cập:** `http://localhost:3000/test-import-url.html`
2. **Nhập URL** cần test
3. **Nhấn "Test Import từ URL"**
4. **Xem kết quả** chi tiết

## Cấu trúc dữ liệu được tạo

### Bài đọc (Passage)
```json
{
  "id": 123,
  "title": "Giải đề Cam 19 - Test 1: Reading Passage 2 - The pirates of the ancient Mediterranean",
  "content": "Nội dung bài đọc đã được parse...",
  "level": "intermediate",
  "category": "Imported from URL",
  "time_limit": 60,
  "is_active": true
}
```

### Nhóm câu hỏi (Question Group)
```json
{
  "id": 456,
  "instructions": "Answer the following questions based on the reading passage",
  "question_type": "multiple_choice",
  "display_order": 1,
  "passage_id": 123
}
```

### Câu hỏi (Questions)
```json
{
  "id": 789,
  "question_text": "Nội dung câu hỏi...",
  "question_type": "multiple_choice",
  "options": [],
  "correct_answer": "",
  "explanation": "",
  "note": "",
  "order_index": 1,
  "group_id": 456
}
```

## Logic Parse HTML

### 1. Tìm bài đọc
- **Elementor Toggle:** Tìm trong `.elementor-toggle-item` với title chứa "reading", "passage", "bài đọc"
- **Elementor Tabs:** Tìm trong `.elementor-tab-content` với data-tab chứa "reading"
- **Headings:** Tìm trong `h1-h6` với text chứa "bài đọc", "reading", "passage"
- **Fallback:** Tách theo paragraph nếu không tìm thấy section rõ ràng

### 2. Tìm câu hỏi
- **Elementor Toggle:** Tìm trong toggle với title chứa "câu hỏi", "questions", "bài tập"
- **Headings:** Tìm trong heading với text chứa "câu hỏi", "questions"
- **Fallback:** Parse từ content dựa trên dấu "?" hoặc số thứ tự

### 3. Tìm giải thích
- **Elementor Toggle:** Tìm trong toggle với title chứa "giải thích", "explanation"
- **Tables:** Tìm trong `table` với text chứa "giải thích", "explanation"

### 4. Tìm đáp án
- **Script Tags:** Tìm trong `script` với content chứa "quiz", "answers", mảng JSON

## Xử lý HTML Entities

Hệ thống tự động decode các HTML entities phổ biến:
- `&#8211;` → `-`
- `&#8217;` → `'`
- `&#8216;` → `'`
- `&amp;` → `&`
- `&lt;` → `<`
- `&gt;` → `>`
- `&quot;` → `"`
- `&#039;` → `'`
- Và nhiều entities khác...

## Làm sạch dữ liệu

### Loại bỏ thẻ không cần thiết
- `script`, `style`, `meta`, `link`, `noscript`, `iframe`, `embed`, `object`, `param`

### Loại bỏ thuộc tính
- `style`, `class`, `id`, `data-*`

### Chuẩn hóa text
- Thay nhiều khoảng trắng thành 1
- Thay nhiều xuống dòng thành 1
- Trim whitespace

## Xử lý lỗi

### Lỗi thường gặp
1. **URL không hợp lệ:** Kiểm tra định dạng URL
2. **Không thể fetch:** Kiểm tra kết nối mạng và CORS
3. **Không tìm thấy content:** URL không có nội dung phù hợp
4. **Parse lỗi:** HTML có cấu trúc không chuẩn

### Debug
- Xem console log để biết chi tiết quá trình parse
- Kiểm tra response từ API endpoint
- Sử dụng test page để debug

## API Endpoint

### POST `/api/admin/ielts-reading/import-from-url`

**Request:**
```json
{
  "url": "https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Import from URL completed successfully",
  "passageId": 123,
  "title": "Giải đề Cam 19 - Test 1: Reading Passage 2",
  "additionalInfo": {
    "url": "https://www.izone.edu.vn/...",
    "hasQuestions": true,
    "hasExplanations": false,
    "hasAnswers": true,
    "questionsContent": "...",
    "explanationsContent": "",
    "answersContent": "..."
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Could not extract reading content from the URL",
  "error": "Chi tiết lỗi..."
}
```

## Ví dụ sử dụng

### 1. Import từ IZONE
```javascript
const response = await fetch('/api/admin/ielts-reading/import-from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/'
  })
});
```

### 2. Import từ WordPress JSON API
```javascript
const response = await fetch('/api/admin/ielts-reading/import-from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.izone.edu.vn/wp-json/wp/v2/test/68166'
  })
});
```

## Lưu ý quan trọng

1. **CORS:** URL phải cho phép CORS từ domain của bạn
2. **Rate Limiting:** Một số website có giới hạn request
3. **Content Length:** Hệ thống giới hạn content 50,000 ký tự
4. **Encoding:** Hỗ trợ UTF-8 và các encoding phổ biến
5. **Security:** Chỉ import từ các nguồn đáng tin cậy

## Troubleshooting

### Lỗi "Could not extract reading content"
- Kiểm tra URL có đúng không
- Xem HTML source có cấu trúc phù hợp không
- Thử URL khác để test

### Lỗi "Failed to fetch URL"
- Kiểm tra kết nối mạng
- Kiểm tra URL có hoạt động không
- Kiểm tra CORS policy

### Lỗi "Parse HTML content"
- Kiểm tra HTML có hợp lệ không
- Xem console log để biết chi tiết
- Thử với URL khác

## Phát triển thêm

### Thêm rule parse mới
1. Cập nhật logic trong `import-from-url.ts`
2. Thêm selector CSS mới
3. Test với URL mẫu
4. Cập nhật documentation

### Tối ưu performance
1. Cache HTML content
2. Parallel processing
3. Lazy loading
4. Compression

### Mở rộng tính năng
1. Import từ nhiều URL cùng lúc
2. Schedule import tự động
3. Import từ RSS feed
4. Export dữ liệu đã import 