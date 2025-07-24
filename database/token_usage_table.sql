-- Tạo bảng token_usage để lưu trữ dữ liệu sử dụng token
CREATE TABLE IF NOT EXISTS token_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  service ENUM('google', 'openai', 'huggingface', 'anthropic') NOT NULL,
  model_name VARCHAR(100),
  tokens_in INT NOT NULL DEFAULT 0,
  tokens_out INT NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
  request_type VARCHAR(50),
  api_endpoint VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service (service),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
);

-- Thêm một số dữ liệu mẫu để test
INSERT INTO token_usage (user_id, service, model_name, tokens_in, tokens_out, cost, request_type, api_endpoint, created_at) VALUES
('admin', 'google', 'gemini-pro', 1250, 450, 0.002125, 'chat_completion', '/api/chat/gemini', '2024-01-20 10:30:00'),
('admin', 'openai', 'gpt-4', 890, 320, 0.0356, 'chat_completion', '/api/chat/openai', '2024-01-20 11:15:00'),
('admin', 'google', 'gemini-flash', 2100, 680, 0.000756, 'text_generation', '/api/generate/text', '2024-01-20 14:22:00'),
('admin', 'anthropic', 'claude-3-haiku', 1560, 420, 0.000945, 'chat_completion', '/api/chat/claude', '2024-01-20 16:45:00'),
('admin', 'huggingface', 'mixtral-8x7b', 3200, 1100, 0.00086, 'text_generation', '/api/generate/mixtral', '2024-01-20 18:30:00'),

('admin', 'google', 'gemini-pro', 980, 380, 0.00204, 'chat_completion', '/api/chat/gemini', '2024-01-21 09:15:00'),
('admin', 'openai', 'gpt-3.5-turbo', 1450, 520, 0.002955, 'chat_completion', '/api/chat/openai', '2024-01-21 12:30:00'),
('admin', 'google', 'gemini-flash', 1800, 600, 0.00066, 'text_generation', '/api/generate/text', '2024-01-21 15:20:00'),
('admin', 'anthropic', 'claude-3-opus', 750, 280, 0.01575, 'chat_completion', '/api/chat/claude', '2024-01-21 17:10:00'),

('admin', 'google', 'gemini-pro', 1100, 420, 0.00228, 'chat_completion', '/api/chat/gemini', '2024-01-22 08:45:00'),
('admin', 'openai', 'gpt-4', 1200, 450, 0.0405, 'chat_completion', '/api/chat/openai', '2024-01-22 13:25:00'),
('admin', 'huggingface', 'llama-2-70b', 2800, 950, 0.00075, 'text_generation', '/api/generate/llama', '2024-01-22 16:40:00'),
('admin', 'anthropic', 'claude-3-haiku', 1350, 480, 0.000915, 'chat_completion', '/api/chat/claude', '2024-01-22 19:15:00'),

('admin', 'google', 'gemini-flash', 2200, 750, 0.000815, 'text_generation', '/api/generate/text', '2024-01-23 10:20:00'),
('admin', 'openai', 'gpt-3.5-turbo', 1650, 580, 0.003345, 'chat_completion', '/api/chat/openai', '2024-01-23 14:35:00'),
('admin', 'google', 'gemini-pro', 920, 350, 0.001905, 'chat_completion', '/api/chat/gemini', '2024-01-23 17:50:00'),

('admin', 'google', 'gemini-pro', 1350, 480, 0.002745, 'chat_completion', '/api/chat/gemini', '2024-01-24 09:30:00'),
('admin', 'openai', 'gpt-4', 1050, 390, 0.0369, 'chat_completion', '/api/chat/openai', '2024-01-24 12:15:00'),
('admin', 'anthropic', 'claude-3-opus', 680, 250, 0.01395, 'chat_completion', '/api/chat/claude', '2024-01-24 15:45:00'),
('admin', 'huggingface', 'mixtral-8x7b', 2950, 1050, 0.0008, 'text_generation', '/api/generate/mixtral', '2024-01-24 18:20:00'),

('admin', 'google', 'gemini-flash', 1950, 680, 0.000731, 'text_generation', '/api/generate/text', '2024-01-25 11:10:00'),
('admin', 'openai', 'gpt-3.5-turbo', 1380, 490, 0.002805, 'chat_completion', '/api/chat/openai', '2024-01-25 14:25:00'),
('admin', 'google', 'gemini-pro', 1180, 430, 0.002415, 'chat_completion', '/api/chat/gemini', '2024-01-25 16:40:00');

-- Tạo view để dễ dàng query dữ liệu tổng hợp
CREATE OR REPLACE VIEW daily_token_usage AS
SELECT 
  DATE(created_at) as usage_date,
  service,
  SUM(tokens_in) as total_tokens_in,
  SUM(tokens_out) as total_tokens_out,
  SUM(tokens_in + tokens_out) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as api_calls
FROM token_usage
GROUP BY DATE(created_at), service
ORDER BY usage_date DESC, service;

CREATE OR REPLACE VIEW monthly_token_usage AS
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') as usage_month,
  service,
  SUM(tokens_in) as total_tokens_in,
  SUM(tokens_out) as total_tokens_out,
  SUM(tokens_in + tokens_out) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as api_calls
FROM token_usage
GROUP BY DATE_FORMAT(created_at, '%Y-%m'), service
ORDER BY usage_month DESC, service;