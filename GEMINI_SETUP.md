# Hướng dẫn cấu hình Gemini API

## 1. Lấy API Key Gemini

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Sao chép API key

## 2. Cấu hình trong ứng dụng

1. Mở file `.env` trong thư mục gốc của dự án
2. Thêm dòng sau:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

3. Thay thế `your_actual_gemini_api_key_here` bằng API key thực tế của bạn

## 3. Kiểm tra cấu hình

1. Khởi động lại server:
```bash
npm run dev
```

2. Thử gửi một câu trả lời trong trang practice writing
3. Hoặc truy cập `/writingcheck/test` để test riêng
4. Kiểm tra console để đảm bảo không có lỗi API

## 4. Model được sử dụng

- **Model**: `gemini-1.5-flash`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Tính năng**: Đánh giá bản dịch tiếng Anh, chấm điểm, phân tích lỗi

## 5. Tính năng sử dụng Gemini API

- **Đánh giá bản dịch**: Chấm điểm từ 1-10
- **Phân tích lỗi**: Chỉ ra các lỗi ngữ pháp, từ vựng
- **Gợi ý sửa**: Đưa ra cách sửa lỗi
- **Bản dịch đúng**: Cung cấp bản dịch chuẩn
- **Lời khuyên**: Đưa ra lời khuyên để cải thiện

## 6. Lưu ý bảo mật

- Không commit API key vào git
- API key chỉ được sử dụng ở backend
- Mọi request đều được xử lý qua API route Next.js

## 7. Troubleshooting

Nếu gặp lỗi:
1. **API key không đúng**: Kiểm tra file .env
2. **Quota hết**: Kiểm tra quota Gemini API
3. **Network error**: Kiểm tra kết nối internet
4. **JSON parse error**: Gemini trả về format không đúng

### Debug:
- Sử dụng trang `/writingcheck/test` để test riêng
- Xem raw response trong trang test
- Kiểm tra console log

## 8. Ví dụ Response

```json
{
  "score": 9,
  "feedback": "Bản dịch của bạn rất tốt và chính xác. Câu văn tự nhiên và dễ hiểu.",
  "errors": [],
  "suggestions": [
    "Có thể thay thế \"books\" bằng \"reading\" để câu ngắn gọn hơn: \"I like reading.\"",
    "Để câu văn đa dạng hơn, bạn có thể dùng các từ đồng nghĩa như \"enjoy\" thay cho \"like\": \"I enjoy reading books\""
  ],
  "corrected_version": "I like reading.",
  "advice": "Hãy cố gắng làm cho câu văn của bạn đa dạng hơn bằng cách sử dụng các từ đồng nghĩa và cấu trúc câu khác nhau."
}
```