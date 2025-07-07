/**
 * Thuật toán Spaced Repetition System (SRS)
 * Dựa trên thuật toán SuperMemo-2
 */

/**
 * Tính toán độ mạnh ghi nhớ mới dựa trên kết quả ôn tập
 * @param currentStrength Độ mạnh ghi nhớ hiện tại (0-5)
 * @param performance Đánh giá hiệu suất (0-5)
 * @returns Độ mạnh ghi nhớ mới
 */
export function calculateMemoryStrength(
  currentStrength: number = 0,
  performance: number = 0
): number {
  // Ngưỡng hiệu suất tối thiểu để tăng độ mạnh
  const performanceThreshold = 3;
  
  // Nếu hiệu suất tốt, tăng độ mạnh (tối đa là 5)
  if (performance >= performanceThreshold) {
    return Math.min(currentStrength + 1, 5);
  }
  
  // Nếu hiệu suất kém, giảm độ mạnh (tối thiểu là 0)
  return Math.max(currentStrength - 1, 0);
}

/**
 * Tính toán khoảng thời gian cho lần ôn tập tiếp theo
 * @param memoryStrength Độ mạnh ghi nhớ (0-5)
 * @returns Ngày giờ ôn tập tiếp theo
 */
export function calculateNextReviewDate(memoryStrength: number): Date {
  const now = new Date();
  
  // Dựa trên độ mạnh ghi nhớ, xác định khoảng thời gian
  switch (memoryStrength) {
    case 0: // Rất yếu: 4 giờ sau
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 1: // Yếu: 1 ngày sau
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 2: // Trung bình thấp: 3 ngày sau
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case 3: // Trung bình: 1 tuần sau
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 4: // Tốt: 2 tuần sau
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case 5: // Rất tốt: 1 tháng sau
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Đánh giá hiệu suất dựa trên thời gian phản hồi và tính chính xác
 * @param isCorrect Đáp án có đúng không
 * @param responseTime Thời gian phản hồi (mili giây)
 * @returns Điểm hiệu suất (0-5)
 */
export function evaluatePerformance(
  isCorrect: boolean,
  responseTime: number = 0
): number {
  if (!isCorrect) {
    return 0; // Không đúng: 0 điểm
  }
  
  // Ngưỡng thời gian phản hồi (mili giây)
  const fastThreshold = 2000;   // 2 giây
  const mediumThreshold = 5000; // 5 giây
  
  // Đánh giá dựa trên thời gian phản hồi
  if (responseTime <= fastThreshold) {
    return 5; // Rất nhanh và đúng
  } else if (responseTime <= mediumThreshold) {
    return 4; // Khá nhanh và đúng
  } else {
    return 3; // Chậm nhưng đúng
  }
}

/**
 * Kiểm tra xem từ vựng có đến hạn ôn tập không
 * @param nextReviewDate Ngày giờ ôn tập tiếp theo
 * @returns Boolean cho biết từ đã đến hạn ôn tập hay chưa
 */
export function isDue(nextReviewDate: string | null): boolean {
  // Nếu không có ngày ôn tập tiếp theo, coi như đến hạn
  if (!nextReviewDate) return true;
  
  const now = new Date();
  const reviewDate = new Date(nextReviewDate);
  
  // Nếu ngày ôn tập đã qua hoặc là ngày hiện tại, coi như đến hạn
  return now >= reviewDate;
}
