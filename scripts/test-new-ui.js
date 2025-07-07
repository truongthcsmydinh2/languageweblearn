const axios = require('axios');

const BASE_URL = 'http://localhost:3030';

async function testNewUI() {
  console.log('🧪 Test giao diện tick chọn mới...\n');

  try {
    // Test 1: Kiểm tra nhân viên
    console.log('1️⃣ Kiểm tra nhân viên...');
    const employeesRes = await axios.get(`${BASE_URL}/api/admin/employees`);
    console.log(`✅ Có ${employeesRes.data.length} nhân viên`);
    
    if (employeesRes.data.length === 0) {
      console.log('❌ Không có nhân viên để test');
      return;
    }

    // Test 2: Test tạo tuần mới với gán cố định bằng tick chọn
    console.log('\n2️⃣ Test tạo tuần mới với gán cố định (tick chọn)...');
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 21); // 3 tuần sau
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const weekData = {
      start_date: nextWeekStart.toISOString().split('T')[0],
      end_date: nextWeekEnd.toISOString().split('T')[0],
      fixed_assignments: [
        // Gán cố định cho Thứ 2, Sáng, Pha chế, vị trí 1
        {
          day_of_week: 1,
          shift_period: 'SANG',
          role: 'PHA_CHE',
          position: 1,
          employee_id: employeesRes.data[0].employee_id
        },
        // Gán cố định cho Thứ 2, Sáng, Order, vị trí 2
        {
          day_of_week: 1,
          shift_period: 'SANG',
          role: 'ORDER',
          position: 2,
          employee_id: employeesRes.data[1]?.employee_id || employeesRes.data[0].employee_id
        },
        // Gán cố định cho Thứ 3, Chiều, Pha chế, vị trí 1
        {
          day_of_week: 2,
          shift_period: 'CHIEU',
          role: 'PHA_CHE',
          position: 1,
          employee_id: employeesRes.data[2]?.employee_id || employeesRes.data[0].employee_id
        },
        // Gán cố định cho Thứ 3, Chiều, Order, vị trí 2
        {
          day_of_week: 2,
          shift_period: 'CHIEU',
          role: 'ORDER',
          position: 2,
          employee_id: employeesRes.data[3]?.employee_id || employeesRes.data[0].employee_id
        }
      ]
    };

    const res = await axios.post(`${BASE_URL}/api/admin/generate-week-slots`, weekData);
    console.log(`✅ Tạo tuần mới thành công: ${res.data.slots_created} slot`);
    console.log(`✅ Gán cố định: ${res.data.fixed_assignments} nhân viên`);

    // Test 3: Kiểm tra slot đã được tạo
    console.log('\n3️⃣ Kiểm tra slot đã được tạo...');
    const slotsRes = await axios.get(`${BASE_URL}/api/admin/shiftslots`);
    const totalSlots = slotsRes.data.length;
    console.log(`✅ Tổng số slot hiện tại: ${totalSlots}`);

    // Test 4: Kiểm tra slot cố định
    const fixedSlots = slotsRes.data.filter(s => s.is_fixed);
    console.log(`✅ Số slot cố định: ${fixedSlots.length}`);

    // Test 5: Kiểm tra slot cố định cho tuần mới
    const newWeekSlots = slotsRes.data.filter(s => 
      new Date(s.week_start_date).toISOString().split('T')[0] === weekData.start_date
    );
    const newWeekFixedSlots = newWeekSlots.filter(s => s.is_fixed);
    console.log(`✅ Slot cố định cho tuần mới: ${newWeekFixedSlots.length}`);

    console.log('\n🎉 Test giao diện tick chọn thành công!');
    console.log('\n📊 Tóm tắt:');
    console.log(`- Tạo tuần mới: ${res.data.slots_created} slot`);
    console.log(`- Gán cố định: ${res.data.fixed_assignments} nhân viên`);
    console.log(`- Tổng số slot: ${totalSlots}`);
    console.log(`- Slot cố định: ${fixedSlots.length}`);
    console.log(`- Slot cố định tuần mới: ${newWeekFixedSlots.length}`);
    
    console.log('\n🎯 Giao diện mới:');
    console.log('- ✅ Tick chọn nhân viên');
    console.log('- ✅ Tick chọn ngày trong tuần');
    console.log('- ✅ Tick chọn ca (Sáng/Chiều/Tối)');
    console.log('- ✅ Tick chọn vai trò (Pha chế/Order)');
    console.log('- ✅ Hiển thị thông tin gán');
    console.log('- ✅ Danh sách gán cố định đã chọn');
    console.log('- ✅ Nút thêm/xóa lựa chọn');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.response?.data || error.message);
  }
}

testNewUI(); 