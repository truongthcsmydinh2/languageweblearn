# Tài liệu xử lý dữ liệu câu hỏi IELTS Reading

## 1. Tổng quan

Hệ thống IELTS Reading hỗ trợ 12 dạng câu hỏi khác nhau, mỗi dạng có cấu trúc dữ liệu và logic xử lý riêng biệt. Tài liệu này mô tả chi tiết cách xử lý import/export dữ liệu JSON cho từng dạng câu hỏi.

## 2. Cấu trúc dữ liệu chung

### 2.1 Schema cơ bản

```typescript
interface IeltsQuestionType {
  type: string;                    // Loại câu hỏi
  name: string;                    // Tên hiển thị
  description: string;             // Mô tả
  instructions: string;            // Hướng dẫn làm bài
  questionGroups: QuestionGroup[]; // Nhóm câu hỏi
}

interface QuestionGroup {
  groupName?: string;              // Tên nhóm (optional)
  questions: Question[];           // Danh sách câu hỏi
  // Các trường đặc biệt theo từng dạng
}

interface Question {
  id: number | string;             // ID câu hỏi
  content?: string;                // Nội dung câu hỏi
  answer: string | string[];       // Đáp án
  guide?: QuestionGuide;           // Hướng dẫn giải
}
```

## 3. Chi tiết 12 dạng câu hỏi

### **1. Multiple Choice (Single Answer)**

<br />

* **Cách nhận diện:** Hệ thống xác định dạng bài này khi trường `type` có giá trị là `"multiple_choice_single"`.
* **Đặc điểm cấu trúc:**
  * Mỗi câu hỏi là một object nằm trong mảng `questions`.
  * Mảng `options` chứa các lựa chọn (A, B, C, D) nằm **bên trong** mỗi object câu hỏi.
  * Trường `answer` là một chuỗi ký tự (String) duy nhất, chứa đáp án đúng (ví dụ: `"C"`).
  JSON
  ```
  "questions": [
    {
      "id": 1,
      "content": "[Nội dung câu hỏi]",
      "options": [
        { "key": "A", "value": "[Lựa chọn A]" },
        ...
      ],
      "answer": "C"
    }
  ]

  ```
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Duyệt qua mảng `questionGroups`, sau đó duyệt qua mảng `questions`.
  2. Với mỗi object câu hỏi, hiển thị `content` của nó.
  3. Đọc mảng `options` bên trong câu hỏi đó để tạo ra một bộ các lựa chọn (nên dùng radio button vì chỉ được chọn một). Hiển thị `key` và `value` cho mỗi lựa chọn.
  4. So sánh lựa chọn của người dùng với giá trị trong trường `answer` để xác định tính đúng sai.

***

<br />

### **2. Multiple Choice (Multiple Answers)**

<br />

* **Cách nhận diện:** Hệ thống xác định dạng bài này khi `type` là `"choose_two_letters"`.
* **Đặc điểm cấu trúc:**
  * Mảng `options` (A, B, C, D, E) nằm ở cấp độ `questionGroups`, áp dụng chung cho cả nhóm.
  * Trường `answers` (số nhiều) là một mảng chuỗi ký tự, chứa tất cả các đáp án đúng (ví dụ: `["B", "C"]`).
  * Mảng `questions` chứa các object "giả", với `content` và `answer` là `null`. Số lượng object trong mảng này quy định số đáp án cần chọn (ví dụ: 2 object nghĩa là phải chọn 2 đáp án).
  JSON
  ```
  "questionGroups": [
    {
      "options": [ ... ],
      "questions": [ { "id": 1, ... }, { "id": 2, ... } ],
      "answers": [ "B", "C" ]
    }
  ]

  ```
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Hiển thị `groupName` (nếu có) và `instructions` (ví dụ: "Choose TWO letters...").
  2. Đọc mảng `options` ở cấp `group` để tạo ra một bộ các lựa chọn (nên dùng checkbox vì được chọn nhiều).
  3. Kiểm tra độ dài của mảng `questions` (`questions.length`) để yêu cầu người dùng chọn đúng số lượng đáp án.
  4. Kiểm tra các lựa chọn của người dùng so với các giá trị trong mảng `answers`.

***

<br />

### **3. True / False / Not Given**

<br />

