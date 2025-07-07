#!/bin/bash

# =====================================================
# QUICK SETUP FOR PORT 8080
# =====================================================

echo "🚀 Quick setup cho port 8080..."

# Tạo user và database
echo "📊 Đang tạo user và database..."

# Tạo user myvps
mysql -u root -e "CREATE USER IF NOT EXISTS 'myvps'@'localhost' IDENTIFIED BY 'abcd1234';" 2>/dev/null

# Cấp quyền
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'myvps'@'localhost' WITH GRANT OPTION;" 2>/dev/null

# Tạo database
mysql -u myvps -pabcd1234 -P 8080 -e "CREATE DATABASE IF NOT EXISTS vocab_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

# Chạy setup SQL
echo "📋 Đang tạo bảng..."
mysql -u myvps -pabcd1234 -P 8080 vocab_app < database_setup_8080.sql

echo "✅ Setup hoàn tất!"
echo "📊 Thông tin kết nối:"
echo "   - Host: localhost"
echo "   - Port: 8080"
echo "   - User: myvps"
echo "   - Password: abcd1234"
echo "   - Database: vocab_app" 