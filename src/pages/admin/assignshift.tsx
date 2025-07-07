import React, { useEffect, useState } from 'react';

interface Employee {
  employee_id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface ShiftSlot {
  slot_id: number;
  week_start_date: string;
  day_of_week: number;
  shift_period: 'SANG' | 'CHIEU' | 'TOI';
  role: 'PHA_CHE' | 'ORDER';
  position: number;
  assigned_employee_id: string | null;
  is_fixed: boolean;
  employee?: Employee;
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

const AdminAssignShift = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slots, setSlots] = useState<ShiftSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'slots' | 'workshifts'>('employees');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  
  // Employee form
  const [employeeForm, setEmployeeForm] = useState({
    employee_id: '',
    full_name: '',
    role: ''
  });
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  // Slot form
  const [slotForm, setSlotForm] = useState({
    week_start_date: '',
    day_of_week: 1,
    shift_period: 'SANG' as 'SANG' | 'CHIEU' | 'TOI',
    role: 'PHA_CHE' as 'PHA_CHE' | 'ORDER',
    position: 1,
    assigned_employee_id: '',
    is_fixed: false
  });
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [showSlotForm, setShowSlotForm] = useState(false);

  // Week generation form
  const [weekForm, setWeekForm] = useState({
    start_date: '',
    end_date: '',
    fixed_assignments: [] as Array<{
      day_of_week: number;
      shift_period: 'SANG' | 'CHIEU' | 'TOI';
      role: 'PHA_CHE' | 'ORDER';
      position: number;
      employee_id: string;
    }>
  });
  const [showWeekForm, setShowWeekForm] = useState(false);