* **Cách nhận diện:** `type` có giá trị là `"true_false_not_given"`.
* **Đặc điểm cấu trúc:**
  * Một danh sách các câu hỏi trong mảng `questions`.
  * Mỗi câu hỏi có `content` là một phát biểu và `answer` là một trong ba chuỗi: `"TRUE"`, `"FALSE"`, hoặc `"NOT GIVEN"`.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Duyệt qua mảng `questions`.
  2. Với mỗi câu hỏi, hiển thị `content` của nó.
  3. Tạo ra 3 lựa chọn cố định (ví dụ: 3 nút bấm) với các nhãn: "TRUE", "FALSE", và "NOT GIVEN".
  4. So sánh lựa chọn của người dùng với giá trị trong trường `answer`.

***

<br />

### **4. Yes / No / Not Given**

<br />

* **Cách nhận diện:** `type` có giá trị là `"yes_no_not_given"`.
* **Đặc điểm cấu trúc:** Cấu trúc hoàn toàn tương tự dạng "True / False / Not Given", chỉ khác về ý nghĩa (đánh giá quan điểm tác giả thay vì thông tin). `answer` là một trong ba chuỗi: `"YES"`, `"NO"`, hoặc `"NOT GIVEN"`.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Duyệt qua mảng `questions`.
  2. Với mỗi câu hỏi, hiển thị `content`.
  3. Tạo ra 3 lựa chọn cố định: "YES", "NO", và "NOT GIVEN".
  4. So sánh lựa chọn của người dùng với giá trị trong trường `answer`.

***

<br />

### **5. Matching Headings**

<br />

* **Cách nhận diện:** `type` có giá trị là `"matching_headings"`.
* **Đặc điểm cấu trúc:**
  * Mảng `headingOptions` chứa danh sách các tiêu đề (đánh số La Mã: "i", "ii", ...) nằm ở cấp `group`.
  * Mảng `questions` chứa các object đại diện cho các đoạn văn. Mỗi object có `id` là tên đoạn (ví dụ: `"Paragraph A"`) và `answer` là `key` của tiêu đề đúng.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Hiển thị toàn bộ danh sách các tiêu đề từ `headingOptions` để người dùng tham khảo.
  2. Duyệt qua mảng `questions`. Với mỗi `question`, hiển thị `id` của nó (ví dụ: "Paragraph A").
  3. Bên cạnh mỗi tên đoạn, cung cấp một danh sách thả xuống (dropdown) chứa các `key` từ `headingOptions` ("i", "ii", "iii", ...) để người dùng lựa chọn.

***

<br />

### **6. Matching Information**

<br />

* **Cách nhận diện:** `type` có giá trị là `"matching_phrases"`.
* **Đặc điểm cấu trúc:** Một danh sách các câu hỏi trong `questions`. Mỗi câu hỏi có `content` (mô tả thông tin cần tìm) và `answer` là chữ cái của đoạn văn tương ứng (ví dụ: `"B"`).
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Duyệt qua mảng `questions`.
  2. Với mỗi câu hỏi, hiển thị `content`.
  3. Cung cấp một ô nhập liệu văn bản để người dùng điền vào một chữ cái (A, B, C,...).
  4. Luôn hiển thị `instructions` cho người dùng, đặc biệt là lưu ý "You may use any letter more than once".

***

<br />

### **7. Matching Features**

<br />

* **Cách nhận diện:** `type` có giá trị là `"matching_features"`.
* **Đặc điểm cấu trúc:**
  * Mảng `featureOptions` chứa danh sách các đối tượng/đặc điểm (A, B, C,...) nằm ở cấp `group`.
  * Mảng `questions` chứa các phát biểu cần nối. Mỗi `question` có `content` và `answer` là `key` của lựa chọn đúng trong `featureOptions`.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Hiển thị danh sách các lựa chọn từ `featureOptions`.
  2. Duyệt qua mảng `questions`. Với mỗi `question`, hiển thị `content` của nó.
  3. Cung cấp một danh sách thả xuống (dropdown) chứa các `key` từ `featureOptions` để người dùng lựa chọn.

***

<br />

### **8. Matching Sentence Endings**

<br />

