#!/bin/bash

# =====================================================
# VOCAB APP DATABASE SETUP SCRIPT
# =====================================================

echo "🚀 Bắt đầu setup database cho Vocab App..."

# Kiểm tra MySQL có được cài đặt chưa
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL chưa được cài đặt. Vui lòng cài đặt MySQL trước."
    echo "Ubuntu/Debian: sudo apt install mysql-server"
    echo "CentOS/RHEL: sudo yum install mysql-server"
    exit 1
fi

# Kiểm tra MySQL service có chạy không
if ! systemctl is-active --quiet mysql; then
    echo "⚠️  MySQL service chưa chạy. Đang khởi động..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

echo "✅ MySQL đã sẵn sàng"

# Tạo database và user
echo "📊 Đang tạo database và cấu hình..."

# Tạo user myvps nếu chưa có
mysql -u root -e "CREATE USER IF NOT EXISTS 'myvps'@'localhost' IDENTIFIED BY 'abcd1234';" 2>/dev/null

# Cấp quyền cho user myvps
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'myvps'@'localhost' WITH GRANT OPTION;" 2>/dev/null

# Tạo database vocab_app
mysql -u myvps -pabcd1234 -P 8080 -e "CREATE DATABASE IF NOT EXISTS vocab_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database vocab_app đã được tạo"
else
    echo "❌ Không thể tạo database. Vui lòng kiểm tra quyền truy cập MySQL"
    exit 1
fi

# Chạy script SQL để tạo bảng
echo "📋 Đang tạo các bảng và cấu trúc database..."
mysql -u myvps -pabcd1234 -P 8080 vocab_app < database_setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Các bảng đã được tạo thành công"
else
    echo "❌ Lỗi khi tạo bảng. Vui lòng kiểm tra file database_setup.sql"
    exit 1
fi

# Kiểm tra kết nối
echo "🔍 Đang kiểm tra kết nối database..."
mysql -u myvps -pabcd1234 -P 8080 -e "USE vocab_app; SHOW TABLES;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Kết nối database thành công!"
    echo ""
    echo "📊 Database đã được setup hoàn tất:"
    echo "   - Database: vocab_app"
    echo "   - Host: localhost"
    echo "   - Port: 8080"
    echo "   - User: myvps"
    echo "   - Password: abcd1234"
    echo ""
    echo "🎉 Bây giờ bạn có thể chạy ứng dụng với: npm run dev"
else
    echo "❌ Không thể kết nối database"
    exit 1
fi 