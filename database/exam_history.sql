-- Tạo bảng exam_history để lưu lịch sử bài kiểm tra
CREATE TABLE IF NOT EXISTS exam_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  exam_date DATETIME NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  wrong_answers INT NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2) NOT NULL,
  settings JSON,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_firebase_uid (firebase_uid),
  INDEX idx_exam_date (exam_date)
); 