* **Cách nhận diện:** `type` có giá trị là `"matching_sentence_endings"`.
* **Đặc điểm cấu trúc:**
  * Mảng `endingOptions` chứa các phần kết thúc câu (A, B, C,...) nằm ở cấp `group`.
  * Mảng `questions` chứa các phần bắt đầu câu. Mỗi `question` có `content` và `answer` là `key` của phần kết thúc đúng.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Hiển thị danh sách các lựa chọn từ `endingOptions`.
  2. Duyệt qua mảng `questions`. Với mỗi `question`, hiển thị `content` của nó (phần đầu câu).
  3. Cung cấp một danh sách thả xuống (dropdown) chứa các `key` từ `endingOptions` để người dùng nối thành câu hoàn chỉnh.

***

<br />

### **9. Sentence Completion**

<br />

* **Cách nhận diện:** `type` có giá trị là `"sentence_completion"`.
* **Đặc điểm cấu trúc:**
  * Sử dụng mảng `contentSegments` để tạo layout điền vào chỗ trống.
  * `contentSegments` chứa các object có `type` là `"text"` (văn bản) hoặc `"blank"` (chỗ trống).
  * Mỗi `"blank"` được liên kết với một câu hỏi trong mảng `questions` thông qua `questionId`.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Tạo một hàm xử lý chung cho `contentSegments`.
  2. Hàm này lặp qua mảng: nếu `type` là `"text"`, hiển thị `value`; nếu `type` là `"blank"`, tạo một ô nhập liệu. Ô nhập liệu này được liên kết với đáp án trong `questions` qua `questionId`.
  3. Toàn bộ các segments được hiển thị nối tiếp nhau để tạo thành một đoạn văn hoặc các câu hoàn chỉnh có chỗ trống.

***

<br />

### **10. Summary Completion**

<br />

* **Cách nhận diện:** `type` có giá trị là `"summary_completion"`.
* **Đặc điểm cấu trúc:** Tương tự `Sentence Completion`, cũng sử dụng `contentSegments`. Điểm khác biệt là thường có `groupName` để làm tiêu đề cho đoạn tóm tắt.
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Hiển thị `groupName` làm tiêu đề.
  2. Sử dụng lại hàm xử lý `contentSegments` đã mô tả ở mục 9 để tạo ra đoạn tóm tắt có chỗ trống cho người dùng điền vào.

***

<br />

### **11. Note / Table / Flow-chart / Diagram Completion**

<br />

