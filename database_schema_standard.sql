-- =============================
-- VOCAB APP - STANDARD DATABASE SCHEMA
-- =============================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(191) NOT NULL UNIQUE,
    display_name VARCHAR(191),
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_admin BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TERMS
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL,
    vocab VARCHAR(191) NOT NULL,
    meanings JSON NOT NULL,
    example_sentence TEXT,
    notes TEXT,
    part_of_speech VARCHAR(50),
    level_en INT DEFAULT 0,
    level_vi INT DEFAULT 0,
    review_time_en BIGINT DEFAULT 0,
    review_time_vi BIGINT DEFAULT 0,
    last_review_en BIGINT DEFAULT 0,
    last_review_vi BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_terms_user FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    UNIQUE KEY unique_vocab_meaning_user (vocab, meanings, firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- VOCAB SETS
CREATE TABLE IF NOT EXISTS vocab_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocab_sets_user FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SET TERMS (nhiều-nhiều)
CREATE TABLE IF NOT EXISTS set_terms (
    set_id INT NOT NULL,
    term_id INT NOT NULL,
    PRIMARY KEY (set_id, term_id),
    CONSTRAINT fk_set_terms_set FOREIGN KEY (set_id) REFERENCES vocab_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_set_terms_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TOKEN USAGE
CREATE TABLE IF NOT EXISTS token_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_key_id INT NOT NULL,
    service VARCHAR(50) NOT NULL,
    tokens_used INT DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_usage_api_key FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- DICTATION LESSONS
CREATE TABLE IF NOT EXISTS dictation_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 