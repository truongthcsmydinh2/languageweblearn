/**
 * Các hàm tiện ích để phát hiện loại thiết bị người dùng đang sử dụng
 */

/**
 * Kiểm tra xem thiết bị hiện tại có phải là thiết bị di động hay không
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Kiểm tra các mẫu regex phổ biến cho thiết bị di động
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

/**
 * Kiểm tra xem thiết bị hiện tại có phải là iOS (iPhone, iPad, iPod) hay không
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Kiểm tra các mẫu regex cho thiết bị iOS
  const iosRegex = /iPhone|iPad|iPod/i;
  return iosRegex.test(userAgent);
};

/**
 * Kiểm tra xem thiết bị hiện tại có phải là iPad hay không
 */
export const isIPadDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Kiểm tra iPad trong User Agent
  if (/iPad/i.test(userAgent)) {
    return true;
  }
  
  // Từ iOS 13 trở đi, iPad hiển thị là Macintosh trong User Agent
  // Cần kiểm tra thêm để phát hiện iPad với iPadOS mới
  const isIOS = /iPhone|iPod/i.test(userAgent);
  if (!isIOS && /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) {
    return true;
  }
  
  return false;
};

/**
 * Kiểm tra xem thiết bị hiện tại có phải là iPhone hay không
 */
export const isIPhoneDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Kiểm tra iPhone trong User Agent
  return /iPhone/i.test(userAgent);
};

/**
 * Kiểm tra xem thiết bị hiện tại có phải là Android hay không
 */
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Kiểm tra Android trong User Agent
  return /Android/i.test(userAgent);
};

/**
 * Lấy thông tin chi tiết về thiết bị
 */
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isIPad: false,
      isIPhone: false,
      isAndroid: false,
      userAgent: '',
      hasTouch: false
    };
  }
  
  return {
    isMobile: isMobileDevice(),
    isIOS: isIOSDevice(),
    isIPad: isIPadDevice(),
    isIPhone: isIPhoneDevice(),
    isAndroid: isAndroidDevice(),
    userAgent: navigator.userAgent,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
}; 