* **Cách nhận diện:** `type` có giá trị là `"note_table_flowchart_diagram_completion"`. Đây là dạng đặc biệt nhất.
* **Đặc điểm cấu trúc:**
  * Cấu trúc này chứa một mảng `questionGroups`, trong đó **mỗi object là một dạng bài con** (Note, Table, Flow-chart...).
  * Sự phân biệt giữa các bài con này dựa vào trường `groupName` (ví dụ: "Note Completion:", "Table Completion:", ...).
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. **Vòng lặp bên ngoài:** Hệ thống phải lặp qua mảng `questionGroups`.
  2. **Phân loại:** Với mỗi `group` trong mảng, hệ thống đọc `groupName` để xác định đây là Note, Table, Flow-chart hay Diagram.
  3. **Gọi hàm xử lý riêng:** Dựa trên kết quả phân loại, hệ thống sẽ gọi một hàm render giao diện riêng cho từng loại:
     * **Note/Flow-chart/Diagram:** Sử dụng hàm xử lý `contentSegments` cơ bản, kết hợp với việc định dạng đặc thù (dùng `<li>` cho note, dùng icon mũi tên cho flow-chart, hiển thị hình ảnh cho diagram).
     * **Table:** Cần một hàm xử lý `contentSegments` nâng cao, có khả năng phân tích chuỗi văn bản (`value`) theo cú pháp `|...|...|` để tạo ra cấu trúc bảng HTML (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`). Khi gặp `blank`, chèn một `<td>` chứa ô nhập liệu.

***

<br />

### **12. Short Answer Questions**

<br />

* **Cách nhận diện:** `type` có giá trị là `"short_answer"`.
* **Đặc điểm cấu trúc:** Một danh sách các câu hỏi đơn giản trong mảng `questions`. Mỗi câu hỏi có `content` (nội dung câu hỏi) và `answer` (câu trả lời ngắn).
* **➡️ Hướng dẫn chi tiết cho hệ thống:**
  1. Duyệt qua mảng `questions`.
  2. Với mỗi câu hỏi, hiển thị `content`.
  3. Cung cấp một ô nhập liệu văn bản để người dùng điền câu trả lời.
  4. Luôn hiển thị `instructions` để người dùng biết giới hạn từ/số.

## 4. Logic xử lý Import JSON

### 4.1 Validation Rules

**Required Fields:**

* `type`: Phải thuộc 1 trong 12 types được định nghĩa

* `name`: Tên hiển thị

* `instructions`: Hướng dẫn làm bài

* `questionGroups`: Array không rỗng

**Answer Format Validation:**

```typescript
const answerFormats = {
  "multiple_choice_single": "String (A, B, C, D)",
  "choose_two_letters": "Array of strings",
  "true_false_not_given": "String (TRUE, FALSE, NOT GIVEN)",
  "yes_no_not_given": "String (YES, NO, NOT GIVEN)",
  "matching_headings": "String (i, ii, iii, iv...)",
  "matching_phrases": "String (A, B, C...)",
  "matching_features": "String (A, B, C...)",
  "matching_sentence_endings": "String (A, B, C, D...)",
  "sentence_completion": "String (word/phrase from passage)",
  "summary_completion": "String (word/phrase from passage)",
  "note_table_flowchart_diagram_completion": "String (word/phrase/number from passage)",
  "short_answer": "String (word/phrase/number from passage)"
};
```

### 4.2 Import Process

1. **File Validation**

   * Kiểm tra format JSON hợp lệ

   * Validate schema theo từng question type

   * Kiểm tra required fields

2. **Data Transformation**

   * Convert data theo cấu trúc database

   * Xử lý contentSegments cho các dạng completion

   * Tạo relationships giữa questions và options

3. **Database Storage**

   * Lưu passage information

   * Tạo question groups

   * Lưu questions với answers

   * Lưu options/headings/features/endings theo type

### 4.3 Export Process

1. **Data Retrieval**

   * Lấy passage với tất cả questions

   * Include related options/headings/features

   * Populate guide information

2. **Data Formatting**

   * Convert theo template structure

   * Tạo contentSegments cho completion types

   * Format answers theo đúng type

3. **JSON Generation**

   * Validate output structure

   * Generate downloadable JSON file

## 5. Implementation Guidelines

### 5.1 Component Structure

```
components/admin/ielts-reading/
├── ImportExport/
│   ├── JsonImporter.tsx          # JSON file import
│   ├── JsonExporter.tsx          # JSON export
│   ├── ValidationHelper.tsx      # Schema validation
│   └── DataTransformer.tsx       # Data conversion
├── QuestionTypes/
│   ├── MultipleChoice.tsx        # Type 1, 2
│   ├── TrueFalse.tsx            # Type 3, 4
│   ├── Matching.tsx             # Type 5, 6, 7, 8
│   ├── Completion.tsx           # Type 9, 10, 11
│   └── ShortAnswer.tsx          # Type 12
└── Common/
    ├── QuestionEditor.tsx        # Generic question editor
    └── GuideEditor.tsx          # Guide information editor
```

### 5.2 API Endpoints

```
POST /api/admin/ielts-reading/import-json
GET  /api/admin/ielts-reading/export-json/:passageId
POST /api/admin/ielts-reading/validate-json
```

### 5.3 Database Schema Considerations

* Sử dụng polymorphic relationships cho different question types

* JSON fields cho contentSegments và options

* Separate tables cho guide information

* Indexing cho performance

## 6. Error Handling

### 6.1 Validation Errors

* Invalid JSON format

* Missing required fields

* Invalid answer formats

* Inconsistent data structure

### 6.2 Import Errors

* Database constraint violations

* Duplicate question IDs

* Invalid relationships

* File size limitations

### 6.3 Export Errors

* Missing data

* Corrupted relationships

* Generation failures

## 7. Testing Strategy

### 7.1 Unit Tests

* Validation functions

* Data transformation

* Each question type handler

### 7.2 Integration Tests

* Complete import/export flow

* Database operations

* API endpoints

### 7.3 E2E Tests

* User workflows

* File upload/download

* Error scenarios

Tài liệu này cung cấp foundation để implement tính năng import/export JSON cho hệ thống IELTS Reading với đầy đủ 12 dạng câu hỏi.
