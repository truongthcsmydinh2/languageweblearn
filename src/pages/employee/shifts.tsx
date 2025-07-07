import React, { useEffect, useState } from 'react';

interface ShiftSlot {
  slot_id: number;
  week_start_date: string;
  day_of_week: number;
  shift_period: 'SANG' | 'CHIEU' | 'TOI';
  role: 'PHA_CHE' | 'ORDER';
  position: number;
  assigned_employee_id: string | null;
  is_fixed: boolean;
}

interface WeekOption {
  week_start_date: string;
  week_end_date: string;
}

const DAYS_OF_WEEK = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const SHIFT_PERIODS = [
  { value: 'SANG', label: 'Sáng', color: 'bg-yellow-500' },
  { value: 'CHIEU', label: 'Chiều', color: 'bg-orange-500' },
  { value: 'TOI', label: 'Tối', color: 'bg-purple-500' }
];
const ROLES = [
  { value: 'PHA_CHE', label: 'Pha chế', color: 'bg-blue-500' },
  { value: 'ORDER', label: 'Order', color: 'bg-green-500' }
];

const EmployeeShifts = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [slots, setSlots] = useState<ShiftSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [currentWeek, setCurrentWeek] = useState('');
  
  // Lấy tuần hiện tại (Thứ 2)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  // Lấy danh sách tuần đã có slot
  useEffect(() => {
    fetch('/api/employee/weeks')
      .then(res => res.json())
      .then((data: WeekOption[]) => {
        setWeeks(data);
        // Nếu tuần hiện tại có trong danh sách thì chọn, không thì chọn tuần mới nhất
        const cur = getCurrentWeekStart();
        const found = data.find(w => w.week_start_date === cur);
        if (found) setCurrentWeek(cur);
        else if (data.length > 0) setCurrentWeek(data[data.length - 1].week_start_date);
      });
  }, []);

  const getShiftPeriodLabel = (period: string) => {
    return SHIFT_PERIODS.find(p => p.value === period)?.label || period;
  };

  const getRoleLabel = (role: string, position?: number) => {
    if (role === 'PHA_CHE') return 'Pha chế';
    if (role === 'ORDER' && position === 2) return 'Order 1';
    if (role === 'ORDER' && position === 3) return 'Order 2';
    if (role === 'ORDER') return 'Order';
    return role;
  };

  // Hàm fetchSlots có loading (dùng khi đổi tuần/mã NV)
  const fetchSlotsWithLoading = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/shifts?employee_id=${employeeId}&week_start_date=${currentWeek}`);
      if (!res.ok) {
        console.error('Error fetching slots:', res.status);
        setSlots([]);
        return;
      }
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm fetchSlots cho polling (không set loading, chỉ update nếu khác dữ liệu cũ)
  const fetchSlotsPolling = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`/api/employee/shifts?employee_id=${employeeId}&week_start_date=${currentWeek}`);
      if (!res.ok) return;
      const data = await res.json();
      // So sánh dữ liệu mới và cũ, chỉ update nếu khác
      const newData = Array.isArray(data) ? data : [];
      if (JSON.stringify(newData) !== JSON.stringify(slots)) {
        setSlots(newData);
      }
    } catch (error) {
      // Bỏ qua lỗi polling
    }
  };

  useEffect(() => {
    fetchSlotsWithLoading();
    // eslint-disable-next-line
  }, [employeeId, currentWeek]);

  // Polling tự động reload slot mỗi 300ms, không set loading
  useEffect(() => {
    if (!employeeId) return;
    const interval = setInterval(() => {
      fetchSlotsPolling();
    }, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [employeeId, currentWeek]);

  const handleRegisterShift = async (slotId: number) => {
    try {
      const res = await fetch('/api/employee/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          slot_id: slotId
        })
      });

      if (res.ok) {
        fetchSlotsWithLoading();
        alert('Đăng ký ca thành công!');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi đăng ký ca!');
    }
  };

  const handleCancelShift = async (slotId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đăng ký ca này?')) return;

    try {
      const res = await fetch('/api/employee/shifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          slot_id: slotId
        })
      });

      if (res.ok) {
        fetchSlotsWithLoading();
        alert('Hủy đăng ký ca thành công!');
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi hủy đăng ký ca!');
    }
  };

  const getWeekSlots = () => {
    const weekSlots: { [key: number]: ShiftSlot[] } = {};
    
    slots.forEach(slot => {
      if (!weekSlots[slot.day_of_week]) {
        weekSlots[slot.day_of_week] = [];
      }
      weekSlots[slot.day_of_week].push(slot);
    });

    return weekSlots;
  };

  const isRegistered = (slot: ShiftSlot) => {
    return slot.assigned_employee_id === employeeId;
  };

  const canRegister = (slot: ShiftSlot) => {
    return !slot.is_fixed && !slot.assigned_employee_id;
  };

  const canCancel = (slot: ShiftSlot) => {
    return !slot.is_fixed && isRegistered(slot);
  };

  return (
    <div className="min-h-screen bg-[#10131a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Đăng ký ca làm việc</h1>
        
        {/* Employee ID Input */}
        <div className="bg-[#232733] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-white font-semibold mb-2">Mã nhân viên:</label>
              <input
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="Nhập mã nhân viên của bạn"
                className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-white font-semibold mb-2">Tuần:</label>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                  onClick={() => {
                    if (!weeks.length) return;
                    const idx = weeks.findIndex(w => w.week_start_date === currentWeek);
                    if (idx > 0) setCurrentWeek(weeks[idx - 1].week_start_date);
                  }}
                  disabled={!weeks.length || weeks.findIndex(w => w.week_start_date === currentWeek) === 0}
                >
                  ← Tuần trước
                </button>
                <select
                  value={currentWeek}
                  onChange={e => setCurrentWeek(e.target.value)}
                  className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                >
                  {weeks.map(w => (
                    <option key={w.week_start_date} value={w.week_start_date}>
                      {`Tuần ${new Date(w.week_start_date).toLocaleDateString('vi-VN')} - ${new Date(w.week_end_date).toLocaleDateString('vi-VN')}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                  onClick={() => {
                    if (!weeks.length) return;
                    const idx = weeks.findIndex(w => w.week_start_date === currentWeek);
                    if (idx < weeks.length - 1) setCurrentWeek(weeks[idx + 1].week_start_date);
                  }}
                  disabled={!weeks.length || weeks.findIndex(w => w.week_start_date === currentWeek) === weeks.length - 1}
                >
                  Tuần sau →
                </button>
              </div>
            </div>
          </div>
        </div>

        {!employeeId ? (
          <div className="text-center text-gray-400 py-12">
            Vui lòng nhập mã nhân viên để xem ca làm việc
          </div>
        ) : loading ? (
          <div className="text-center text-white py-12">Đang tải...</div>
        ) : (
          <div className="bg-[#232733] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Lịch làm việc tuần {new Date(currentWeek).toLocaleDateString('vi-VN')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.slice(1).map((day, dayIndex) => {
                const dayNumber = dayIndex + 1;
                const daySlots = getWeekSlots()[dayNumber] || [];
                
                return (
                  <div key={day} className="bg-[#181b22] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 text-center">{day}</h3>
                    
                    {daySlots.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center">Không có ca</div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map(slot => (
                          <div key={slot.slot_id} className="bg-[#232733] rounded p-3">
                            <div className="text-sm text-gray-300 mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${SHIFT_PERIODS.find(p => p.value === slot.shift_period)?.color} text-white`}>
                                  {getShiftPeriodLabel(slot.shift_period)}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${ROLES.find(r => r.value === slot.role)?.color} text-white`}>
                                  {getRoleLabel(slot.role, slot.position)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">Vị trí: {slot.position}</div>
                            </div>

                            {slot.is_fixed ? (
                              <div className="text-xs text-yellow-400 font-semibold">Cố định</div>
                            ) : isRegistered(slot) ? (
                              <div className="space-y-2">
                                <div className="text-xs text-green-400 font-semibold">Đã đăng ký ✓</div>
                                <button
                                  onClick={() => handleCancelShift(slot.slot_id)}
                                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
                                >
                                  Hủy đăng ký
                                </button>
                              </div>
                            ) : slot.assigned_employee_id ? (
                              <div className="text-xs text-gray-400">Đã có người đăng ký</div>
                            ) : (
                              <button
                                onClick={() => handleRegisterShift(slot.slot_id)}
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded"
                              >
                                Đăng ký
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 bg-[#181b22] rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Tóm tắt đăng ký</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-green-400">
                  Đã đăng ký: {slots.filter(s => isRegistered(s)).length} ca
                </div>
                <div className="text-yellow-400">
                  Có thể đăng ký: {slots.filter(s => canRegister(s)).length} ca
                </div>
                <div className="text-gray-400">
                  Tổng cộng: {slots.length} ca
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeShifts; 