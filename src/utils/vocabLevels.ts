export const VOCAB_LEVELS = [
  { name: 'Mới', value: 0 },
  { name: 'Cấp độ 1', value: 1 },
  { name: 'Cấp độ 2', value: 2 },
  { name: 'Cấp độ 3', value: 3 },
  { name: 'Cấp độ 4', value: 4 },
  { name: 'Cấp độ 5', value: 5 },
  { name: 'Cấp độ 6', value: 6 },
  { name: 'Cấp độ 7', value: 7 },
  { name: 'Cấp độ 8', value: 8 },
  { name: 'Cấp độ 9', value: 9 },
  { name: 'Cấp độ 10', value: 10 }
];

// Tính thời gian ôn tập tiếp theo dựa trên level hiện tại (sử dụng múi giờ Việt Nam)
export const calculateNextReviewTime = (currentLevel: number): string => {
  const now = new Date();
  // Lấy múi giờ hiện tại của server
  const serverTimezoneOffset = now.getTimezoneOffset(); // phút
  // Múi giờ Việt Nam là GMT+7, tức là -420 phút so với UTC
  const vietnamTimezoneOffset = -420; // phút
  // Tính chênh lệch múi giờ
  const timezoneDiff = vietnamTimezoneOffset - serverTimezoneOffset;
  
  // Tạo ngày theo múi giờ Việt Nam
  const vietnamTime = new Date(now.getTime() + timezoneDiff * 60 * 1000);
  const nextDate = new Date(vietnamTime);

  switch (currentLevel) {
    case 0: // Ngay lập tức hoặc trong ngày
      return vietnamTime.toISOString().slice(0, 10);
    case 1: // 1 ngày sau
      nextDate.setDate(vietnamTime.getDate() + 1);
      return nextDate.toISOString().slice(0, 10);
    case 2: // 2 ngày sau
      nextDate.setDate(vietnamTime.getDate() + 2);
      return nextDate.toISOString().slice(0, 10);
    case 3: // 4 ngày sau
      nextDate.setDate(vietnamTime.getDate() + 4);
      return nextDate.toISOString().slice(0, 10);
    case 4: // 7 ngày sau
      nextDate.setDate(vietnamTime.getDate() + 7);
      return nextDate.toISOString().slice(0, 10);
    case 5: // 14 ngày sau
      nextDate.setDate(vietnamTime.getDate() + 14);
      return nextDate.toISOString().slice(0, 10);
    case 6: // 1 tháng sau
      nextDate.setMonth(vietnamTime.getMonth() + 1);
      return nextDate.toISOString().slice(0, 10);
    case 7: // 2 tháng sau
      nextDate.setMonth(vietnamTime.getMonth() + 2);
      return nextDate.toISOString().slice(0, 10);
    case 8: // 4 tháng sau
      nextDate.setMonth(vietnamTime.getMonth() + 4);
      return nextDate.toISOString().slice(0, 10);
    case 9: // 6 tháng sau
      nextDate.setMonth(vietnamTime.getMonth() + 6);
      return nextDate.toISOString().slice(0, 10);
    default:
      return vietnamTime.toISOString().slice(0, 10);
  }
};

// Lấy màu sắc tương ứng với cấp độ từ vựng
export function getLevelColor(level: number): string {
  if (level === 0) return 'red';
  if (level >= 1 && level <= 3) return 'yellow';
  if (level >= 4 && level <= 7) return 'green';
  return 'blue';
}

// Lấy trạng thái từ vựng dựa vào cấp độ
export function getLevelStatus(level: number): string {
  if (level === 0) return 'Mới';
  if (level >= 1 && level <= 3) return 'Đang học';
  if (level >= 4 && level <= 7) return 'Cơ bản';
  return 'Thành thạo';
}

// Tính toán thời gian ôn tập tiếp theo
export function getNextReviewInterval(level: number): number {
  const intervals = [
    1 * 60 * 60 * 1000,        // Level 0: 1 giờ
    4 * 60 * 60 * 1000,        // Level 1: 4 giờ
    8 * 60 * 60 * 1000,        // Level 2: 8 giờ
    24 * 60 * 60 * 1000,       // Level 3: 1 ngày
    3 * 24 * 60 * 60 * 1000,   // Level 4: 3 ngày
    7 * 24 * 60 * 60 * 1000,   // Level 5: 1 tuần
    14 * 24 * 60 * 60 * 1000,  // Level 6: 2 tuần
    30 * 24 * 60 * 60 * 1000,  // Level 7: 1 tháng
    60 * 24 * 60 * 60 * 1000,  // Level 8: 2 tháng
    120 * 24 * 60 * 60 * 1000, // Level 9: 4 tháng
    240 * 24 * 60 * 60 * 1000  // Level 10: 8 tháng
  ];
  
  return level >= 0 && level < intervals.length ? intervals[level] : intervals[0];
} 