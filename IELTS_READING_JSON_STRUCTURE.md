# IELTS Reading JSON Structure Guide

## Tổng quan

Hệ thống IELTS Reading đã được cập nhật để hỗ trợ cấu trúc JSON mới với metadata, content và summary. Cấu trúc này giúp tổ chức dữ liệu tốt hơn và dễ dàng import từ các nguồn khác nhau.

## Cấu trúc JSON mới

### 1. Metadata
Chứa thông tin cơ bản về bài đọc:

```json
{
  "metadata": {
    "id": 68166,
    "title": "Giải đề Cambridge IELTS 19 – Test 1: Reading Passage 2 – The pirates of the ancient Mediterranean",
    "link": "https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/",
    "slug": "giai-de-cam-19-the-pirates-of-the-ancient-mediterranean"
  }
}
```

### 2. Content
Chứa nội dung chính của bài đọc và câu hỏi:

#### 2.1 Reading Passage
```json
{
  "content": {
    "readingPassage": {
      "title": "The pirates of the ancient Mediterranean",
      "paragraphs": [
        "A. When one mentions pirates, an image springs to most people's minds...",
        "B. Although piracy in the Mediterranean is first recorded...",
        "C. One should also add that it was not unknown..."
      ]
    }
  }
}
```

#### 2.2 Question Groups
```json
{
  "content": {
    "questionGroups": [
      {
        "type": "MATCHING_INFORMATION",
        "range": "14-19",
        "instructions": "Reading Passage 2 has seven paragraphs, A-G.\nWhich paragraph contains the following information?\nWrite the correct letter, A-G, in boxes 14-19 on your answer sheet.\nNB You may use any letter more than once.",
        "questions": [
          {
            "id": 14,
            "content": "a reference to a denial of involvement in piracy",
            "answer": "D",
            "guide": "Phân tích: Từ khóa là 'denial of involvement'...",
            "options": {
              "A": "Option A text",
              "B": "Option B text",
              "C": "Option C text",
              "D": "Option D text",
              "E": "Option E text"
            }
          }
        ]
      }
    ]
  }
}
```

### 3. Summary
Chứa thông tin tóm tắt về bài đọc:

```json
{
  "summary": {
    "question_types": [
      "MATCHING_INFORMATION",
      "MULTIPLE_CHOICE_MULTIPLE_ANSWERS",
      "COMPLETION"
    ],
    "total_questions": 13
  }
}
```

## Các loại câu hỏi được hỗ trợ

| Type | Description | Database Enum |
|------|-------------|---------------|
| `MATCHING_INFORMATION` | Matching information to paragraphs | `matching_information` |
| `MULTIPLE_CHOICE_MULTIPLE_ANSWERS` | Multiple choice with multiple answers | `multiple_choice_group` |
| `COMPLETION` | Summary/Note/Table completion | `summary_completion` |
| `TRUE_FALSE_NOT_GIVEN` | True/False/Not Given | `true_false_not_given` |
| `YES_NO_NOT_GIVEN` | Yes/No/Not Given | `yes_no_not_given` |
| `MATCHING_HEADINGS` | Matching headings | `matching_headings` |
| `MATCHING_FEATURES` | Matching features | `matching_features` |
| `MATCHING_SENTENCE_ENDINGS` | Matching sentence endings | `matching_sentence_endings` |
| `SENTENCE_COMPLETION` | Sentence completion | `sentence_completion` |
| `NOTE_COMPLETION` | Note completion | `note_completion` |
| `TABLE_COMPLETION` | Table completion | `table_completion` |
| `FLOW_CHART_COMPLETION` | Flow chart completion | `flow_chart_completion` |
| `DIAGRAM_LABELLING` | Diagram labelling | `diagram_labelling` |
| `SHORT_ANSWER_QUESTIONS` | Short answer questions | `short_answer_questions` |

## Cách sử dụng

### 1. Import từ File JSON
1. Vào trang admin: `http://localhost:3000/admin/ielts-reading`
2. Click "Import từ JSON/URL"
3. Chọn "File JSON"
4. Upload file JSON với cấu trúc mới
5. Click "Preview dữ liệu" để xem trước
6. Click "Import vào hệ thống" để import

### 2. Import từ URL
1. Vào trang admin: `http://localhost:3000/admin/ielts-reading`
2. Click "Import từ JSON/URL"
3. Chọn "URL"
4. Nhập URL trả về JSON với cấu trúc mới
5. Click "Preview dữ liệu" để xem trước
6. Click "Import vào hệ thống" để import

## Ví dụ hoàn chỉnh

Xem file `test-new-structure.json` để có ví dụ hoàn chỉnh về cấu trúc JSON mới.

## Testing

Chạy script test để kiểm tra:

```bash
node scripts/test-new-json-structure.js
```

## Lưu ý

1. **Tương thích ngược**: Hệ thống vẫn hỗ trợ cấu trúc JSON cũ
2. **Validation**: Tất cả dữ liệu sẽ được validate trước khi import
3. **Error handling**: Lỗi sẽ được hiển thị rõ ràng trong giao diện
4. **Logging**: Tất cả quá trình import được log chi tiết

## Troubleshooting

### Lỗi thường gặp:

1. **"Invalid data structure"**: Kiểm tra cấu trúc JSON có đúng format không
2. **"Missing required fields"**: Đảm bảo có đầy đủ metadata, content, summary
3. **"Question type not supported"**: Kiểm tra type trong questionGroups có đúng không
4. **"Import failed"**: Kiểm tra console log để biết chi tiết lỗi

### Debug:

1. Kiểm tra console browser để xem lỗi frontend
2. Kiểm tra console server để xem lỗi backend
3. Sử dụng "Preview dữ liệu" để kiểm tra cấu trúc JSON
4. Chạy script test để kiểm tra API

## Migration từ cấu trúc cũ

Nếu bạn có dữ liệu với cấu trúc cũ, có thể chuyển đổi sang cấu trúc mới:

```javascript
// Cấu trúc cũ
{
  "title": "Bài đọc",
  "content": "Nội dung bài đọc",
  "questions": [...]
}

// Chuyển thành cấu trúc mới
{
  "metadata": {
    "id": 1,
    "title": "Bài đọc",
    "link": "",
    "slug": "bai-doc"
  },
  "content": {
    "readingPassage": {
      "title": "Bài đọc",
      "paragraphs": ["Nội dung bài đọc"]
    },
    "questionGroups": [
      {
        "type": "MULTIPLE_CHOICE",
        "range": "1-5",
        "instructions": "Answer the following questions",
        "questions": [...]
      }
    ]
  },
  "summary": {
    "question_types": ["MULTIPLE_CHOICE"],
    "total_questions": 5
  }
}
``` 