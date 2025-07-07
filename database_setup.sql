-- =====================================================
-- VOCAB APP DATABASE SETUP
-- =====================================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS vocab_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vocab_app;

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(191) PRIMARY KEY,
    firebase_uid VARCHAR(191) UNIQUE NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng terms (từ vựng)
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(191) NOT NULL,
    vocab VARCHAR(255) NOT NULL,
    meaning TEXT NOT NULL,
    meanings JSON DEFAULT '[]',
    level_en INT DEFAULT 0,
    level_vi INT DEFAULT 0,
    time_added BIGINT NOT NULL,
    review_time_en BIGINT DEFAULT 0,
    review_time_vi BIGINT DEFAULT 0,
    example TEXT,
    notes TEXT,
    part_of_speech VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vocab (firebase_uid, vocab),
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_level_en (level_en),
    INDEX idx_level_vi (level_vi),
    INDEX idx_time_added (time_added)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng learning_sessions
CREATE TABLE IF NOT EXISTS learning_sessions (
    id VARCHAR(191) PRIMARY KEY,
    firebase_uid VARCHAR(191) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    score INT,
    total_questions INT,
    correct_answers INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_session_type (session_type),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(191) PRIMARY KEY,
    firebase_uid VARCHAR(191) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'vi',
    notifications BOOLEAN DEFAULT TRUE,
    daily_goal INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng vocab_sets (bộ từ vựng)
CREATE TABLE IF NOT EXISTS vocab_sets (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng vocab_set_terms (liên kết từ vựng với bộ từ)
CREATE TABLE IF NOT EXISTS vocab_set_terms (
    id VARCHAR(191) PRIMARY KEY,
    vocab_set_id VARCHAR(191) NOT NULL,
    term_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vocab_set_id) REFERENCES vocab_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_set_term (vocab_set_id, term_id),
    INDEX idx_vocab_set_id (vocab_set_id),
    INDEX idx_term_id (term_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng lessons (bài học)
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(191) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    level VARCHAR(20) DEFAULT 'beginner',
    category VARCHAR(50),
    audio_file VARCHAR(255),
    thumbnail VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng user_progress (tiến độ học tập)
CREATE TABLE IF NOT EXISTS user_progress (
    id VARCHAR(191) PRIMARY KEY,
    firebase_uid VARCHAR(191) NOT NULL,
    lesson_id VARCHAR(191),
    term_id INT,
    progress_type ENUM('lesson', 'term') NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    score INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_progress_type (progress_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm dữ liệu mẫu cho lessons
INSERT INTO lessons (id, title, content, level, category) VALUES
('lesson-001', 'Bài học cơ bản 1', 'Nội dung bài học cơ bản đầu tiên...', 'beginner', 'basic'),
('lesson-002', 'Bài học cơ bản 2', 'Nội dung bài học cơ bản thứ hai...', 'beginner', 'basic'),
('lesson-003', 'Bài học trung cấp 1', 'Nội dung bài học trung cấp...', 'intermediate', 'advanced');

-- Tạo view để thống kê
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.firebase_uid,
    u.email,
    u.display_name,
    COUNT(t.id) as total_terms,
    COUNT(CASE WHEN t.level_en >= 5 THEN 1 END) as mastered_terms_en,
    COUNT(CASE WHEN t.level_vi >= 5 THEN 1 END) as mastered_terms_vi,
    COUNT(CASE WHEN t.time_added >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) THEN 1 END) as recent_terms,
    COUNT(CASE WHEN t.review_time_en < UNIX_TIMESTAMP() THEN 1 END) as terms_to_review_en,
    COUNT(CASE WHEN t.review_time_vi < UNIX_TIMESTAMP() THEN 1 END) as terms_to_review_vi
FROM users u
LEFT JOIN terms t ON u.firebase_uid = t.firebase_uid
GROUP BY u.firebase_uid, u.email, u.display_name;

-- Tạo stored procedure để cập nhật level từ vựng
DELIMITER //
CREATE PROCEDURE UpdateTermLevel(
    IN p_term_id INT,
    IN p_language ENUM('en', 'vi'),
    IN p_new_level INT
)
BEGIN
    IF p_language = 'en' THEN
        UPDATE terms SET level_en = p_new_level WHERE id = p_term_id;
    ELSE
        UPDATE terms SET level_vi = p_new_level WHERE id = p_term_id;
    END IF;
END //
DELIMITER ;

-- Tạo trigger để tự động cập nhật updated_at
DELIMITER //
CREATE TRIGGER update_terms_updated_at
    BEFORE UPDATE ON terms
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_learning_sessions_updated_at
    BEFORE UPDATE ON learning_sessions
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//
DELIMITER ;

-- Hiển thị thông tin database
SELECT 'Database setup completed successfully!' as status;
SHOW TABLES; 