  // New fixed assignment interface
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<('SANG' | 'CHIEU' | 'TOI')[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<('PHA_CHE' | 'ORDER')[]>([]);

  // Lấy danh sách tuần đã có slot
  const [weeks, setWeeks] = useState<{week_start_date: string, week_end_date: string}[]>([]);
  useEffect(() => {
    fetch('/api/employee/weeks')
      .then(res => res.json())
      .then((data) => {
        setWeeks(data);
        if (data.length > 0 && !selectedWeek) setSelectedWeek(data[data.length - 1].week_start_date);
      });
  }, []);

  // Lọc slot theo tuần đang chọn
  const filteredSlots = selectedWeek
    ? slots.filter(s => s.week_start_date.split('T')[0] === selectedWeek)
    : slots;

  // Tạo cấu trúc bảng ca làm việc
  const getWorkshiftTable = () => {
    // [day][period][position] = slot
    const table: any = {};
    for (let day = 1; day <= 7; day++) {
      table[day] = {};
      for (const period of SHIFT_PERIODS.map(p => p.value)) {
        table[day][period] = {};
        // Pha chế (position 1)
        table[day][period][1] = filteredSlots.find(s => s.day_of_week === day && s.shift_period === period && s.role === 'PHA_CHE' && s.position === 1);
        // Order 1 (position 2)
        table[day][period][2] = filteredSlots.find(s => s.day_of_week === day && s.shift_period === period && s.role === 'ORDER' && s.position === 2);
        // Order 2 (position 3)
        table[day][period][3] = filteredSlots.find(s => s.day_of_week === day && s.shift_period === period && s.role === 'ORDER' && s.position === 3);
      }
    }
    return table;
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      if (!res.ok) {
        console.error('Error fetching employees:', res.status);
        setEmployees([]);
        return;
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/admin/shiftslots');
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
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchSlots()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.employee_id || !employeeForm.full_name || !employeeForm.role) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const method = editingEmployee ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm)
      });

      if (res.ok) {
        setEmployeeForm({ employee_id: '', full_name: '', role: '' });
        setEditingEmployee(null);
        setShowEmployeeForm(false);
        fetchEmployees();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra!');
    }
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.week_start_date || !slotForm.day_of_week || !slotForm.shift_period || !slotForm.role || !slotForm.position) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const method = editingSlot ? 'PUT' : 'POST';
      const payload = editingSlot 
        ? { slot_id: editingSlot, assigned_employee_id: slotForm.assigned_employee_id || null, is_fixed: slotForm.is_fixed }
        : slotForm;

      const res = await fetch('/api/admin/shiftslots', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSlotForm({
          week_start_date: '',
          day_of_week: 1,
          shift_period: 'SANG',
          role: 'PHA_CHE',
          position: 1,
          assigned_employee_id: '',
          is_fixed: false
        });
        setEditingSlot(null);
        setShowSlotForm(false);
        fetchSlots();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra!');
    }
  };

  const handleWeekGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekForm.start_date || !weekForm.end_date) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc!');
      return;
    }

    try {
      const res = await fetch('/api/admin/generate-week-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weekForm)
      });

      if (res.ok) {
        alert('Tạo slot cho tuần mới thành công!');
        setWeekForm({
          start_date: '',
          end_date: '',
          fixed_assignments: []
        });
        setShowWeekForm(false);
        fetchSlots();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra!');
    }
  };

  const addFixedAssignment = () => {
    setWeekForm({
      ...weekForm,
      fixed_assignments: [
        ...weekForm.fixed_assignments,
        {
          day_of_week: 1,
          shift_period: 'SANG',
          role: 'PHA_CHE',
          position: 1,
          employee_id: ''
        }
      ]
    });
  };

  const removeFixedAssignment = (index: number) => {
    setWeekForm({
      ...weekForm,
      fixed_assignments: weekForm.fixed_assignments.filter((_, i) => i !== index)
    });
  };

  const updateFixedAssignment = (index: number, field: string, value: any) => {
    const newAssignments = [...weekForm.fixed_assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setWeekForm({
      ...weekForm,
      fixed_assignments: newAssignments
    });
  };

  // New functions for tick selection interface
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const togglePeriod = (period: 'SANG' | 'CHIEU' | 'TOI') => {
    setSelectedPeriods(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
  };

  const toggleRole = (role: 'PHA_CHE' | 'ORDER') => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const addFixedAssignmentsFromSelection = () => {
    if (!selectedEmployee || selectedDays.length === 0 || selectedPeriods.length === 0 || selectedRoles.length === 0) {
      alert('Vui lòng chọn đầy đủ: nhân viên, ngày, ca và vai trò!');
      return;
    }

    const newAssignments = [];
    for (const day of selectedDays) {
      for (const period of selectedPeriods) {
        for (const role of selectedRoles) {
          if (role === 'PHA_CHE') {
            // Chỉ tạo 1 vị trí cho Pha chế (position 1)
            newAssignments.push({
              day_of_week: day,
              shift_period: period,
              role: role,
              position: 1,
              employee_id: selectedEmployee
            });
          } else if (role === 'ORDER') {
            // Tạo 2 vị trí cho Order (position 2 và 3)
            for (let position = 2; position <= 3; position++) {
              newAssignments.push({
                day_of_week: day,
                shift_period: period,
                role: role,
                position: position,
                employee_id: selectedEmployee
              });
            }
          }
        }
      }
    }

    setWeekForm({
      ...weekForm,
      fixed_assignments: [...weekForm.fixed_assignments, ...newAssignments]
    });

    // Reset selections
    setSelectedEmployee('');
    setSelectedDays([]);
    setSelectedPeriods([]);
    setSelectedRoles([]);
  };

  const clearAllSelections = () => {
    setSelectedEmployee('');
    setSelectedDays([]);
    setSelectedPeriods([]);
    setSelectedRoles([]);
  };

  const handleDeleteEmployee = async (employee_id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id })
      });

      if (res.ok) {
        fetchEmployees();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra!');
    }
  };

  const handleDeleteSlot = async (slot_id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa slot này?')) return;

    try {
      const res = await fetch('/api/admin/shiftslots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id })
      });

      if (res.ok) {
        fetchSlots();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      alert('Có lỗi xảy ra!');
    }
  };

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

  if (loading) return <div className="text-white text-center mt-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-[#10131a] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Quản lý hệ thống AssignShift</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'employees' 
                ? 'bg-yellow-400 text-[#181b22]' 
                : 'bg-[#232733] text-gray-300 hover:bg-[#2a2d3a]'
            }`}
            onClick={() => setActiveTab('employees')}
          >
            Quản lý nhân viên
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'slots' 
                ? 'bg-yellow-400 text-[#181b22]' 
                : 'bg-[#232733] text-gray-300 hover:bg-[#2a2d3a]'
            }`}
            onClick={() => setActiveTab('slots')}
          >
            Quản lý slot ca làm việc
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'workshifts' 
                ? 'bg-yellow-400 text-[#181b22]' 
                : 'bg-[#232733] text-gray-300 hover:bg-[#2a2d3a]'
            }`}
            onClick={() => setActiveTab('workshifts')}
          >
            Ca làm việc
          </button>
        </div>

        {activeTab === 'employees' && (
          <div className="bg-[#232733] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Danh sách nhân viên</h2>
              <button
                onClick={() => setShowEmployeeForm(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-4 rounded-lg"
              >
                Thêm nhân viên
              </button>
            </div>

            {showEmployeeForm && (
              <div className="mb-6 p-4 bg-[#181b22] rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
                </h3>
                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Mã nhân viên"
                      value={employeeForm.employee_id}
                      onChange={e => setEmployeeForm({...employeeForm, employee_id: e.target.value})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                      disabled={!!editingEmployee}
                    />
                    <input
                      type="text"
                      placeholder="Họ tên"
                      value={employeeForm.full_name}
                      onChange={e => setEmployeeForm({...employeeForm, full_name: e.target.value})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    />
                    <input
                      type="text"
                      placeholder="Vai trò"
                      value={employeeForm.role}
                      onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-4 rounded-lg"
                    >
                      {editingEmployee ? 'Cập nhật' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmployeeForm(false);
                        setEditingEmployee(null);
                        setEmployeeForm({ employee_id: '', full_name: '', role: '' });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-3">Mã NV</th>
                    <th className="text-left p-3">Họ tên</th>
                    <th className="text-left p-3">Vai trò</th>
                    <th className="text-left p-3">Ngày tạo</th>
                    <th className="text-left p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.employee_id} className="border-b border-gray-700">
                      <td className="p-3">{employee.employee_id}</td>
                      <td className="p-3">{employee.full_name}</td>
                      <td className="p-3">{employee.role}</td>
                      <td className="p-3">{new Date(employee.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setEditingEmployee(employee.employee_id);
                            setEmployeeForm({
                              employee_id: employee.employee_id,
                              full_name: employee.full_name,
                              role: employee.role
                            });
                            setShowEmployeeForm(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.employee_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'slots' && (
          <div className="bg-[#232733] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Danh sách slot ca làm việc</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWeekForm(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Tạo tuần mới
                </button>
                <button
                  onClick={() => setShowSlotForm(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-4 rounded-lg"
                >
                  Thêm slot
                </button>
              </div>
            </div>

            {showWeekForm && (
              <div className="mb-6 p-4 bg-[#181b22] rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Tạo slot cho tuần mới</h3>
                <form onSubmit={handleWeekGeneration} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Ngày bắt đầu (Thứ 2):</label>
                      <div className="relative date-input-wrapper">
                        <input
                          type="date"
                          value={weekForm.start_date}
                          onChange={e => setWeekForm({...weekForm, start_date: e.target.value})}
                          className="w-full p-3 pr-10 rounded border border-yellow-400 bg-[#181b22] text-white cursor-pointer hover:border-yellow-300 focus:border-yellow-200 focus:outline-none transition-colors appearance-none"
                          required
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        />
                        <div className="calendar-icon">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Click để chọn ngày bắt đầu tuần</p>
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">Ngày kết thúc (Chủ Nhật):</label>
                      <div className="relative date-input-wrapper">
                        <input
                          type="date"
                          value={weekForm.end_date}
                          onChange={e => setWeekForm({...weekForm, end_date: e.target.value})}
                          className="w-full p-3 pr-10 rounded border border-yellow-400 bg-[#181b22] text-white cursor-pointer hover:border-yellow-300 focus:border-yellow-200 focus:outline-none transition-colors appearance-none"
                          required
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        />
                        <div className="calendar-icon">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Click để chọn ngày kết thúc tuần</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-semibold">Gán nhân viên cố định (tùy chọn):</h4>
                      <button
                        type="button"
                        onClick={addFixedAssignmentsFromSelection}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        + Thêm gán cố định
                      </button>
                    </div>

                    {/* New tick selection interface */}
                    <div className="bg-[#232733] rounded-lg p-4 mb-4">
                      <h5 className="text-white font-semibold mb-3">Chọn gán cố định:</h5>
                      
                      {/* Chọn nhân viên */}
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2">Chọn nhân viên:</label>
                        <select
                          value={selectedEmployee}
                          onChange={e => setSelectedEmployee(e.target.value)}
                          className="w-full p-2 rounded border border-yellow-400 bg-[#181b22] text-white"
                        >
                          <option value="">Chọn nhân viên</option>
                          {employees.map(emp => (
                            <option key={emp.employee_id} value={emp.employee_id}>
                              {emp.full_name} ({emp.employee_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chọn ngày */}
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2">Chọn ngày trong tuần:</label>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-1 px-3 rounded text-sm"
                            onClick={() => {
                              if (selectedDays.length === 7) setSelectedDays([]);
                              else setSelectedDays([1,2,3,4,5,6,7]);
                            }}
                          >
                            {selectedDays.length === 7 ? 'Bỏ chọn cả tuần' : 'Cả tuần'}
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {DAYS_OF_WEEK.map((day, idx) => idx > 0 && (
                            <label key={idx} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedDays.includes(idx)}
                                onChange={() => toggleDay(idx)}
                                className="w-4 h-4 text-yellow-400 bg-[#181b22] border-yellow-400 rounded focus:ring-yellow-400"
                              />
                              <span className="text-white text-sm">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Chọn ca */}
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2">Chọn ca:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {SHIFT_PERIODS.map(period => (
                            <label key={period.value} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPeriods.includes(period.value as 'SANG' | 'CHIEU' | 'TOI')}
                                onChange={() => togglePeriod(period.value as 'SANG' | 'CHIEU' | 'TOI')}
                                className="w-4 h-4 text-yellow-400 bg-[#181b22] border-yellow-400 rounded focus:ring-yellow-400"
                              />
                              <span className="text-white text-sm">{period.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Chọn vai trò */}
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2">Chọn vai trò:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {ROLES.map(role => (
                            <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.value as 'PHA_CHE' | 'ORDER')}
                                onChange={() => toggleRole(role.value as 'PHA_CHE' | 'ORDER')}
                                className="w-4 h-4 text-yellow-400 bg-[#181b22] border-yellow-400 rounded focus:ring-yellow-400"
                              />
                              <span className="text-white text-sm">{role.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Thông tin gán */}
                      {selectedEmployee && (selectedDays.length > 0 || selectedPeriods.length > 0 || selectedRoles.length > 0) && (
                        <div className="bg-[#181b22] rounded p-3 mb-3">
                          <p className="text-yellow-400 text-sm font-medium">Sẽ gán:</p>
                          <p className="text-white text-sm">
                            {employees.find(e => e.employee_id === selectedEmployee)?.full_name} 
                            {selectedDays.length > 0 && ` - ${selectedDays.length} ngày`}
                            {selectedPeriods.length > 0 && ` - ${selectedPeriods.length} ca`}
                            {selectedRoles.length > 0 && ` - ${selectedRoles.length} vai trò`}
                          </p>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={addFixedAssignmentsFromSelection}
                          disabled={!selectedEmployee || selectedDays.length === 0 || selectedPeriods.length === 0 || selectedRoles.length === 0}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                        >
                          Thêm gán cố định
                        </button>
                        <button
                          type="button"
                          onClick={clearAllSelections}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Xóa lựa chọn
                        </button>
                      </div>
                    </div>

                    {/* Hiển thị danh sách gán cố định đã chọn */}
                    {weekForm.fixed_assignments.length > 0 && (
                      <div className="bg-[#181b22] rounded-lg p-4">
                        <h5 className="text-white font-semibold mb-3">Danh sách gán cố định đã chọn:</h5>
                        <div className="space-y-2">
                          {weekForm.fixed_assignments.map((assignment, index) => {
                            const employee = employees.find(e => e.employee_id === assignment.employee_id);
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-[#232733] rounded">
                                <span className="text-white text-sm">
                                  {employee?.full_name} - {DAYS_OF_WEEK[assignment.day_of_week]} - {getShiftPeriodLabel(assignment.shift_period)} - {getRoleLabel(assignment.role, assignment.position)} - Vị trí {assignment.position}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFixedAssignment(index)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Xóa
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Tạo tuần mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWeekForm(false);
                        setWeekForm({
                          start_date: '',
                          end_date: '',
                          fixed_assignments: []
                        });
                        // Reset tick selection states
                        setSelectedEmployee('');
                        setSelectedDays([]);
                        setSelectedPeriods([]);
                        setSelectedRoles([]);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showSlotForm && (
              <div className="mb-6 p-4 bg-[#181b22] rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingSlot ? 'Sửa slot' : 'Thêm slot mới'}
                </h3>
                <form onSubmit={handleSlotSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Ngày bắt đầu tuần:</label>
                      <div className="relative date-input-wrapper">
                        <input
                          type="date"
                          value={slotForm.week_start_date}
                          onChange={e => setSlotForm({...slotForm, week_start_date: e.target.value})}
                          className="w-full p-3 pr-10 rounded border border-yellow-400 bg-[#181b22] text-white cursor-pointer hover:border-yellow-300 focus:border-yellow-200 focus:outline-none transition-colors appearance-none"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        />
                        <div className="calendar-icon">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <select
                      value={slotForm.day_of_week}
                      onChange={e => setSlotForm({...slotForm, day_of_week: parseInt(e.target.value)})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    >
                      {DAYS_OF_WEEK.map((day, idx) => idx > 0 && (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={slotForm.shift_period}
                      onChange={e => setSlotForm({...slotForm, shift_period: e.target.value as any})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    >
                      {SHIFT_PERIODS.map(period => (
                        <option key={period.value} value={period.value}>{period.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={slotForm.role}
                      onChange={e => setSlotForm({...slotForm, role: e.target.value as any})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Vị trí"
                      value={slotForm.position}
                      onChange={e => setSlotForm({...slotForm, position: parseInt(e.target.value)})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    />
                    <select
                      value={slotForm.assigned_employee_id}
                      onChange={e => setSlotForm({...slotForm, assigned_employee_id: e.target.value})}
                      className="p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.full_name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={slotForm.is_fixed}
                        onChange={e => setSlotForm({...slotForm, is_fixed: e.target.checked})}
                        className="mr-2"
                      />
                      Slot cố định
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-4 rounded-lg"
                    >
                      {editingSlot ? 'Cập nhật' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSlotForm(false);
                        setEditingSlot(null);
                        setSlotForm({
                          week_start_date: '',
                          day_of_week: 1,
                          shift_period: 'SANG',
                          role: 'PHA_CHE',
                          position: 1,
                          assigned_employee_id: '',
                          is_fixed: false
                        });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-3">Tuần</th>
                    <th className="text-left p-3">Ngày</th>
                    <th className="text-left p-3">Ca</th>
                    <th className="text-left p-3">Vai trò</th>
                    <th className="text-left p-3">Vị trí</th>
                    <th className="text-left p-3">Nhân viên</th>
                    <th className="text-left p-3">Cố định</th>
                    <th className="text-left p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot.slot_id} className="border-b border-gray-700">
                      <td className="p-3">{new Date(slot.week_start_date).toLocaleDateString('vi-VN')}</td>
                      <td className="p-3">{DAYS_OF_WEEK[slot.day_of_week]}</td>
                      <td className="p-3">{getShiftPeriodLabel(slot.shift_period)}</td>
                      <td className="p-3">{getRoleLabel(slot.role, slot.position)}</td>
                      <td className="p-3">{slot.position}</td>
                      <td className="p-3">{slot.employee?.full_name || 'Chưa gán'}</td>
                      <td className="p-3">{slot.is_fixed ? '✓' : '✗'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setEditingSlot(slot.slot_id);
                            setSlotForm({
                              week_start_date: slot.week_start_date.split('T')[0],
                              day_of_week: slot.day_of_week,
                              shift_period: slot.shift_period as 'SANG' | 'CHIEU' | 'TOI',
                              role: slot.role as 'PHA_CHE' | 'ORDER',
                              position: slot.position,
                              assigned_employee_id: slot.assigned_employee_id || '',
                              is_fixed: slot.is_fixed
                            });
                            setShowSlotForm(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.slot_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'workshifts' && (
          <div className="bg-[#232733] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Bảng ca làm việc theo tuần</h2>
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-white font-semibold">Chọn tuần:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="p-2 rounded border border-yellow-400 bg-[#181b22] text-white"
              >
                {weeks.map(w => (
                  <option key={w.week_start_date} value={w.week_start_date}>
                    {`Tuần ${new Date(w.week_start_date).toLocaleDateString('vi-VN')} - ${new Date(w.week_end_date).toLocaleDateString('vi-VN')}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-white border border-gray-700">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="p-2">Ngày</th>
                    {SHIFT_PERIODS.map(period => (
                      <th key={period.value + '-1'} className="p-2">{period.label} - Pha chế</th>
                    ))}
                    {SHIFT_PERIODS.map(period => (
                      <th key={period.value + '-2'} className="p-2">{period.label} - Order 1</th>
                    ))}
                    {SHIFT_PERIODS.map(period => (
                      <th key={period.value + '-3'} className="p-2">{period.label} - Order 2</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.slice(1).map((day, dayIdx) => {
                    const dayNumber = dayIdx + 1;
                    const table = getWorkshiftTable();
                    return (
                      <tr key={day} className="border-b border-gray-700">
                        <td className="p-2 font-semibold">{day}</td>
                        {/* Sáng/Chiều/Tối - Pha chế */}
                        {SHIFT_PERIODS.map(period => {
                          const slot = table[dayNumber][period.value][1];
                          return (
                            <td key={period.value + '-1'} className="p-2 text-center">
                              {slot?.employee?.full_name || 'Chưa gán'}
                            </td>
                          );
                        })}
                        {/* Sáng/Chiều/Tối - Order 1 */}
                        {SHIFT_PERIODS.map(period => {
                          const slot = table[dayNumber][period.value][2];
                          return (
                            <td key={period.value + '-2'} className="p-2 text-center">
                              {slot?.employee?.full_name || 'Chưa gán'}
                            </td>
                          );
                        })}
                        {/* Sáng/Chiều/Tối - Order 2 */}
                        {SHIFT_PERIODS.map(period => {
                          const slot = table[dayNumber][period.value][3];
                          return (
                            <td key={period.value + '-3'} className="p-2 text-center">
                              {slot?.employee?.full_name || 'Chưa gán'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignShift; 