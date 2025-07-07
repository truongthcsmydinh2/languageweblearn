# Tính năng Tạo Tuần Mới - Hệ thống AssignShift

## 🆕 **Tính năng Mới: Tạo Slot cho Tuần Mới**

### **Mô tả:**
Tính năng cho phép admin tạo slot ca làm việc cho tuần mới với:
- Chọn ngày bắt đầu và ngày kết thúc
- Tự động tạo 63 slot (7 ngày × 3 ca × 3 vị trí)
- Gán nhân viên cố định ngay trong quá trình tạo
- Kiểm tra trùng lặp và validation

## 🎯 **Tính năng Chi tiết**

### **1. Giao diện Admin:**
- **Nút "Tạo tuần mới"** trong tab "Quản lý slot ca làm việc"
- **Form chọn ngày:**
  - Ngày bắt đầu (Thứ 2)
  - Ngày kết thúc (Chủ Nhật)
- **Form gán nhân viên cố định:**
  - Chọn ngày trong tuần
  - Chọn ca (Sáng/Chiều/Tối)
  - Chọn vai trò (Pha chế/Order)
  - Chọn vị trí (1-3)
  - Chọn nhân viên
  - Thêm/xóa gán cố định

### **2. API Backend:**
- **Endpoint:** `POST /api/admin/generate-week-slots`
- **Validation:**
  - Kiểm tra khoảng cách 7 ngày
  - Kiểm tra tuần chưa tồn tại
  - Validate dữ liệu đầu vào
- **Logic:**
  - Tạo 63 slot cho tuần
  - Gán nhân viên cố định theo yêu cầu
  - Set `is_fixed: true` cho slot có gán

## 📝 **Cấu trúc Dữ liệu**

### **Request Body:**
```typescript
{
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  fixed_assignments: Array<{
    day_of_week: number;      // 1-7
    shift_period: 'SANG' | 'CHIEU' | 'TOI';
    role: 'PHA_CHE' | 'ORDER';
    position: number;         // 1-3
    employee_id: string;
  }>
}
```

### **Response:**
```typescript
{
  message: string;
  slots_created: number;
  fixed_assignments: number;
}
```

## 🧪 **Test Cases**

### **Test 1: Tạo tuần mới không có gán cố định**
- ✅ Tạo thành công 63 slot
- ✅ Tất cả slot đều trống
- ✅ Không có slot cố định

### **Test 2: Tạo tuần mới với gán cố định**
- ✅ Tạo thành công 63 slot
- ✅ Gán đúng nhân viên cố định
- ✅ Slot cố định có `is_fixed: true`

### **Test 3: Validation lỗi**
- ✅ Không thể tạo tuần đã tồn tại
- ✅ Không thể tạo tuần với khoảng cách ngày không đúng
- ✅ Validation dữ liệu đầu vào

## 📊 **Kết quả Test**

```
🧪 Test tính năng tạo tuần mới...

1️⃣ Kiểm tra nhân viên hiện tại...
✅ Có 8 nhân viên

2️⃣ Test tạo tuần mới không có gán cố định...
✅ Tạo tuần mới thành công: 63 slot
✅ Gán cố định: 0 nhân viên

3️⃣ Test tạo tuần mới với gán cố định...
✅ Tạo tuần mới với gán cố định thành công: 63 slot
✅ Gán cố định: 3 nhân viên

4️⃣ Kiểm tra slot đã được tạo...
✅ Tổng số slot hiện tại: 126
✅ Số slot cố định: 3

5️⃣ Test lỗi - tạo tuần đã tồn tại...
✅ Đúng: Không thể tạo tuần đã tồn tại

6️⃣ Test lỗi - khoảng cách ngày không đúng...
✅ Đúng: Không thể tạo tuần với khoảng cách ngày không đúng

🎉 Test tính năng tạo tuần mới thành công!
```

## 🌐 **API Endpoints**

### **Tạo tuần mới:**
```
POST /api/admin/generate-week-slots
Body: {
  "start_date": "2025-07-14",
  "end_date": "2025-07-20",
  "fixed_assignments": [
    {
      "day_of_week": 1,
      "shift_period": "SANG",
      "role": "PHA_CHE",
      "position": 1,
      "employee_id": "NV001"
    }
  ]
}
```

## ✅ **Lợi ích của Tính năng**

1. **Tiết kiệm thời gian**: Tạo 63 slot chỉ với 1 click
2. **Linh hoạt**: Có thể gán nhân viên cố định ngay khi tạo
3. **An toàn**: Validation đầy đủ, tránh trùng lặp
4. **Dễ sử dụng**: Giao diện trực quan, dễ hiểu
5. **Quản lý hiệu quả**: Tạo tuần mới nhanh chóng

## 🚀 **Hướng dẫn Sử dụng**

### **Bước 1: Truy cập Admin**
- Vào `http://localhost:3030/admin/assignshift`
- Chọn tab "Quản lý slot ca làm việc"

### **Bước 2: Tạo tuần mới**
- Click nút "Tạo tuần mới"
- Chọn ngày bắt đầu (Thứ 2)
- Chọn ngày kết thúc (Chủ Nhật)

### **Bước 3: Gán nhân viên cố định (tùy chọn)**
- Click "+ Thêm gán cố định"
- Chọn ngày, ca, vai trò, vị trí, nhân viên
- Có thể thêm nhiều gán cố định

### **Bước 4: Hoàn thành**
- Click "Tạo tuần mới"
- Hệ thống sẽ tạo 63 slot và gán nhân viên cố định

## 📁 **Files được Thêm/Sửa**

### **Frontend:**
- `src/pages/admin/assignshift.tsx` - Thêm giao diện tạo tuần mới

### **Backend:**
- `src/pages/api/admin/generate-week-slots.ts` - API tạo tuần mới

### **Test:**
- `scripts/test-generate-week.js` - Script test tính năng

## 🎯 **Tính năng Hoàn chỉnh**

Hệ thống AssignShift hiện tại có đầy đủ:
- ✅ Quản lý nhân viên (CRUD)
- ✅ Quản lý slot ca làm việc
- ✅ Đăng ký/hủy ca cho nhân viên
- ✅ Logic xóa nhân viên thông minh
- ✅ **Tạo tuần mới với gán cố định** 🆕
- ✅ Kiểm tra xung đột thời gian
- ✅ Bảo vệ slot cố định
- ✅ Giao diện admin và employee
- ✅ Test cases đầy đủ

**Truy cập hệ thống:**
- Admin: `http://localhost:3030/admin/assignshift`
- Employee: `http://localhost:3030/employee/shifts` 